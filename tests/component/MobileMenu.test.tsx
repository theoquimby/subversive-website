// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileMenu } from "@/components/layout/MobileMenu";

vi.mock("next/link", () => ({
  default: ({ href, children, transitionTypes: _t, ...rest }: Record<string, unknown>) => (
    <a href={href as string} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
}));

afterEach(cleanup);

const props = {
  nav: [
    { href: "/menu", label: "Menu" },
    { href: "/visit", label: "Visit" },
  ],
  address: "96 West Bridge Street, Catskill NY",
  mapHref: "https://example.com/map",
  phone: { display: "(518) 303-1270", tel: "+15183031270" },
  instagram: "https://example.com/ig",
  facebook: "https://example.com/fb",
};

describe("MobileMenu", () => {
  it("opens from the button as a labelled dialog with numbered links", () => {
    render(<MobileMenu {...props} />);
    act(() => screen.getByRole("button", { name: "Menu" }).click());
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("link", { name: /Menu/ }).getAttribute("href")).toBe("/menu");
    expect(screen.getByRole("link", { name: "(518) 303-1270" }).getAttribute("href")).toBe(
      "tel:+15183031270",
    );
  });

  // Body scroll lock is asserted in a real browser (tests/e2e/shell.spec.ts): the lock
  // library's body attribute does not appear under happy-dom.
  it("moves focus into the sheet", async () => {
    render(<MobileMenu {...props} />);
    act(() => screen.getByRole("button", { name: "Menu" }).click());
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<MobileMenu {...props} />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    act(() => trigger.click());
    act(() => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("closes when a link is followed", () => {
    render(<MobileMenu {...props} />);
    act(() => screen.getByRole("button", { name: "Menu" }).click());
    act(() => {
      const link = screen.getByRole("link", { name: /Visit/ });
      link.addEventListener("click", (e) => e.preventDefault());
      link.click();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
