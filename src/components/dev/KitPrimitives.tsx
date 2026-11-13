// /dev/kit, M1 primitives: seal, chevrons, stickers, badges, tickets, glasses, icons.
// Every specimen uses real content from content/*.json (no placeholder text).
import events from "@content/events.seed.json";
import menu from "@content/menu.json";
import { microcopy } from "@content/microcopy";
import site from "@content/site.json";
import type { ReactNode } from "react";
import { Badge } from "@/components/graphics/Badge";
import { Chevrons } from "@/components/graphics/Chevrons";
import { GlassGlyph } from "@/components/graphics/GlassGlyph";
import { Icon } from "@/components/graphics/Icon";
import { ICON_NAMES } from "@/components/graphics/icons.generated";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Seal } from "@/components/graphics/Seal";
import { Sticker } from "@/components/graphics/Sticker";
import { Ticket, type TicketKind } from "@/components/graphics/Ticket";
import { Pill } from "@/components/layout/Pill";
import { Button } from "@/components/ui/Button";
import { ExternalLink, TextLink } from "@/components/ui/TextLink";
import { type IsoDate, weekdayOf } from "@/lib/time/ny";
import { StickerPlayground } from "./StickerPlayground";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" } as const;

interface Beer {
  name: string;
  style: string;
  abv: number;
  color: string;
  hazy?: boolean;
}
const isBeer = (i: object): i is Beer => "color" in i && "abv" in i;
const beers: Beer[] = (menu.drinks[0]?.groups ?? []).flatMap((g) => (g.items as object[]).filter(isBeer));

const game = events.events.find((e) => e.kind === "GAME");
const trivia = events.events.find((e) => /trivia/i.test(e.title));
const wings = menu.food
  .flatMap((s) => s.items as { name: string; price?: number }[])
  .find((i) => i.name === "Wing Wednesday Special");

function clock(t: string | null): string {
  if (!t) return "";
  const [h = 0, m = 0] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`;
}

function EventTicket({
  e,
  kind,
  torn = false,
}: {
  e: (typeof events.events)[number];
  kind: TicketKind;
  torn?: boolean;
}) {
  const date = e.date as IsoDate;
  const [, mm, dd] = date.split("-");
  const title = e.title.replace(/^Subversive Overtime:\s*/, "");
  return (
    <Ticket
      kind={kind}
      torn={torn}
      stub={
        <>
          <span className="ticket-date__label">{DAYS[weekdayOf(date)]}</span>
          <span className="ticket-date__day">{Number(dd)}</span>
          <span className="ticket-date__label">{MONTHS[Number(mm) - 1]}</span>
        </>
      }
    >
      <span className="kit-ticket__title">{title}</span>
      <span className="kit-ticket__meta tabular">{clock(e.startTime)}</span>
    </Ticket>
  );
}

function KitSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="kit-section" aria-labelledby={id}>
      <Pill id={id}>{title}</Pill>
      {children}
    </section>
  );
}

export function KitPrimitives() {
  return (
    <>
      <KitSection id="kit-glass" title="Glasses">
        <ul className="kit-glasses">
          {beers.map((b) => (
            <li key={b.name}>
              <GlassGlyph color={b.color} hazy={b.hazy} />
              <span className="kit-glasses__name">{b.name}</span>
              <span className="kit-label">
                {b.style} · {b.abv}%
              </span>
            </li>
          ))}
        </ul>
        <div className="kit-glass-hero">
          <GlassGlyph color={beers[0]?.color ?? ""} size="hero" rise />
          <GlassGlyph color={beers.find((b) => b.hazy)?.color ?? ""} hazy size="hero" fill={0.62} />
          <p className="kit-note">
            Hero size with the barley on the bowl; the second is half drunk and hazy. The first pours in on
            load.
          </p>
        </div>
      </KitSection>

      <KitSection id="kit-stickers" title="Stickers">
        <div className="kit-stickers">
          {wings ? (
            <Sticker shape="burst" color="pils" rotate="a" label={`${wings.name}, ${wings.price} dollars`}>
              ${wings.price}
            </Sticker>
          ) : null}
          <Sticker shape="round" color="sky" rotate="b" label="Dogs welcome">
            Dogs
          </Sticker>
          <Sticker shape="slash" color="ember" rotate="c" label="Tonight">
            Tonight
          </Sticker>
        </div>
        <div className="kit-badges">
          <Badge>Flagship</Badge>
          <Badge>Seasonal</Badge>
          <Badge tone="currant">15% to CCSM</Badge>
          <Sticker shape="tag" color="pils" rotate="a" label="Flagship" pop={false}>
            Flagship
          </Sticker>
        </div>
        <p className="kit-note">
          Hover or focus to peel. Below: drag and flick within the box; placement lasts the session.
        </p>
        <StickerPlayground />
      </KitSection>

      <KitSection id="kit-tickets" title="Tickets">
        <div className="kit-tickets">
          {game ? <EventTicket e={game} kind="game" /> : null}
          {trivia ? <EventTicket e={trivia} kind="trivia" /> : null}
          {game ? <EventTicket e={game} kind="game" torn /> : null}
        </div>
        <p className="kit-note">
          Hover or press a ticket and the stub starts to tear; the third is the event-page hero, torn once.
          The seed feed has no music or festival nights yet, so those colours are not shown here.
        </p>
      </KitSection>

      <KitSection id="kit-seal" title="Seal">
        <div className="kit-seal">
          <Seal spin className="kit-seal__mark" />
          <div className="kit-seal__bands">
            <Chevrons />
            <Chevrons tone="accent" />
          </div>
        </div>
      </KitSection>

      <KitSection id="kit-buttons" title="Buttons">
        <div className="kit-buttons">
          <Button href={site.links.order} external>
            {microcopy.orderPickup}
          </Button>
          <Button href="/menu" variant="secondary">
            {microcopy.seeTheMenu}
          </Button>
          <Button href={site.links.map} external variant="quiet">
            {microcopy.directions}
          </Button>
          <Button variant="quiet" disabled>
            {microcopy.addToCalendar}
          </Button>
        </div>
        <p className="kit-buttons__links">
          <TextLink href="/visit">{microcopy.directions}</TextLink>
          <ExternalLink href={site.links.bandBookingForm}>{microcopy.emailUs}</ExternalLink>
        </p>
        <p className="kit-note">
          One primary action per screen carries the stamp shadow; the rest are flat. The fourth is disabled.
        </p>
      </KitSection>

      <KitSection id="kit-photos" title="Photos">
        <div className="kit-photos">
          <PhotoFrame id="burger-and-beer" ratio="4/3" sizes="(min-width: 64rem) 40vw, 90vw" />
          <PhotoFrame id="firepit-beers" ratio="1/1" sizes="(min-width: 64rem) 25vw, 45vw" />
          <PhotoFrame id="exterior-dusk" ratio="4/5" sizes="(min-width: 64rem) 25vw, 45vw" />
        </div>
      </KitSection>

      <KitSection id="kit-icons" title="Icons">
        <ul className="kit-icons" aria-label="Icons at 3×, with grid, live area and keyline">
          {ICON_NAMES.map((n) => (
            <li key={n}>
              <span className="kit-icons__plate">
                <Icon name={n} className="kit-icons__big" />
              </span>
              <span className="kit-icons__row">
                <Icon name={n} />
                <span className="kit-label">{n}</span>
              </span>
            </li>
          ))}
        </ul>
      </KitSection>
    </>
  );
}
