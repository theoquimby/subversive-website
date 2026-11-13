// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HoursCard } from "@/components/visit/HoursCard";
import { seedHoursEvents } from "@/lib/hours/seed-events";
import { getSite } from "@/lib/site/site";
import { type IsoDate, nyInstant } from "@/lib/time/ny";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const { hours } = getSite();

describe("HoursCard (spec §4.9)", () => {
  it("seven rows, Tuesday Closed, kitchen only where it differs, specials in date order, today marked", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(nyInstant("2026-11-13" as IsoDate, 12 * 60));
    const c = render(
      <HoursCard hours={hours} events={seedHoursEvents()} today={"2026-11-13" as IsoDate} />,
    ).container;
    const week = [...c.querySelectorAll("tr[data-weekday]")];
    expect(week).toHaveLength(7);
    expect(week.map((r) => r.querySelector("th")?.textContent)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    const tue = c.querySelector('tr[data-weekday="tue"]');
    expect(tue?.querySelector(".hours__time")?.textContent).toBe("Closed");
    expect(c.querySelector('tr[data-weekday="mon"] .hours__kitchen')?.textContent).toBe("");
    expect(c.querySelector('tr[data-weekday="fri"] .hours__kitchen')?.textContent).toBe("kitchen til 8:15");
    // today (Fri Nov 13) is a game night: today's own row shows tonight's real close
    expect(c.querySelector('tr[data-weekday="fri"] .hours__time')?.textContent).toBe("4:30–9:30");
    // another day keeps its regular hours
    expect(c.querySelector('tr[data-weekday="sat"] .hours__time')?.textContent).toBe("12–8:30");

    const special = [...c.querySelectorAll("tr[data-date]")].map((r) => r.getAttribute("data-date"));
    expect(special).toEqual(["2026-11-13", "2026-11-15", "2026-11-21", "2026-11-25"]);
    expect(c.querySelector('tr[data-date="2026-11-13"] .hours__time')?.textContent).toBe("4:30–9:30");

    expect(c.querySelector('tr[data-weekday="fri"]')?.hasAttribute("data-today")).toBe(true);
    expect(c.querySelector('tr[data-weekday="sat"]')?.hasAttribute("data-today")).toBe(false);
    expect(c.querySelector("caption")?.textContent).toBe("Hours");
  });
});
