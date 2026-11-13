// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { ExternalLink, TextLink } from "@/components/ui/TextLink";

afterEach(cleanup);

describe("Button", () => {
  it("renders an external link with rel=noopener and the external arrow", () => {
    const { container } = render(
      <Button href="https://example.com/order" external>
        Order pickup
      </Button>,
    );
    const a = screen.getByRole("link", { name: "Order pickup" });
    expect(a.getAttribute("rel")).toContain("noopener");
    expect(container.querySelector(".icon--external")).not.toBeNull();
  });

  it("is not focusable or clickable when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Order pickup
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Order pickup" }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    b.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a disabled link as a non-link", () => {
    render(
      <Button href="/menu" disabled>
        See the menu
      </Button>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("See the menu").closest("[aria-disabled]")).not.toBeNull();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Directions</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });
});

describe("links", () => {
  it("external text links carry rel=noopener and the arrow", () => {
    const { container } = render(<ExternalLink href="https://example.com">Book your band</ExternalLink>);
    expect(screen.getByRole("link").getAttribute("rel")).toContain("noopener");
    expect(container.querySelector(".icon--external")).not.toBeNull();
  });

  it("internal text links have no arrow", () => {
    const { container } = render(<TextLink href="/visit">Directions</TextLink>);
    expect(container.querySelector(".icon--external")).toBeNull();
  });
});
