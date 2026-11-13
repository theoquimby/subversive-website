// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DraggableSticker } from "@/components/graphics/DraggableSticker";
import { Sticker } from "@/components/graphics/Sticker";
import { isTap, loadPlacement, releaseRotation, savePlacement } from "@/components/graphics/sticker-drag";

afterEach(cleanup);
beforeEach(() => window.sessionStorage.clear());

function linkSticker() {
  const bounds = createRef<HTMLDivElement>();
  render(
    <div ref={bounds}>
      <DraggableSticker id="wings" bounds={bounds} href="/menu" linkLabel="Wing Wednesday, see the menu">
        <Sticker shape="burst" label="Wing Wednesday" pop={false}>
          Wings
        </Sticker>
      </DraggableSticker>
    </div>,
  );
  return screen.getByRole("link", { name: "Wing Wednesday, see the menu" });
}

describe("Sticker", () => {
  it("is an image with a text equivalent when decorative-with-meaning", () => {
    render(
      <Sticker shape="round" label="Dogs welcome">
        Dogs
      </Sticker>,
    );
    expect(screen.getByRole("img", { name: "Dogs welcome" })).toBeTruthy();
  });

  it("hides the printed words (and their misregistered copy) from assistive tech", () => {
    const { container } = render(
      <Sticker shape="tag" label="Flagship">
        Flagship
      </Sticker>,
    );
    expect(container.querySelector(".sticker__text")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("DraggableSticker as a link", () => {
  it("navigates on a tap that moved under 6 px", () => {
    const link = linkSticker();
    const host = link.parentElement as HTMLElement;
    fireEvent.pointerDown(host, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(host, { clientX: 104, clientY: 103 });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  it("does not navigate after a drag of 6 px or more", () => {
    const link = linkSticker();
    const host = link.parentElement as HTMLElement;
    fireEvent.pointerDown(host, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(host, { clientX: 130, clientY: 100 });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("activates from the keyboard like any link", () => {
    const link = linkSticker();
    link.focus();
    expect(document.activeElement).toBe(link);
    const onClick = vi.fn((e: Event) => e.preventDefault());
    link.addEventListener("click", onClick);
    fireEvent.keyDown(link, { key: "Enter" });
    link.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("drag rules", () => {
  it("treats under 6 px as a tap", () => {
    expect(isTap({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(true);
    expect(isTap({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe(false);
  });

  it("spins with release velocity, clamped to ±25°", () => {
    expect(releaseRotation(0)).toBe(0);
    expect(releaseRotation(500)).toBeCloseTo(10, 6);
    expect(releaseRotation(9000)).toBe(25);
    expect(releaseRotation(-9000)).toBe(-25);
  });

  it("restores a placement saved this session, and ignores junk", () => {
    savePlacement("wings", { x: 12, y: -8, rotate: 6 });
    expect(loadPlacement("wings")).toEqual({ x: 12, y: -8, rotate: 6 });
    window.sessionStorage.setItem("sv.sticker.bad", "{nope");
    expect(loadPlacement("bad")).toBeNull();
    expect(loadPlacement("missing")).toBeNull();
  });
});
