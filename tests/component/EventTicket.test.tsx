// @vitest-environment happy-dom
import raw from "@content/events.seed.json";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventTicket } from "@/components/events/EventTicket";
import { enrich, type SiteEvent } from "@/lib/events/enrich";
import { parseFeed } from "@/lib/events/schema";

vi.mock("next/link", () => ({
  default: ({ href, children, transitionTypes: _t, ...rest }: Record<string, unknown>) => (
    <a href={href as string} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
}));
afterEach(cleanup);

const all = parseFeed(raw).events.map(enrich);
const game = all[0] as SiteEvent;
const trivia = all.find((e) => e.category === "trivia-movies") as SiteEvent;

describe("EventTicket (spec §4.6)", () => {
  it("one link wraps the card, named by date, title and time", () => {
    render(<EventTicket event={game} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe("/events/2026-11-13-subversive-overtime-knicks-at-pacers");
    // the name is the visible text (WCAG 2.5.3) with the full date for screen readers
    const name = links[0]?.textContent ?? "";
    expect(name).toContain("Friday, November 13");
    expect(name).toContain("Knicks at Pacers");
    expect(name).toContain("7:00 tip");
    expect(links[0]?.getAttribute("aria-label")).toBeNull();
  });

  it("the date block reads weekday, day, month", () => {
    const { container } = render(<EventTicket event={trivia} />);
    expect(container.querySelector(".ticket__stub")?.textContent).toBe("Thu10DecThursday, December 10");
    expect(container.querySelector(".event-ticket__detail")?.textContent).toBe("6:30–8:30");
  });

  it("Tonight only for today", () => {
    const { container, rerender } = render(<EventTicket event={game} />);
    expect(container.querySelector(".event-ticket__tonight")).toBeNull();
    rerender(<EventTicket event={game} tonight />);
    expect(container.querySelector(".event-ticket__tonight")).not.toBeNull();
  });
});
