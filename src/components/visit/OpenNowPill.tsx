// The pill's markup (spec §4.2): dot + the status line, linking to /visit#hours. Shared by
// the live leaf and the /dev/kit sheet of all seven states.
import type { StatusLine } from "@/lib/hours/format";
import { Link } from "../ui/Link";

export function OpenNowPill({ line, className }: { line: StatusLine; className?: string }) {
  return (
    <Link
      href="/visit#hours"
      className={className ? `open-now ${className}` : "open-now"}
      data-dot={line.dot}
    >
      <span className="open-now__dot" aria-hidden="true" />
      <span className="open-now__text">
        {line.text}
        {line.muted ? <span className="open-now__muted"> {line.muted}</span> : null}
      </span>
    </Link>
  );
}
