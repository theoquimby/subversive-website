// Chevron band (spec §3.3): the barley kernel repeated as a lattice, 30 px tall. Separates a
// photo from a colour field, and is the "tread" on spruce and night sections.
export function Chevrons({ tone = "fg", className }: { tone?: "fg" | "accent" | "bg"; className?: string }) {
  return (
    <div
      className={["chevrons", className ?? ""].filter(Boolean).join(" ")}
      data-tone={tone}
      aria-hidden="true"
    />
  );
}
