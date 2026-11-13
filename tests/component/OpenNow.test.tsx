// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenNowLive } from "@/components/visit/OpenNowLive";
import type { StatusLine } from "@/lib/hours/format";
import { getSite } from "@/lib/site/site";
import { type HHmm, type IsoDate, nyInstant, toMinutes } from "@/lib/time/ny";

vi.mock("next/link", () => ({
  default: ({ href, children, transitionTypes: _t, ...rest }: Record<string, unknown>) => (
    <a href={href as string} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
}));

const { hours } = getSite();
const at = (date: string, time: string) => nyInstant(date as IsoDate, toMinutes(time as HHmm));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const mount = (initial: StatusLine) =>
  render(<OpenNowLive initial={initial} hours={hours} events={[]} />).container;

describe("OpenNowLive (spec §4.2)", () => {
  it("renders the dot and both text parts, and links to /visit#hours", () => {
    vi.setSystemTime(at("2026-11-20", "17:00"));
    const c = mount({ dot: "hollow", text: "server line" });
    const a = c.querySelector("a");
    expect(a?.getAttribute("href")).toBe("/visit#hours");
    // recomputed on mount from the clock
    expect(a?.dataset.dot).toBe("go");
    expect(c.textContent).toContain("Open now · til 8:30");
    expect(c.querySelector(".open-now__muted")?.textContent).toContain("· kitchen til 8:15");
  });

  it("recomputes 30 s past closing", () => {
    vi.setSystemTime(at("2026-11-20", "20:29"));
    const c = mount({ dot: "go", text: "x" });
    expect(c.textContent).toContain("Bar open til 8:30");
    act(() => {
      vi.setSystemTime(at("2026-11-20", "20:30"));
      vi.advanceTimersByTime(30_000);
    });
    expect(c.textContent).toContain("Closed now · opens Sat at 12");
    expect(c.querySelector("a")?.dataset.dot).toBe("hollow");
  });

  it("recomputes when the tab comes back", () => {
    vi.setSystemTime(at("2026-11-17", "12:00"));
    const c = mount({ dot: "go", text: "x" });
    expect(c.textContent).toContain("Closed Tuesdays · back Wed at 4:30");
    act(() => {
      vi.setSystemTime(at("2026-11-18", "17:00"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(c.textContent).toContain("Open now · til 8");
  });
});
