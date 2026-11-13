// The one place the site asks for the current time (plan §4, §5.1).
// SV_TEST_NOW (an ISO instant) freezes server time for tests; production ignores it
// unless SV_E2E=1 is set for an e2e run against a production build.

export function now(): Date {
  const frozen = process.env.SV_TEST_NOW;
  const allowed = process.env.NODE_ENV !== "production" || process.env.SV_E2E === "1";
  if (frozen && allowed) {
    const d = new Date(frozen);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
