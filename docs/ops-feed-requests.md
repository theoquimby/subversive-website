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
