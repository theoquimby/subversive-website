"use client";

// Add to calendar (spec §6.3): a custom menu on Radix DropdownMenu (keyboard, focus and
// dismissal from Radix, every visual ours). Apple and Outlook take the .ics file; Google
// takes its URL template.
import { eventLabels, microcopy } from "@content/microcopy";
import { DropdownMenu } from "radix-ui";
import { Icon } from "../graphics/Icon";

export function AddToCalendar({ icsHref, googleHref }: { icsHref: string; googleHref: string }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="btn btn--quiet">
        <Icon name="calendar-plus" className="btn__icon" />
        <span className="btn__label">{microcopy.addToCalendar}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="cal-menu" data-skin="overtime" sideOffset={8} align="start">
          <DropdownMenu.Item asChild className="cal-menu__item">
            <a href={icsHref} download>
              {eventLabels.calendar.apple}
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="cal-menu__item">
            <a href={icsHref} download>
              {eventLabels.calendar.outlook}
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="cal-menu__item">
            <a href={googleHref} target="_blank" rel="noopener">
              {eventLabels.calendar.google}
              <Icon name="external" className="cal-menu__icon" />
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
