// Hours card (spec §4.9): seven rows Monday first, Tuesday muted "Closed", the kitchen's
// close as a second muted figure only where it differs, then the special hours for the
// next 14 days as inserted rows. A semantic table with a caption. Today is marked by the
// TodayMarker leaf (Text 600 + a solid kernel); every row reserves the kernel's room, so
// marking it moves nothing.
import { visitLabels } from "@content/microcopy";
import { formatRange, formatTime, weekdayLabel } from "@/lib/hours/format";
import { type HoursEvent, specialHours } from "@/lib/hours/schedule";
import type { Site } from "@/lib/site/schema";
import { type IsoDate, toMinutes, WEEKDAYS } from "@/lib/time/ny";
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
  return (
    <table className="hours" data-hours="">
      <caption className="sr-only">{visitLabels.hours}</caption>
      <tbody>
        {WEEKDAYS.map((w) => {
          const h = hours[w];
          const kitchen = h && h.kitchenClose !== h.close ? toMinutes(h.kitchenClose) : null;
          return (
            <tr key={w} className="hours__row" data-weekday={w} data-closed={h ? undefined : ""}>
              <th scope="row" className="hours__day">
                <span className="hours__kernel" aria-hidden="true" />
                {weekdayLabel(w, "long")}
              </th>
              <td className="hours__time">
                {h ? formatRange(toMinutes(h.open), toMinutes(h.close)) : visitLabels.closed}
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
