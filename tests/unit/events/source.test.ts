import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// unstable_cache is a pass-through outside Next
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));

const feed = {
  timezone: "America/New_York",
  events: [
    {
      id: "b",
      date: "2026-11-20",
      title: "B",
      kind: "MUSIC",
      closed: false,
      startTime: "19:00",
      endTime: "21:00",
    },
    {
      id: "a",
      date: "2026-11-20",
      title: "A",
      kind: "MUSIC",
      closed: false,
      startTime: "18:00",
      endTime: "20:00",
    },
  ],
};

const respond = (body: string, init: ResponseInit & { type?: string }) =>
  new Response(body, { ...init, headers: { "content-type": init.type ?? "application/json" } });

beforeEach(() => {
  vi.stubEnv("SV_TEST_NOW", "2026-11-14T17:00:00Z");
  vi.stubEnv("OPS_EVENTS_URL", "https://ops.example/api/public/events");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function run(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
  const { getEvents } = await import("@/lib/events/source");
  return getEvents();
}

describe("getEvents (spec §8.6)", () => {
  it("200 JSON → ops, sorted by date then time", async () => {
    const r = await run(async () => respond(JSON.stringify(feed), { status: 200 }));
    expect(r.origin).toBe("ops");
    expect(r.events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("a working feed with nothing upcoming → the seed, for now (Theo, 2026-11-13)", async () => {
    const empty = { timezone: "America/New_York", events: [] };
    const r = await run(async () => respond(JSON.stringify(empty), { status: 200 }));
    expect(r.origin).toBe("seed");
    expect(r.events.length).toBeGreaterThan(0);
  });

  it.each([
    ["a login redirect", async () => new Response(null, { status: 307, headers: { location: "/login" } })],
    ["200 HTML", async () => respond("<html></html>", { status: 200, type: "text/html" })],
    ["a 500", async () => respond("{}", { status: 500 })],
    ["an invalid body", async () => respond(JSON.stringify({ nope: true }), { status: 200 })],
    [
      "a network error",
      async () => {
        throw new TypeError("fetch failed");
      },
    ],
  ])("%s → the seed, from today on", async (_, impl) => {
    const r = await run(impl as () => Promise<Response>);
    expect(r.origin).toBe("seed");
    // SV_TEST_NOW is Sat 11-14: Friday's game has gone
    expect(r.events[0]?.date).toBe("2026-11-15");
    expect(r.events.every((e) => e.date >= "2026-11-14")).toBe(true);
  });
});
