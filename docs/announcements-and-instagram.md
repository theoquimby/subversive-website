# Announcements, featured event pages and the Instagram feed

Three ways to tell visitors what's going on, all switched off until Ops (or an env var)
turns them on. Nothing about the live site changes before then.

## Announcements (from Ops)

- Max enters them in Ops; Ops sends them as `announcements` on `/api/public/site`
  (fields and an example: `docs/ops-feed-requests.md`, "Announcements and featured event
  pages").
- The website reads that feed every 5 minutes (or at once on a revalidate ping with the
  `site` tag), keeps those that stand today in New York, and shows up to three in a band
  directly under the header on every page (`src/components/layout/Announcements.tsx`).
- Each line has a close button. Closed ids are remembered in the visitor's browser only
  (`localStorage`, key `sv.announce.closed`); a new message needs a new id.
- Pages are cached for up to an hour (Menu, Beer, About), so a line can linger up to an
  hour after its `until` day unless Ops sends the revalidate ping.
- Code: `src/lib/site/announcements.ts` (checks and date filter), `src/lib/site/ops.ts`.

## Featured event pages (from Ops)

- An event in the Ops events feed can carry a `page` (photograph, intro, sections,
  schedule, links). The event's page (`/events/<slug>`) then shows those below its usual
  top part (`src/components/events/EventFeature.tsx`).
- Photographs come only from the Ops origin. Set `NEXT_PUBLIC_OPS_ORIGIN` (e.g.
  `https://ops.example.com`) on the website's Vercel project and redeploy: that adds the
  host to `images.remotePatterns` and the CSP `img-src` in `next.config.ts`.

## Instagram feed (needs a token)

`src/components/social/InstagramFeed.tsx` shows the five latest posts as squares, each
linking to the post. It is not placed on any page yet; put `<InstagramFeed />` where it
should appear. It renders nothing without a token or when Instagram fails.

It uses the Instagram API with Instagram Login (needs a professional account, Business
or Creator; a personal account cannot use it):
`GET https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=5`.

### Setup

1. In the Meta developer dashboard (developers.facebook.com), create an app with the
   Instagram product, "API setup with Instagram login". Add the brewery's Instagram
   account as a tester/role and accept the invite in Instagram.
2. Generate an access token for that account in the dashboard (permission
   `instagram_business_basic`). Tokens made in the dashboard are long-lived: 60 days.
   (A short-lived token from the login flow can be swapped server-side for a long-lived
   one: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=<app secret>&access_token=<short token>`.)
3. Put it in Vercel as `INSTAGRAM_ACCESS_TOKEN` (server only; never `NEXT_PUBLIC_`, never
   in the repo) and redeploy. A build with the token set also allows Instagram's image
   hosts (`*.cdninstagram.com`, `*.fbcdn.net`) in `next.config.ts`.
4. Posts are cached for an hour (tag `instagram`). To refresh at once, POST to
   `/api/revalidate` with `{"tags": ["instagram"]}`; it is not part of the default refresh.

### The token expires after 60 days

A long-lived token stops working 60 days after it was made or last refreshed, and the
feed then quietly disappears. Refresh it before then (it must be at least 24 hours old
and not yet expired):

```
GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<current token>
```

The answer holds a new token valid for another 60 days; put it in Vercel and redeploy.
Simplest: a calendar reminder every 50 days. A scheduled job that refreshes and updates
the env var is possible later, but needs a Vercel API token, so it is a decision for Theo.
