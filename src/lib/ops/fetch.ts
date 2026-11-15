// Reading the Ops app's public feeds (contract: subversive-ops/docs/website-integration.md).
// Read-only, always with a fallback: any answer that is not a 200 with JSON counts as
// "use the website's own file". Nothing is read until OPS_BASE_URL is set, so the site
// behaves exactly as before until Theo turns the feeds on.
export function opsBase(): string {
  return (process.env.OPS_BASE_URL ?? "").replace(/\/+$/, "");
}

export async function fetchOps(path: string): Promise<unknown> {
  const base = opsBase();
  if (!base) throw new Error("OPS_BASE_URL is not set");
  const res = await fetch(`${base}${path}`, { redirect: "manual", headers: { accept: "application/json" } });
  if (res.status !== 200) throw new Error(`ops ${path}: HTTP ${res.status}`);
  if (!(res.headers.get("content-type") ?? "").includes("json")) throw new Error(`ops ${path}: not JSON`);
  return res.json();
}
