"use client";

// The Overtime switch (spec §5.6): when a game is on, or tips off within 3 h, the home
// hero turns to the night skin and shows the fire pit and the matchup instead of the day
// photo and stickers. Decided here in the browser, NY time via the instants; the server
// always renders Paper, so cached HTML is never wrong. Checked every minute.
import { useEffect } from "react";

const LEAD = 3 * 3600_000;
const DEFAULT_LENGTH = 3 * 3600_000;

export interface GameWindow {
  startsAt: string;
  endsAt: string | null;
}

export function isOvertime(games: readonly GameWindow[], now: number): boolean {
  return games.some((g) => {
    const start = Date.parse(g.startsAt);
    const end = g.endsAt ? Date.parse(g.endsAt) : start + DEFAULT_LENGTH;
    return now >= start - LEAD && now < end;
  });
}

export function OvertimeSwitch({ games }: { games: GameWindow[] }) {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!hero) return;
    const tick = () => {
      const on = isOvertime(games, Date.now());
      hero.toggleAttribute("data-overtime", on);
      hero.dataset.skin = on ? "overtime" : "paper";
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [games]);
  return null;
}
