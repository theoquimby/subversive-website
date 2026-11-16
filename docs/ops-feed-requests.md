# Ops as Max's one hub: what the website reads, and what Ops needs to add

For Theo to take to the Subversive Ops session (repo `theoquimby/subversive-ops`). The
website only ever reads public, read-only endpoints; nothing in Ops is changed from the
website's repo (CLAUDE.md).

**Goal (Theo, 2026-11-13):** Max runs the business from one place, Ops. Anything a guest
sees that Max might change (events, closures, hours, the menu and the tap list, a notice)
is entered once in Ops and appears on the website by itself.

Every feed below follows the pattern the events feed already uses: the website reads the
live feed first and falls back to its own file (`content/*.json`) if the feed is down, so
the website never breaks while Ops catches up.

## 1. Events and closures: live

`GET /api/public/events?days=120` (Ops: `src/app/api/public/events/route.ts`). The shape
matches the website exactly. Events entered in Ops appear on the website within 5 minutes:
on `/events`, on each event page, in the ticker, and as late hours or closures in the
open-now pill and the hours card (a `CLOSURE` closes the day; an event ending after
closing time keeps the bar open late).

State on 2026-11-13: the feed is public and returns an empty list. Until Max enters events,
the website shows the seed (`content/events.seed.json`). When Ops holds the calendar, set
`EMPTY_FEED_USES_SEED` to `false` in `src/lib/events/source.ts`.

Optional fields the website already understands if Ops adds them: `slug` (stable URLs),
`imageUrl` + `imageAlt`, `ticketUrl` / `rsvpUrl`, `priceLabel`, `kitchenCloseOverride` /
`barCloseOverride` (`HH:mm`), finer `kind` values (`TRIVIA`, `MOVIE`), `featured`,
`updatedAt`, and a `pastDays` query parameter for past events.

Notes for Ops:
- A `HOLIDAY` event is sent with `closed: false`; the website shows it as a notice but
  keeps the day open. If holidays mean closed, send `closed: true` for them too.
- `PRIVATE` events are excluded already. Good.

## 2. Instant updates (small, high value)

When Max saves an event, a menu item or hours in Ops, Ops calls:

```
POST https://<website>/api/revalidate
x-revalidate-secret: <REVALIDATE_SECRET>
```

The website then reads the feeds again at once instead of within 5 minutes. The route
exists on the website; set `REVALIDATE_SECRET` on both Vercel projects.

## 3. Hours and site notices: needs an Ops endpoint

Weekly hours live only in the website's `content/site.json` today, so a change means a
commit. Requested:

`GET /api/public/site`

```json
{
  "timezone": "America/New_York",
  "hours": {
    "mon": { "open": "16:30", "close": "20:00", "kitchenClose": "20:00" },
    "tue": null,
    "wed": { "open": "16:30", "close": "20:00", "kitchenClose": "20:00" },
    "thu": { "open": "16:30", "close": "20:00", "kitchenClose": "20:00" },
    "fri": { "open": "16:30", "close": "20:30", "kitchenClose": "20:15" },
    "sat": { "open": "12:00", "close": "20:30", "kitchenClose": "20:15" },
    "sun": { "open": "12:00", "close": "18:30", "kitchenClose": "18:15" }
  },
  "notice": null
}
```

- `hours`: one entry per weekday, `null` for a closed day, times `HH:mm` New York.
- `notice`: optional guest-facing line (`{ "text": "...", "until": "2026-12-01" }`), never
  the internal `Announcement` model.

## 4. Menu and tap list: needs an Ops endpoint

Ops already holds menu recipes (name, category, `menuPrice`, `active`) mapped to Square,
and allergens. The website's menu needs a little more per item. Requested:

`GET /api/public/menu`, in the website's menu shape (`src/lib/menu/schema.ts`, the same as
`content/menu.json`): `drinks[]` sections with `groups[]`, `food[]` sections with `items[]`,
`notices[]`, and `_meta.updated`.

- Per item: `name`, `description`, `price` (or `prices: { half, full }` for draft beer),
  optional `tags` (`vegetarian`, `vegan`, `kid-friendly`, `dog-friendly`), `badge`, and the
  seasonal window (`availableFrom` / `availableUntil`).
- Draft beer also needs `style`, `abv`, and `color` (`#RRGGBB`, for the glass on the menu).
  Ops has none of these today; they could be fields on the menu recipe, or a small "tap
  list" screen in Ops where Max marks what's pouring.
- Only `active` items; nothing about cost, recipes or suppliers.

The website already has the seam for this: `MenuSource` in `src/lib/menu/source.ts`
(`MENU_SOURCE=file` today). An `opsMenuSource` slots in beside it with the file as fallback.

## Order of work

1. Max enters upcoming events in Ops (no code). Then flip `EMPTY_FEED_USES_SEED`.
2. Ops: the revalidate ping on save (a few lines).
3. Ops: `/api/public/site` (hours). Website: read it, `site.json` as fallback.
4. Ops: the tap list and `/api/public/menu`. Website: `opsMenuSource`, `menu.json` as fallback.

## Suppliers for "Where it comes from" (asked 2026-11-15)

Theo: when Max adds a supplier he wants to feature in Ops, it should appear in Home's
"Where it comes from" section on its own.

The website side is ready for this. The section is drawn entirely from a list, and each
entry is placed on the New York map from its latitude and longitude
(`src/lib/map/project.ts`); nothing in the map knows a town by name. Today the list is
`sourcing` in `content/site.json`.

What Ops would need to serve, read-only, e.g. `GET /api/public/suppliers`:

```json
[
  { "what": "Beef", "who": "Kilcoyne Farms", "where": "Hudson Falls, NY", "lat": 43.301, "lng": -73.586 },
  { "what": "Grain", "who": "100% New York", "where": "grown in New York State" }
]
```

- `what`, `who`, `where`: the three lines shown, in Max's words.
- `lat`, `lng`: optional. With them the supplier gets a town on the map and a road to the
  taproom. Without them (or outside New York) it counts as statewide. Ops could fill these
  from the town with a geocoder when Max saves, so he never types a coordinate.
- Only suppliers Max has marked "feature on the website"; order as he sets it.
- The same revalidate ping on save as events.

Website work once that exists: a small `getSourcing()` that reads the feed (Zod-validated,
cached, `site.json` as the fallback), used in place of `site.sourcing` on Home.

### Detail view (added 2026-11-15)

Each supplier can open a detail view on the site: a photograph, a few sentences, a link.
Three more optional fields per supplier: `about` (a few sentences, Max's words), `url`
(the supplier's own site) and `photo`. Today `photo` is the id of a photograph already in
the website's repo. For photographs uploaded in Ops, the website needs to know where they
are served from (one image host to allow in its content-security policy and image
settings); that is a decision for Theo before any code.

## Menu item photos (2026-11-15)

The menu now has a detail view for each item, which shows a photo when the item has one.
For the Ops menu feed: an optional `photo` on each item (an image address, 4:3, at least
828 px wide, with `photoAlt` text). Until then a photo can be named in `content/menu.json`
by its id in `content/photos`.

## Announcements and featured event pages (asked 2026-11-16)

Max wants a site-wide announcement band and, for big nights like Oktoberfest, an event
page with more on it, both entered in Ops. The website side is built and dormant: it
shows nothing new until Ops sends these fields. Every field is optional; anything that
does not fit is dropped on its own (it never stops the hours, the other announcements or
the event from showing).

### `announcements` on `GET /api/public/site`

```json
{
  "hours": { "...": "as today" },
  "notice": null,
  "announcements": [
    {
      "id": "thanksgiving-2026",
      "text": "Closed Thanksgiving Day.",
      "tone": "closure",
      "from": "2026-11-20",
      "until": "2026-11-26"
    },
    {
      "id": "oktoberfest-2027",
      "text": "Oktoberfest is October 2 and 3.",
      "tone": "event",
      "link": { "href": "/events/oktoberfest-2027", "label": "Details" }
    }
  ]
}
```

- `id`: stable and unique (up to 64 characters). Visitors who close an announcement don't
  see that id again on that browser, so a changed message needs a new id.
- `text`: Max's words, up to 140 characters. Under about 90 keeps it to two lines on a phone.
- `link`: optional; `href` is a path on the website (`/events/...`) or a full `https://`
  address; `label` up to 40 characters.
- `tone`: `closure` (orange), `event` (yellow), or `info` (plain; the default).
- `from` / `until`: optional `YYYY-MM-DD`, New York, both days included. Ops can also
  just stop sending it.
- The website shows the first three that stand today, in the order sent, under the header
  on every page. The existing `notice` keeps working on Home as before.
- A revalidate ping with `{"tags": ["site"]}` on save makes it appear at once.

### `page` on an event in `GET /api/public/events`

```json
{
  "id": "evt_okt27",
  "slug": "oktoberfest-2027",
  "date": "2027-10-02",
  "title": "Oktoberfest",
  "kind": "FESTIVAL",
  "featured": true,
  "page": {
    "hero": "https://<ops origin>/uploads/oktoberfest.jpg",
    "heroAlt": "The long tables in the yard",
    "intro": "Two days in the yard.",
    "sections": [{ "title": "Food", "body": "Paragraphs, with blank lines between them." }],
    "schedule": [{ "time": "12:00", "what": "First pour" }],
    "links": [{ "label": "Tickets", "href": "https://..." }]
  }
}
```

- With `page`, the event's own page shows these below its usual top part: the photograph,
  the intro, each section under its own heading, the schedule as a list, then the links.
  Without it the page is exactly as today.
- `hero`: shown only when it is served from the Ops origin (`NEXT_PUBLIC_OPS_ORIGIN` on the
  website; the image settings and the content-security policy allow that one host when it
  is set). Landscape, at least 1600 px wide. `heroAlt` describes it; otherwise the title.
- Limits: intro 600 characters, up to 8 sections (title 80, body 4000), 24 schedule rows
  (`time` up to 20 characters, any wording, e.g. `12:00` or `Noon`; `what` 140), 6 links
  (`https://` only).
- `slug` matters here: a stable slug keeps `/events/oktoberfest-2027` the same address
  the announcement links to.
