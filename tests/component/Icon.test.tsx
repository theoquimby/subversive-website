// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Icon } from "@/components/graphics/Icon";
import { ICON_NAMES } from "@/components/graphics/icons.generated";

afterEach(cleanup);

describe("Icon", () => {
  it("is hidden from assistive tech when decorative", () => {
    const { container } = render(<Icon name="pin" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("title")).toBeNull();
  });

  it("carries a title and an img role when named", () => {
    render(<Icon name="phone" title="Call" />);
    expect(screen.getByRole("img", { name: "Call" })).toBeTruthy();
  });

  it("points at a symbol that exists in the sprite, for every name", () => {
    const sprite = readFileSync(join(process.cwd(), "public/brand/icons.svg"), "utf8");
    for (const name of ICON_NAMES) expect(sprite).toContain(`id="icon-${name}"`);
  });
});
