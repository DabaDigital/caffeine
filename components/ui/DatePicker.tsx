"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import s from "./picker.module.css";

// Dates are handled as "YYYY-MM-DD" strings and UTC midnights, so time zones
// never shift a day.
const DAY = 86_400_000;
const parse = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};
const format = (time: number) => new Date(time).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => format(parse(iso) + days * DAY);
function addMonths(iso: string, months: number) {
  const date = new Date(parse(iso));
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    1,
  );
  const lastDay = new Date(
    Date.UTC(
      new Date(target).getUTCFullYear(),
      new Date(target).getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDay);
  return format(target + (day - 1) * DAY);
}
/** Monday = 0 … Sunday = 6. */
const weekday = (iso: string) => (new Date(parse(iso)).getUTCDay() + 6) % 7;
const localToday = () => {
  const now = new Date();
  return format(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// Spelled out by hand so the server and every browser render identical text.
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekdayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const parts = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return {
    year,
    month: months[month - 1],
    day,
    weekday: weekdayNames[weekday(iso)],
  };
};
/** "Sat 3 Oct 2026" */
export function formatDate(iso: string) {
  const { year, month, day, weekday: name } = parts(iso);
  return `${name.slice(0, 3)} ${day} ${month.slice(0, 3)} ${year}`;
}
/** "Saturday 3 October 2026", for screen readers. */
const spokenDate = (iso: string) => {
  const { year, month, day, weekday: name } = parts(iso);
  return `${name} ${day} ${month} ${year}`;
};
const monthLabel = (iso: string) => {
  const { year, month } = parts(iso);
  return `${month} ${year}`;
};

/** A calendar date picker. The value is an ISO date ("2026-10-03") or "". */
export function DatePicker({
  name,
  id,
  labelledBy,
  label,
  value,
  defaultValue = "",
  onChange,
  min,
  max,
  placeholder = "Choose a date",
  invalid,
  describedBy,
  clearable = true,
}: {
  /** Hidden input name for form submissions. */
  name?: string;
  id?: string;
  labelledBy?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  clearable?: boolean;
}) {
  const uid = useId();
  const triggerId = id ?? `${uid}trigger`;
  const calendarId = `${uid}calendar`;
  const monthId = `${uid}month`;
  const ownLabelId = `${uid}label`;
  const labelId = labelledBy ?? ownLabelId;

  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const [focused, setFocused] = useState("");
  const [today, setToday] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLTableElement>(null);
  // Only keyboard moves inside the grid should pull focus to a day.
  const focusDay = useRef(false);

  const outOfRange = (iso: string) =>
    Boolean((min && iso < min) || (max && iso > max));
  const clamp = (iso: string) =>
    min && iso < min ? min : max && iso > max ? max : iso;

  function commit(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
    trigger.current?.focus();
  }
  function show() {
    const box = trigger.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setUpward(below < 400 && box.top > below);
    }
    const now = localToday();
    setToday(now);
    setFocused(clamp(current || now));
    focusDay.current = true;
    setOpen(true);
  }
  function hide() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open || !focusDay.current) return;
    focusDay.current = false;
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)
      ?.focus({ preventScroll: true });
  }, [open, focused]);

  function onGridKeyDown(event: KeyboardEvent) {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let next: string | null = null;
    if (event.key in steps) next = addDays(focused, steps[event.key]);
    else if (event.key === "Home") next = addDays(focused, -weekday(focused));
    else if (event.key === "End") next = addDays(focused, 6 - weekday(focused));
    else if (event.key === "PageUp")
      next = addMonths(focused, event.shiftKey ? -12 : -1);
    else if (event.key === "PageDown")
      next = addMonths(focused, event.shiftKey ? 12 : 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      return hide();
    }
    if (next) {
      event.preventDefault();
      focusDay.current = true;
      setFocused(next);
    }
  }

  // Six full weeks starting on the Monday before the 1st.
  const firstOfMonth = focused ? `${focused.slice(0, 8)}01` : "";
  const start = firstOfMonth
    ? addDays(firstOfMonth, -weekday(firstOfMonth))
    : "";
  const days = start
    ? Array.from({ length: 42 }, (_, i) => addDays(start, i))
    : [];

  return (
    <div
      ref={root}
      className={s.root}
      onBlur={(event) => {
        if (open && !root.current?.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      {label && !labelledBy && (
        <span id={ownLabelId} className="sr-only">
          {label}
        </span>
      )}
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        className={s.trigger}
        // Combobox opening a calendar dialog; its text is the chosen date.
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? hide() : show())}
      >
        <CalendarDays size={17} aria-hidden="true" />
        <span className={s.value}>
          <span className={current ? undefined : s.placeholder}>
            {current ? formatDate(current) : placeholder}
          </span>
        </span>
      </button>

      {open && (
        <div
          id={calendarId}
          role="dialog"
          aria-labelledby={monthId}
          className={`${s.popover} ${s.calendar} ${upward ? s.popoverUp : ""}`}
          tabIndex={-1}
        >
          <div className={s.calendarHead}>
            <p id={monthId} className={s.month} aria-live="polite">
              {monthLabel(focused)}
            </p>
            <div className={s.navButtons}>
              <button
                type="button"
                className={s.navButton}
                aria-label="Previous month"
                onClick={() => setFocused(addMonths(focused, -1))}
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={s.navButton}
                aria-label="Next month"
                onClick={() => setFocused(addMonths(focused, 1))}
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
          <table
            ref={grid}
            role="grid"
            aria-labelledby={monthId}
            className={s.grid}
            onKeyDown={onGridKeyDown}
          >
            <thead>
              <tr>
                {weekdayNames.map((name) => (
                  <th key={name} scope="col" abbr={name}>
                    {name.slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week}>
                  {days.slice(week * 7, week * 7 + 7).map((day) => {
                    const disabled = outOfRange(day);
                    return (
                      <td
                        key={day}
                        role="gridcell"
                        aria-selected={day === current}
                      >
                        <button
                          type="button"
                          data-date={day}
                          tabIndex={day === focused ? 0 : -1}
                          aria-label={spokenDate(day)}
                          aria-current={day === today ? "date" : undefined}
                          aria-disabled={disabled || undefined}
                          className={[
                            s.day,
                            day.slice(0, 7) !== focused.slice(0, 7)
                              ? s.dayOutside
                              : "",
                            day === today ? s.dayToday : "",
                          ].join(" ")}
                          onClick={() => {
                            if (!disabled) commit(day);
                          }}
                          onKeyDown={(event) => {
                            if (
                              (event.key === "Enter" || event.key === " ") &&
                              disabled
                            )
                              event.preventDefault();
                          }}
                        >
                          {Number(day.slice(8))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className={s.calendarFoot}>
            {clearable ? (
              <button
                type="button"
                className={s.textButton}
                disabled={!current}
                onClick={() => commit("")}
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={s.textButton}
              disabled={outOfRange(today)}
              onClick={() => commit(today)}
            >
              Today
            </button>
          </div>
        </div>
      )}

      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
