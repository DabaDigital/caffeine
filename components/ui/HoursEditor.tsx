"use client";

import { useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import {
  formatTime,
  weekDayNames,
  weekDays,
  type Period,
  type WeekDay,
  type WeekHours,
} from "@/lib/site";
import { Select } from "./Select";
import s from "./picker.module.css";

const pad = (value: number) => String(value).padStart(2, "0");
const times = Array.from(
  { length: 96 },
  (_, index) => `${pad(Math.floor(index / 4))}:${pad((index % 4) * 15)}`,
);
const openOptions = times.map((value) => ({ value, label: formatTime(value) }));
/** Closing at or before the opening time means after midnight. */
const closeOptions = (open: string) =>
  times.map((value) => ({
    value,
    label:
      value <= open ? `${formatTime(value)} (next day)` : formatTime(value),
  }));
const usualDay = (): Period[] => [{ open: "08:00", close: "22:00" }];
const usualWeek = () =>
  Object.fromEntries(weekDays.map((day) => [day, usualDay()])) as WeekHours;
/** A second period starting an hour after the last one ends. */
function nextPeriod(periods: Period[]): Period {
  const [hours, minutes] = periods[periods.length - 1].close
    .split(":")
    .map(Number);
  const start = (hours * 60 + minutes + 60) % 1440;
  const end = (start + 240) % 1440;
  const time = (total: number) =>
    `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  return { open: time(start), close: time(end) };
}

/**
 * Weekly opening hours, edited like Google Maps: open or closed per day, one
 * to three time ranges, and a shortcut to copy Monday everywhere. Submits
 * JSON under `name`, or "" while the hours are switched off.
 */
export function HoursEditor({
  name,
  defaultValue = null,
  labelledBy,
  describedBy,
}: {
  name?: string;
  defaultValue?: WeekHours | null;
  labelledBy?: string;
  describedBy?: string;
}) {
  const [published, setPublished] = useState(defaultValue !== null);
  const [week, setWeek] = useState<WeekHours>(defaultValue ?? usualWeek());
  const setDay = (day: WeekDay, periods: Period[]) =>
    setWeek((current) => ({ ...current, [day]: periods }));

  return (
    <div
      className={s.hours}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <button
        type="button"
        role="switch"
        aria-checked={published}
        className={s.switch}
        onClick={() => setPublished(!published)}
      >
        <span className={s.track} aria-hidden="true" />
        Show opening hours on the website
      </button>

      {published && (
        <>
          <ul className={s.days}>
            {weekDays.map((day) => {
              const periods = week[day];
              const dayName = weekDayNames[day];
              return (
                <li key={day} className={s.dayRow}>
                  <span className={s.dayName}>{dayName}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={periods.length > 0}
                    aria-label={`Open on ${dayName}`}
                    className={s.switch}
                    onClick={() =>
                      setDay(day, periods.length ? [] : usualDay())
                    }
                  >
                    <span className={s.track} aria-hidden="true" />
                    <span aria-hidden="true">
                      {periods.length ? "Open" : "Closed"}
                    </span>
                  </button>
                  <div className={s.periods}>
                    {periods.map((period, index) => {
                      // Unique names when a day has several periods.
                      const which = index
                        ? `${dayName}, period ${index + 1},`
                        : dayName;
                      return (
                        <div key={index} className={s.period}>
                          <Select
                            label={`${which} opens at`}
                            options={openOptions}
                            value={period.open}
                            onChange={(open) =>
                              setDay(
                                day,
                                periods.map((item, at) =>
                                  at === index ? { ...item, open } : item,
                                ),
                              )
                            }
                          />
                          <span className={s.dash} aria-hidden="true">
                            –
                          </span>
                          <Select
                            label={`${which} closes at`}
                            options={closeOptions(period.open)}
                            value={period.close}
                            onChange={(close) =>
                              setDay(
                                day,
                                periods.map((item, at) =>
                                  at === index ? { ...item, close } : item,
                                ),
                              )
                            }
                          />
                          {periods.length > 1 && (
                            <button
                              type="button"
                              className={s.removeButton}
                              aria-label={`Remove ${dayName} hours ${index + 1}`}
                              onClick={() =>
                                setDay(
                                  day,
                                  periods.filter((_, at) => at !== index),
                                )
                              }
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {periods.length > 0 && periods.length < 3 && (
                      <button
                        type="button"
                        className={s.linkButton}
                        onClick={() =>
                          setDay(day, [...periods, nextPeriod(periods)])
                        }
                      >
                        <Plus size={14} aria-hidden="true" /> Add hours
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className={s.linkButton}
            onClick={() =>
              setWeek(
                Object.fromEntries(
                  weekDays.map((day) => [
                    day,
                    week.mon.map((period) => ({ ...period })),
                  ]),
                ) as WeekHours,
              )
            }
          >
            <Copy size={14} aria-hidden="true" /> Copy Monday to every day
          </button>
        </>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={published ? JSON.stringify(week) : ""}
        />
      )}
    </div>
  );
}
