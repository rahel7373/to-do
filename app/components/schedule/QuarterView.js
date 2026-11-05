"use client";

import { useEffect, useRef } from "react";
import { daysInMonth, toLocalDate } from "../../lib/date";
import { EVENT_TYPES } from "../../lib/schedule";
import { describeRule } from "../../lib/dayLog";
import { markOn, markText, meetingText, meetingsOn } from "../../lib/dayEntries";
import { recurringInMonth } from "../../lib/recurring";
import RecurCheck from "./RecurCheck";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const pad = (n) => String(n).padStart(2, "0");

export default function QuarterView({
  anchor,
  events,
  days: dayData,
  rules,
  onChangeDay,
  onDelete,
}) {
  const wrapRef = useRef(null);
  const d = toLocalDate(anchor);
  const year = d.getFullYear();
  const anchorQuarter = Math.floor(d.getMonth() / 3) + 1;

  // 1~4분기를 위에서 아래로 이어서 보여 주고, 선택한 분기가 있는 줄로 스크롤한다.
  useEffect(() => {
    wrapRef.current
      ?.querySelector(`[data-q="${anchorQuarter}"]`)
      ?.scrollIntoView({ block: "start" });
  }, [year, anchorQuarter]);

  return (
    <div ref={wrapRef}>
    <h2 className={styles.viewTitle}>
      {year}년 <b>분기별 업무</b>
      <span className={styles.viewSub}>(스크롤하면 다음 분기가 이어서 나옵니다)</span>
    </h2>
    {[1, 2, 3, 4].map((q) => {
    const months = [q * 3 - 2, q * 3 - 1, q * 3];
    return (
    <div key={q} data-q={q} className={styles.quarterBlock}>
    <h3 className={styles.quarterHead}>
      {q}분기 <span className={styles.viewSub}>({months[0]}월 ~ {months[2]}월)</span>
    </h3>
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
        // 날짜별 시트의 휴가·교육(연속된 같은 표시는 기간으로 묶음)과 직접 넣은 회의
        const sheetItems = [];
        for (let day = 1; day <= daysInMonth(year, m); day++) {
          const ymd = `${year}-${pad(m)}-${pad(day)}`;
          const mark = markOn(dayData, rules, ymd);
          if (mark) {
            const last = sheetItems[sheetItems.length - 1];
            const text = markText(mark);
            if (
              last &&
              last.kind === "mark" &&
              last.markKind === mark.kind &&
              last.text === text &&
              last.dates[last.dates.length - 1] === `${year}-${pad(m)}-${pad(day - 1)}`
            ) {
              last.dates.push(ymd);
            } else {
              sheetItems.push({ kind: "mark", markKind: mark.kind, text, dates: [ymd] });
            }
          }
          for (const { index, meeting } of meetingsOn(dayData, rules, ymd)) {
            if (meeting.ruleId) continue; // 반복 회의는 아래 '반복 회의'에 한 줄로 표시
            sheetItems.push({ kind: "meeting", index, text: meetingText(meeting), dates: [ymd], important: meeting.important });
          }
        }
        const clearItem = (it) => {
          for (const ymd of it.dates) {
            onChangeDay(ymd, (d) =>
              it.kind === "mark"
                ? { ...d, mark: null }
                : {
                    ...d,
                    meetings: d.meetings.map((x, i) =>
                      i === it.index
                        ? { time: "", place: "", custom: "", title: "", important: false }
                        : x
                    ),
                  }
            );
          }
        };
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
            {rules.length > 0 && (
              <div className={styles.recurGroup}>
                <h4 className={styles.recurGroupTitle}>반복 회의</h4>
                <ul className={styles.eventList}>
                  {rules.map((r) => (
                    <li key={r.id}>
                      <span className={styles.eventDate}>{describeRule(r)}</span>
                      <span className={`${styles.chip} ${styles.meetChip}`}>
                        <span className={styles.chipText}>
                          {[r.time, r.title || r.custom || r.place].filter(Boolean).join(" ")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <h4 className={styles.recurGroupTitle}>등록한 일정</h4>
            {sheetItems.length > 0 && (
              <ul className={styles.eventList}>
                {sheetItems.map((it, i) => (
                  <li key={`s${i}`}>
                    <span className={styles.eventDate}>
                      {it.dates[0].slice(5)}
                      {it.dates.length > 1 && ` ~ ${it.dates[it.dates.length - 1].slice(5)}`}
                    </span>
                    <span
                      className={`${styles.chip} ${
                        it.kind === "mark"
                          ? styles[`mk_${it.markKind}`]
                          : `${styles.meetChip} ${it.important ? styles.meetImportant : ""}`
                      }`}
                    >
                      <span className={styles.chipText}>{it.text}</span>
                      <button
                        type="button"
                        className={styles.chipDelete}
                        onClick={() => clearItem(it)}
                        aria-label={`${it.dates[0]} ${it.text} 삭제`}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {list.length === 0 && sheetItems.length === 0 ? (
              <p className={styles.muted}>등록된 일정이 없습니다.</p>
            ) : list.length === 0 ? null : (
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
    })}
    </div>
  );
}
