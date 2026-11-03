"use client";

import {
  WEEKDAYS,
  daysInMonth,
  toLocalDate,
  todayYMD,
  weekdayIndex,
} from "../../lib/date";
import { eventsOn, sortAllDay } from "../../lib/schedule";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

export default function MonthView({ anchor, events, onDelete, onPickDate }) {
  const d = toLocalDate(anchor);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const blanks = weekdayIndex(`${year}-${pad(month)}-01`);
  const today = todayYMD();
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  return (
    <div className={styles.month}>
      {WEEKDAYS.map((w, i) => (
        <div
          key={w}
          className={`${styles.monthHead} ${i >= 5 ? styles.weekend : ""}`}
        >
          {w}
        </div>
      ))}
      {Array.from({ length: blanks }, (_, i) => (
        <div key={`b${i}`} className={styles.monthBlank} />
      ))}
      {days.map((day) => {
        const ymd = `${year}-${pad(month)}-${pad(day)}`;
        const list = sortAllDay(eventsOn(events, ymd));
        return (
          <div
            key={ymd}
            className={[
              styles.monthCell,
              weekdayIndex(ymd) >= 5 ? styles.weekend : "",
              ymd === today ? styles.today : "",
            ].join(" ")}
            onClick={() => onPickDate(ymd)}
          >
            <div className={styles.dayNum}>{day}</div>
            {list.map((ev) => (
              <EventChip key={ev.id} ev={ev} onDelete={onDelete} showTime />
            ))}
          </div>
        );
      })}
    </div>
  );
}
