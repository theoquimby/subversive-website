// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Ticker } from "@/components/events/Ticker";

vi.mock("next/link", () => ({
  default: ({ href, children, transitionTypes: _t, ...rest }: Record<string, unknown>) => (
    <a href={href as string} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
}));
afterEach(cleanup);
// happy-dom has no IntersectionObserver
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

const items = [
  { href: "/events/a", label: "Fri Nov 13 · Knicks at Pacers" },
  { href: "/events/b", label: "Sun Nov 15 · Knicks at Raptors" },
];

describe("Ticker (spec §4.10)", () => {
  it("real links once; the loop's copy is aria-hidden and out of the tab order", () => {
    const { container } = render(<Ticker items={items} label="Coming up" />);
    const runs = container.querySelectorAll(".ticker__run");
    expect(runs).toHaveLength(2);
    expect(runs[0]?.getAttribute("aria-hidden")).toBeNull();
    expect(runs[1]?.getAttribute("aria-hidden")).toBe("true");
    for (const a of runs[1]?.querySelectorAll("a") ?? []) expect(a.getAttribute("tabindex")).toBe("-1");
  });

  it("is a labelled navigation", () => {
    const { container } = render(<Ticker items={items} label="Coming up" />);
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("Coming up");
  });

  it("renders nothing with no events", () => {
    const { container } = render(<Ticker items={[]} label="Coming up" />);
    expect(container.innerHTML).toBe("");
  });
});
