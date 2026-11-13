import raw from "@content/events.seed.json";
import { describe, expect, it } from "vitest";
import { buildIcs, fold, googleCalendarUrl } from "@/lib/events/calendar";
import { classify, detectSeries, normalizeTitle, seriesLabel } from "@/lib/events/classify";
import { renderDescription } from "@/lib/events/description";
import { enrich, type SiteEvent } from "@/lib/events/enrich";
import { goodToKnow } from "@/lib/events/facts";
import {
  countdownLabel,
  gamePhase,
  matchupSpeech,
  parseMatchup,
  TEAM_CODES,
  teamCode,
} from "@/lib/events/matchup";
import { type FeedEvent, parseFeed } from "@/lib/events/schema";
import { eventSlug, kebab, parseSlug, resolveSlug } from "@/lib/events/slug";
import { scheduleFor } from "@/lib/hours/schedule";
import { getSite } from "@/lib/site/site";
import type { IsoDate } from "@/lib/time/ny";

const site = getSite();
const seed = parseFeed(raw).events.map(enrich);
const d = (s: string) => s as IsoDate;
const feedEvent = (o: Record<string, unknown> & { id: string; date: string; title: string }): FeedEvent =>
  parseFeed({ timezone: "America/New_York", events: [{ kind: "OTHER", closed: false, ...o }] })
    .events[0] as FeedEvent;
const ev = (o: Parameters<typeof feedEvent>[0]): SiteEvent => enrich(feedEvent(o));

describe("parseFeed (plan §5.4)", () => {
  it("the seed parses", () => {
    expect(seed).toHaveLength(9);
    expect(seed[0]?.title).toBe("Subversive Overtime: Knicks at Pacers");
  });
  it("a wrong timezone or no events throws", () => {
    expect(() => parseFeed({ timezone: "UTC", events: [] })).toThrow();
    expect(() => parseFeed({ timezone: "America/New_York" })).toThrow();
  });
  it("one bad event is dropped, the rest kept", () => {
    const f = parseFeed({
      timezone: "America/New_York",
      events: [
        { id: "a", date: "2026-13-40", title: "x" },
        { id: "b", date: "2026-12-01", title: "ok" },
      ],
    });
    expect(f.events.map((e) => e.id)).toEqual(["b"]);
  });
  it("unknown kind → OTHER with kindRaw; missing times → null; future fields pass", () => {
    const e = feedEvent({
      id: "x",
      date: "2026-12-01",
      title: "Movie",
      kind: "MOVIE" as never,
      startTime: "" as never,
      priceLabel: "$5",
    });
    expect(e.kind).toBe("OTHER");
    expect(e.kindRaw).toBe("MOVIE");
    expect(e.startTime).toBeNull();
    expect(e.endTime).toBeNull();
    expect(e.priceLabel).toBe("$5");
    expect(e.description).toBe("");
  });
});

describe("classify and series", () => {
  it("each kind", () => {
    expect(classify({ kind: "GAME", title: "x" })).toBe("games");
    expect(classify({ kind: "MUSIC", title: "x" })).toBe("music");
    expect(classify({ kind: "FESTIVAL", title: "x" })).toBe("festivals");
    expect(classify({ kind: "HOLIDAY", title: "x" })).toBe("notice");
    expect(classify({ kind: "CLOSURE", title: "x" })).toBe("notice");
    expect(classify({ kind: "OTHER", title: "Trivia with Smarty Pints" })).toBe("trivia-movies");
    expect(classify({ kind: "OTHER", title: "Free Movie Night" })).toBe("trivia-movies");
    expect(classify({ kind: "OTHER", title: "First Friday" })).toBe("other");
  });
  it("normalizeTitle", () => {
    expect(normalizeTitle("Trivia with Smarty Pints! 12")).toBe("trivia with smarty pints");
  });
  it("three fortnightly Thursdays → every other Thursday; irregular → null; two → none", () => {
    const t = (date: string) => ev({ id: date, date, title: "Trivia with Smarty Pints" });
    const s = detectSeries([t("2026-12-10"), t("2026-12-24"), t("2027-01-07")]);
    expect(s[0]?.cadence).toBe("every-other-week");
    expect(s[0] && seriesLabel(s[0])).toBe("+ every other Thursday");
    expect(detectSeries([t("2026-12-10"), t("2026-12-24"), t("2027-01-14")])[0]?.cadence).toBeNull();
    expect(detectSeries([t("2026-12-10"), t("2026-12-24")])).toEqual([]);
  });
});

describe("matchup (spec §4.7)", () => {
  it("parses at and vs", () => {
    expect(parseMatchup("Subversive Overtime: Knicks at Pacers")).toEqual({
      venue: "at",
      opponent: "Pacers",
      code: "IND",
      label: "Knicks at Pacers",
    });
    expect(parseMatchup("Knicks vs. Blazers")).toMatchObject({
      venue: "vs",
      code: "POR",
      label: "Knicks vs. Blazers",
    });
    expect(parseMatchup("Knicks vs Nets")).toMatchObject({ venue: "vs", code: "BKN" });
    expect(parseMatchup("Trivia with Smarty Pints")).toBeNull();
  });
  it("all 29 opponents have codes; unknown → first three letters", () => {
    expect(new Set(Object.values(TEAM_CODES)).size).toBe(29);
    expect(teamCode("Portland Trail Blazers")).toBe("POR");
    expect(teamCode("Sonics")).toBe("SON");
  });
  it("phases and countdown", () => {
    const g = seed[0] as SiteEvent; // Fri 11-13 19:00–21:30
    const at = (iso: string) => new Date(iso);
    expect(gamePhase(g, at("2026-11-13T16:46:00-05:00"))).toBe("before");
    expect(countdownLabel(g, at("2026-11-13T16:46:00-05:00"))).toBe("Tip in 2h 14m");
    expect(countdownLabel(g, at("2026-11-13T18:46:00-05:00"))).toBe("Tip in 14m");
    expect(countdownLabel(g, at("2026-11-13T20:00:00-05:00"))).toBe("On now");
    expect(countdownLabel(g, at("2026-11-13T22:00:00-05:00"))).toBe("Final");
    expect(countdownLabel(g, at("2026-11-11T18:00:00-05:00"))).toBe("");
    expect(matchupSpeech(g)).toBe("Knicks at Pacers, tipoff 7 PM");
  });
});

describe("slugs (spec §6.3, Q14)", () => {
  it("seed slugs; diacritics; 60-char cap; the feed's slug wins", () => {
    expect(seed[0]?.slug).toBe("2026-11-13-subversive-overtime-knicks-at-pacers");
    expect(kebab("Märzen & Friends!")).toBe("marzen-friends");
    expect(kebab("x".repeat(80))).toHaveLength(60);
    expect(eventSlug({ slug: "custom", date: d("2026-12-01"), title: "T" })).toBe("custom");
    expect(parseSlug("2026-11-13-a-b")).toEqual({ date: "2026-11-13", rest: "a-b" });
    expect(parseSlug("nope")).toBeNull();
  });
  it("resolveSlug", () => {
    const today = d("2026-11-13");
    expect(resolveSlug("2026-11-13-subversive-overtime-knicks-at-pacers", seed, today).type).toBe("found");
    expect(resolveSlug("2026-11-13-old-title", seed, today)).toEqual({
      type: "redirect",
      slug: "2026-11-13-subversive-overtime-knicks-at-pacers",
    });
    const two = [...seed, ev({ id: "x", date: "2026-11-13", title: "Second thing" })];
    expect(resolveSlug("2026-11-13-old-title", two, today).type).toBe("missing");
    expect(resolveSlug("2026-10-01-oktoberfest", seed, today)).toEqual({ type: "over", date: "2026-10-01" });
    expect(resolveSlug("garbage", seed, today).type).toBe("missing");
  });
});

describe("renderDescription", () => {
  it("paragraphs, emoji lists, links, plain text", () => {
    const blocks = renderDescription("First line.\n\n🍺 Beer\n🍔 Burgers\n\nSee https://example.com/x.");
    expect(blocks).toEqual([
      { type: "p", parts: [{ text: "First line." }] },
      { type: "list", items: [[{ text: "Beer" }], [{ text: "Burgers" }]] },
      {
        type: "p",
        parts: [{ text: "See " }, { href: "https://example.com/x", text: "example.com/x" }, { text: "." }],
      },
    ]);
    expect(renderDescription("Plain.")).toEqual([{ type: "p", parts: [{ text: "Plain." }] }]);
  });
});

describe("calendar", () => {
  const g = seed[0] as SiteEvent;
  const ics = buildIcs(g, site, "https://example.test", new Date("2026-11-01T00:00:00Z"));
  it("CRLF, zone, UID, escaped commas, folded lines", () => {
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(ics).toContain("DTSTART;TZID=America/New_York:20261113T190000");
    expect(ics).toContain("DTEND;TZID=America/New_York:20261113T213000");
    expect(ics).toContain(`UID:${g.id}@drinksubversive.com`);
    expect(ics).toContain("LOCATION:Subversive\\, 96 West Bridge Street\\, Catskill");
    expect(fold("x".repeat(100)).split("\r\n ")).toHaveLength(2);
  });
  it("an end after midnight lands on the next date", () => {
    const late = ev({
      id: "l",
      date: "2026-11-28",
      title: "Late",
      startTime: "21:00" as never,
      endTime: "00:30" as never,
    });
    expect(buildIcs(late, site, "https://example.test")).toContain(
      "DTEND;TZID=America/New_York:20261129T003000",
    );
  });
  it("Google dates are UTC", () => {
    expect(googleCalendarUrl(g, site)).toContain("dates=20261114T000000Z%2F20261114T023000Z");
  });
});

describe("goodToKnow", () => {
  it("a game past close gives the kitchen and the buzzer; Free only when said", () => {
    const g = seed[0] as SiteEvent;
    const s = scheduleFor(g.date, site, seed);
    expect(goodToKnow(g, s)).toEqual(["Kitchen til 8:15", "Bar open through the final buzzer"]);
    const free = ev({ id: "f", date: "2026-12-03", title: "Movie", description: "Free entry." });
    expect(goodToKnow(free, scheduleFor(free.date, site, [free]))).toContain("Free");
    const notFree = ev({ id: "n", date: "2026-12-03", title: "Movie", description: "Freedom fries." });
    expect(goodToKnow(notFree, scheduleFor(notFree.date, site, [notFree]))).not.toContain("Free");
  });
});
