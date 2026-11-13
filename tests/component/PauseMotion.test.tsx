// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PauseMotion } from "@/components/layout/PauseMotion";

afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-motion");
});

describe("PauseMotion", () => {
  it("toggles data-motion on <html> and persists the choice", () => {
    render(<PauseMotion />);
    const b = screen.getByRole("button", { name: "Pause motion" });
    expect(b.getAttribute("aria-pressed")).toBe("false");
    act(() => b.click());
    expect(document.documentElement.getAttribute("data-motion")).toBe("paused");
    expect(window.localStorage.getItem("sv.motion")).toBe("paused");
    const again = screen.getByRole("button", { name: "Play motion" });
    expect(again.getAttribute("aria-pressed")).toBe("true");
    act(() => again.click());
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
    expect(window.localStorage.getItem("sv.motion")).toBe("playing");
  });

  it("restores a paused choice on load", () => {
    window.localStorage.setItem("sv.motion", "paused");
    render(<PauseMotion />);
    expect(screen.getByRole("button", { name: "Play motion" })).toBeTruthy();
    expect(document.documentElement.getAttribute("data-motion")).toBe("paused");
  });
});
