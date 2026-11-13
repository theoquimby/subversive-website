# Events feed: requests for the Ops session

For Theo to take to the Subversive Ops session. The website only reads
`GET /api/public/events?days=120`; nothing in Ops was touched.

## State on 2026-11-13

The endpoint is public now (it used to answer with a login redirect, O1). It returns
`200 application/json` with `{"timezone":"America/New_York","events":[]}`.

An empty list is a valid answer, so the site shows "Nothing on the calendar yet." and no
late nights in the hours. The seed (`content/events.seed.json`, crawled from the old site)
is only used when the feed fails. **Question for Theo and Max:** are the November and
December Knicks nights and trivia meant to be entered in Ops, or should the site keep the
seed until they are? The site's rule today follows the spec: a working feed is the truth.

Note: Next keeps the last good feed in its data cache (`unstable_cache`, tag `events`)
across rebuilds, so a later outage still shows the last good list, not the seed. Ops can
refresh the site at once with `POST /api/revalidate` and the header
`x-revalidate-secret: <REVALIDATE_SECRET>` (set that variable on Vercel first).

## Fields the site would use (all optional; the site works without them)

| Field | Type | Used for |
| --- | --- | --- |
| `slug` | string | Stable event URLs that survive title edits (plan Q14) |
| `imageUrl`, `imageAlt` | URL, string | A photo on the event page |
| `ticketUrl` / `rsvpUrl` | URL | A button on the event page |
| `priceLabel` | string | "Free", "$10" on the ticket |
| `kitchenCloseOverride`, `barCloseOverride` | `HH:mm` | Exact hours on special nights |
| `kind` values `TRIVIA`, `MOVIE` | string | Filters without guessing from titles |
| `featured` | boolean | Pinning an event on Home |
| `updatedAt` | ISO instant | Cache freshness |
| `pastDays` query parameter | number | Past events and the bands list (plan Q15) |
