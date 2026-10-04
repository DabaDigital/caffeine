"use client";

import { useSyncExternalStore } from "react";
import { ChevronDown, Clock } from "lucide-react";
import {
  cafeNow,
  formatPeriods,
  openStatus,
  weekDayNames,
  weekDays,
  type WeekDay,
  type WeekHours,
} from "@/lib/site";
import s from "./experience.module.css";

// The page is cached, so "Open now" is worked out in the visitor's browser
// (in Casablanca time) and refreshed every half minute.
const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
};
const readClock = () => {
  const { day, minutes } = cafeNow();
  return `${day}|${minutes}`;
};
const serverClock = () => null;

/** Opening hours like Google Maps: a status line that expands to the week. */
export function OpeningHours({
  hours,
  note,
}: {
  hours: WeekHours;
  note: string | null;
}) {
  const clock = useSyncExternalStore(subscribe, readClock, serverClock);
  const today = clock ? (clock.split("|")[0] as WeekDay) : null;
  const status = clock
    ? openStatus(hours, { day: today!, minutes: Number(clock.split("|")[1]) })
    : null;
  // Once the day is known, start the list from today, as Google Maps does.
  const start = today ? weekDays.indexOf(today) : 0;
  const days = weekDays.map((_, offset) => weekDays[(start + offset) % 7]);

  return (
    <details className={s.hoursDetails}>
      <summary>
        <Clock size={21} aria-hidden="true" />
        <span className={s.hoursSummary}>
          <span>OPENING HOURS</span>
          {status ? (
            <strong>
              <span className={status.open ? s.openNow : s.closedNow}>
                {status.open ? "Open now" : "Closed"}
              </span>
              {status.detail && ` · ${status.detail}`}
            </strong>
          ) : (
            <strong>See this week’s hours</strong>
          )}
        </span>
        <ChevronDown size={18} className={s.hoursChevron} aria-hidden="true" />
      </summary>
      <table className={s.hoursTable}>
        <caption className="sr-only">Opening hours this week</caption>
        <tbody>
          {days.map((day) => (
            <tr
              key={day}
              className={day === today ? s.hoursToday : undefined}
              aria-current={day === today ? "date" : undefined}
            >
              <th scope="row">{weekDayNames[day]}</th>
              <td>{formatPeriods(hours[day])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className={s.hoursNote}>{note}</p>}
    </details>
  );
}
