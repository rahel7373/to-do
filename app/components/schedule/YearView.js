"use client";

import {
  WEEKDAYS,
  daysInMonth,
  toLocalDate,
  weekdayIndex,
} from "../../lib/date";
import { markOn } from "../../lib/dayEntries";
import { eventsOn } from "../../lib/schedule";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

// 같은 날에 여러 종류가 있으면 휴가 > 휴일 > 업무 순으로 색을 정한다.
function dayKind(events, ymd, mark) {
  const list = eventsOn(events, ymd);
  if (mark?.kind === "leave") return "leave";
  if (mark?.kind === "training") return "training";
  if (mark?.kind === "off") return "holiday";
  if (list.some((e) => e.type === "leave")) return "leave";
  if (list.some((e) => e.type === "holiday")) return "holiday";
  if (list.length) return "work";
  return null;
}

export default function YearView({
  anchor,
  events,
  days: dayData,
  rules,
  onPickMonth,
}) {
  const year = toLocalDate(anchor).getFullYear();

  return (
    <>
    <h2 className={styles.viewTitle}>
      <b>{year}년</b> 연간 일정
    </h2>
    <div className={styles.year}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const first = `${year}-${pad(m)}-01`;
        const last = `${year}-${pad(m)}-${pad(daysInMonth(year, m))}`;
        const count = (type) =>
          events.filter(
            (e) => e.type === type && e.startDate <= last && e.endDate >= first
          ).length;
        const marked = (kinds) =>
          Array.from({ length: daysInMonth(year, m) }, (_, i) =>
            markOn(dayData, rules, `${year}-${pad(m)}-${pad(i + 1)}`)
          ).filter((k) => k && kinds.includes(k.kind)).length;
        return (
          <button
            key={m}
            type="button"
            className={styles.yearMonth}
            onClick={() => onPickMonth(first)}
            aria-label={`${year}년 ${m}월 보기`}
          >
            <h3>{m}월</h3>
            <div className={styles.miniGrid}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={styles.miniHead}>
                  {w}
                </span>
              ))}
              {Array.from({ length: weekdayIndex(first) }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth(year, m) }, (_, i) => {
                const ymd = `${year}-${pad(m)}-${pad(i + 1)}`;
                const kind = dayKind(events, ymd, markOn(dayData, rules, ymd));
                return (
                  <span
                    key={ymd}
                    className={[
                      styles.miniDay,
                      weekdayIndex(ymd) >= 5 ? styles.weekendText : "",
                      kind ? styles[`day_${kind}`] : "",
                    ].join(" ")}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
            <p className={styles.yearCounts}>
              업무 {count("work")} · 휴일 {count("holiday") + marked(["off"])} · 휴가{" "}
              {count("leave") + marked(["leave"])} · 교육{" "}
              {marked(["training"])}
            </p>
          </button>
        );
      })}
    </div>
    </>
  );
}
