// Row badge (plan Q10): a static tag in Utility type for menu rows — "Flagship",
// "15% to CCSM", "Seasonal". No peel, no drag, and it does not count toward the
// three-stickers-per-viewport limit. No sky tone: ink on sky is Lc 46, below the 60 a
// label needs (tokens.contrast.test.ts).
export function Badge({ children, tone = "pils" }: { children: string; tone?: "pils" | "currant" }) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}
