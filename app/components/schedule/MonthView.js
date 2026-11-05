"use client";

import { useState } from "react";
import {
  WEEKDAYS,
  daysInMonth,
  toLocalDate,
  todayYMD,
  weekdayIndex,
} from "../../lib/date";
import { eventsOn, sortAllDay } from "../../lib/schedule";
import { recurringInMonth } from "../../lib/recurring";
import DayChips from "./DayChips";
import { markOn, meetingsOn, todosOn } from "../../lib/dayEntries";
import EventForm from "./EventForm";
import RecurCheck from "./RecurCheck";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

export default function MonthView({
  anchor,
  events,
  days: dayData,
  rules,
  recurLabels,
  onChangeDay,
  onDelete,
  onToggleEvent,
  onAdd,
  onOpenWeek,
  onPickDate,
}) {
  const [adding, setAdding] = useState(""); // 입력창이 열린 날짜
  const d = toLocalDate(anchor);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const blanks = weekdayIndex(`${year}-${pad(month)}-01`);
  const today = todayYMD();
  const recur = recurringInMonth(year, month, recurLabels);
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  return (
    <>
    <h2 className={styles.viewTitle}>
      {year}년 <b>{month}월</b>
    </h2>
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
            <div className={styles.dayNum}>
              {day}
              <button
                type="button"
                className={styles.cellAdd}
                onClick={(e) => {
                  e.stopPropagation();
                  setAdding(adding === ymd ? "" : ymd);
                }}
                aria-label={`${ymd} 일정 추가`}
                title="이 날 일정 추가"
              >
                +
              </button>
            </div>
            {adding === ymd && (
              <div
                className={`${styles.cellPopover} ${
                  weekdayIndex(ymd) >= 4 ? styles.popRight : ""
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.popHead}>
                  <b>{ymd.slice(5).replace("-", "월 ")}일 추가</b>
                  <button
                    type="button"
                    className={styles.chipDelete}
                    onClick={() => setAdding("")}
                    aria-label="입력창 닫기"
                  >
                    ×
                  </button>
                </div>
                <EventForm
                  defaultDate={ymd}
                  onAdd={(data) => {
                    const r = onAdd(data);
                    if (!r) setAdding("");
                    return r;
                  }}
                />
              </div>
            )}
            {recur
              .filter((r) => r.ymd === ymd)
              .map((r) => (
                <RecurCheck
                  key={r.item.id}
                  ymd={ymd}
                  item={r.item}
                  quarterly={r.quarterly}
                  days={dayData}
                  onChangeDay={onChangeDay}
                />
              ))}
            <DayChips
              ymd={ymd}
              mark={markOn(dayData, rules, ymd)}
              meetings={meetingsOn(dayData, rules, ymd)}
              todos={todosOn(dayData, rules, ymd)}
              onOpen={onOpenWeek}
              onChangeDay={onChangeDay}
            />
            {list.map((ev) => (
              <EventChip
                key={ev.id}
                ev={ev}
                onDelete={onDelete}
                onToggle={onToggleEvent}
                showTime
              />
            ))}
          </div>
        );
      })}
    </div>
    </>
  );
}
