// Hours card (spec §4.9): seven rows Monday first, Tuesday muted "Closed", the kitchen's
// close as a second muted figure only where it differs, then the special hours for the
// next 14 days as inserted rows. A semantic table with a caption. Today is marked by the
// TodayMarker leaf (Text 600 + a solid kernel); every row reserves the kernel's room, so
// marking it moves nothing.
import { visitLabels } from "@content/microcopy";
import { formatRange, formatTime, weekdayLabel } from "@/lib/hours/format";
import { type HoursEvent, specialHours } from "@/lib/hours/schedule";
import type { Site } from "@/lib/site/schema";
import { type IsoDate, toMinutes, WEEKDAYS, weekdayOf } from "@/lib/time/ny";
import { TodayMarker } from "./TodayMarker";

export function HoursCard({
  hours,
  events,
  today,
}: {
  hours: Site["hours"];
  events: readonly HoursEvent[];
  today: IsoDate;
}) {
  const special = specialHours(today, 14, { hours }, events);
  // Today's own row tells tonight's truth: a late night or a closure replaces the regular
  // hours there, so the first answer a visitor reads is the right one (critique 11/13).
  const tonight = special.find((r) => r.date === today);
  const todayWeekday = weekdayOf(today);
  return (
    <table className="hours" data-hours="">
      <caption className="sr-only">{visitLabels.hours}</caption>
      <tbody>
        {WEEKDAYS.map((w) => {
          const h = hours[w];
          const s = w === todayWeekday && tonight ? tonight.schedule : null;
          const open = s ? s.open : h ? toMinutes(h.open) : null;
          const close = s ? s.close : h ? toMinutes(h.close) : null;
          const kitchenAt = s ? s.kitchenClose : h ? toMinutes(h.kitchenClose) : null;
          const kitchen = kitchenAt !== null && kitchenAt !== close ? kitchenAt : null;
          const shut = open === null || close === null;
          return (
            <tr key={w} className="hours__row" data-weekday={w} data-closed={shut ? "" : undefined}>
              <th scope="row" className="hours__day">
                <span className="hours__kernel" aria-hidden="true" />
                {weekdayLabel(w, "long")}
              </th>
              <td className="hours__time">
                {open !== null && close !== null ? formatRange(open, close) : visitLabels.closed}
              </td>
              <td className="hours__kitchen">
                {kitchen !== null ? visitLabels.kitchenTil(formatTime(kitchen)) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
      {special.length > 0 ? (
        <tbody className="hours__special">
          <tr>
            <th scope="colgroup" colSpan={3} className="hours__special-head">
              {visitLabels.specialHours}
            </th>
          </tr>
          {special.map((r) => (
            <tr
              key={r.date}
              className="hours__row"
              data-date={r.date}
              data-closed={r.schedule.closed ? "" : undefined}
            >
              <th scope="row" className="hours__day">
                <span className="hours__kernel" aria-hidden="true" />
                {r.day}
              </th>
              <td className="hours__time">
                {r.schedule.open !== null && r.schedule.close !== null
                  ? formatRange(r.schedule.open, r.schedule.close)
                  : visitLabels.closed}
              </td>
              <td className="hours__kitchen">{r.label}</td>
            </tr>
          ))}
        </tbody>
      ) : null}
      <TodayMarker />
    </table>
  );
}
