"use client";

import { daysInMonth, toLocalDate } from "../../lib/date";
import { EVENT_TYPES } from "../../lib/schedule";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

export default function QuarterView({ anchor, events, onDelete }) {
  const d = toLocalDate(anchor);
  const year = d.getFullYear();
  const firstMonth = Math.floor(d.getMonth() / 3) * 3 + 1;
  const months = [firstMonth, firstMonth + 1, firstMonth + 2];

  return (
    <div className={styles.quarter}>
      {months.map((m) => {
        const from = `${year}-${pad(m)}-01`;
        const to = `${year}-${pad(m)}-${pad(daysInMonth(year, m))}`;
        const list = events
          .filter((e) => e.startDate <= to && e.endDate >= from)
          .sort(
            (a, b) =>
              a.startDate.localeCompare(b.startDate) ||
              a.createdAt - b.createdAt
          );
        return (
          <section key={m} className={styles.quarterMonth}>
            <h3>{m}월</h3>
            {list.length === 0 ? (
              <p className={styles.muted}>등록된 일정이 없습니다.</p>
            ) : (
              <ul className={styles.eventList}>
                {list.map((ev) => (
                  <li key={ev.id}>
                    <span className={styles.eventDate}>
                      {ev.startDate.slice(5)}
                      {ev.endDate !== ev.startDate &&
                        ` ~ ${ev.endDate.slice(5)}`}
                    </span>
                    <span className={styles.eventType}>
                      {EVENT_TYPES[ev.type].label}
                    </span>
                    <EventChip ev={ev} onDelete={onDelete} showTime />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
