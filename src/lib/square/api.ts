// Square's REST API, called directly (no SDK: three endpoints do not earn a dependency).
//
// Ordering is OFF unless every one of these is set (in Vercel, by Theo; never in the repo):
//   NEXT_PUBLIC_ORDERING=on    (also builds the Order button and the card form's security settings in)
//   SQUARE_ACCESS_TOKEN        the secret; server only
//   SQUARE_LOCATION_ID         the taproom's location
//   SQUARE_APPLICATION_ID      public; the browser's card form needs it
//   SQUARE_ENVIRONMENT         "production" to take real money; anything else is the sandbox
// The sandbox is the default on purpose: a half-finished setup can never charge a card.
//
// Facts checked against developer.squareup.com on 2026-11-15 and again on 2026-11-18: base
// URLs, headers, the version date (2026-09-16 is a released version; 2026-11-18 is the
// newest and has not been tried), CreateOrder, CalculateOrder, CreatePayment and their
// error shape. Nothing here has talked to Square yet: see docs/ordering.md.

const VERSION = "2026-09-16";

export interface SquareEnv {
  sandbox: boolean;
  base: string;
  token: string;
  locationId: string;
  applicationId: string;
}

export function squareEnv(): SquareEnv | null {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  if (process.env.NEXT_PUBLIC_ORDERING !== "on" || !token || !locationId || !applicationId) return null;
  const sandbox = process.env.SQUARE_ENVIRONMENT !== "production";
  // Square's sandbox application ids begin "sandbox-". A sandbox id with production
  // switched on (or the reverse) is a half-changed set-up: stay off rather than guess.
  if (applicationId.startsWith("sandbox-") !== sandbox) {
    console.warn("order: SQUARE_APPLICATION_ID and SQUARE_ENVIRONMENT disagree; ordering stays off");
    return null;
  }
  return {
    sandbox,
    base: sandbox ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2",
    token,
    locationId,
    applicationId,
  };
}

export interface SquareIssue {
  category?: string;
  code: string;
  detail?: string;
  field?: string;
}

export class SquareError extends Error {
  readonly status: number;
  readonly issues: SquareIssue[];
  constructor(status: number, issues: SquareIssue[]) {
    super(`Square answered ${status}: ${issues.map((i) => i.code).join(", ") || "no detail"}`);
    this.name = "SquareError";
    this.status = status;
    this.issues = issues;
  }
  has(code: string) {
    return this.issues.some((i) => i.code === code);
  }
}

/** One call. Returns the parsed JSON body; throws SquareError on any non-2xx answer. */
export async function square(
  env: SquareEnv,
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<unknown> {
  const res = await fetch(`${env.base}${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: {
      authorization: `Bearer ${env.token}`,
      "square-version": VERSION,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // an empty or non-JSON body: handled by the status below
  }
  if (!res.ok) {
    const raw = (json as { errors?: unknown } | null)?.errors;
    const issues = Array.isArray(raw)
      ? raw.flatMap((e) =>
          e && typeof e === "object" && typeof (e as SquareIssue).code === "string"
            ? [
                {
                  code: (e as SquareIssue).code,
                  category: (e as SquareIssue).category,
                  detail: (e as SquareIssue).detail,
                  field: (e as SquareIssue).field,
                },
              ]
            : [],
        )
      : [];
    throw new SquareError(res.status, issues);
  }
  return json;
}
