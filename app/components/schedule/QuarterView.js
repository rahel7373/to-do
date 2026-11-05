"use client";

import { useLayoutEffect, useRef } from "react";
import { daysInMonth, toLocalDate } from "../../lib/date";
import { EVENT_TYPES } from "../../lib/schedule";
import { recurringInMonth } from "../../lib/recurring";
import RecurCheck from "./RecurCheck";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

export default function QuarterView({
  anchor,
  events,
  days: dayData,
  onChangeDay,
  onDelete,
}) {
  const wrapRef = useRef(null);
  // 한 화면에 다 보이도록 화면 높이에 맞춰 크기를 줄인다 (최소 50%).
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      el.style.zoom = "1";
      const natural = el.getBoundingClientRect().height;
      const room = window.innerHeight - 24;
      el.style.zoom = String(Math.max(0.5, Math.min(1, room / natural)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  });
  const d = toLocalDate(anchor);
  const year = d.getFullYear();
  const firstMonth = Math.floor(d.getMonth() / 3) * 3 + 1;
  const months = [firstMonth, firstMonth + 1, firstMonth + 2];

  const quarter = (firstMonth + 2) / 3;
  return (
    <div ref={wrapRef}>
    <h2 className={styles.viewTitle}>
      {year}년 <b>{quarter}분기</b>
      <span className={styles.viewSub}>
        ({months[0]}월 ~ {months[2]}월)
      </span>
    </h2>
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
        const recur = recurringInMonth(year, m);
        return (
          <section key={m} className={styles.quarterMonth}>
            <h3>{m}월</h3>
            {[
              ["분기 업무", recur.filter((r) => r.quarterly)],
              ["매월 업무", recur.filter((r) => !r.quarterly)],
            ].map(
              ([name, items]) =>
                items.length > 0 && (
                  <div key={name} className={styles.recurGroup}>
                    <h4 className={styles.recurGroupTitle}>{name}</h4>
                    <ul className={styles.eventList}>
                      {items.map((r) => (
                        <li key={r.item.id}>
                          <span className={styles.eventDate}>
                            {r.ymd.slice(5)}
                          </span>
                          <RecurCheck
                            ymd={r.ymd}
                            item={r.item}
                            quarterly={r.quarterly}
                            days={dayData}
                            onChangeDay={onChangeDay}
                            showDate
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
            <h4 className={styles.recurGroupTitle}>등록한 일정</h4>
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
    </div>
  );
}
