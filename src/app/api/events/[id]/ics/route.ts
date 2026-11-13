// Calendar file for one event (spec §6.3): text/calendar, named after the event's slug.
import { buildIcs } from "@/lib/events/calendar";
import { getEvents } from "@/lib/events/source";
import { getSite } from "@/lib/site/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://subversive-website.vercel.app";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { events } = await getEvents();
  const e = events.find((x) => x.id === id);
  if (!e) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(e, getSite(), SITE_URL), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${e.slug}.ics"`,
      "cache-control": "public, max-age=300",
    },
  });
}
