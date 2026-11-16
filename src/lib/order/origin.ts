// The order routes answer only this site's own pages. A browser always sends Origin on a
// cross-site POST, so a request whose Origin is another site's is refused; a request with
// no Origin at all (curl, a server) carries no visitor's cookies or card and is let through
// to the checks that follow.
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
