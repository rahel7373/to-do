"use client";

import {
  daysInMonth,
  toLocalDate,
  todayYMD,
  weekdayIndex,
} from "../../lib/date";
import { markOn, markText, meetingText, meetingsOn, todosOn } from "../../lib/dayEntries";
import { holidayOf } from "../../lib/holidays";
import { recurringOn } from "../../lib/recurring";
import { eventsOn } from "../../lib/schedule";
import { useState } from "react";
import MovePicker from "./MovePicker";
import styles from "./Schedule.module.css";

const WEEK_SUN_FIRST = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n) => String(n).padStart(2, "0");

// 같은 날에 여러 종류가 있으면 휴가 > 휴일 > 업무 순으로 색을 정한다.
function dayKind(events, ymd, mark, hasTodo) {
  const list = eventsOn(events, ymd);
  if (mark?.kind === "leave") return "leave";
  if (mark?.kind === "training") return "training";
  if (mark?.kind === "off") return "holiday";
  if (list.some((e) => e.type === "leave")) return "leave";
  if (list.some((e) => e.type === "holiday")) return "holiday";
  if (list.length || hasTodo) return "work";
  return null;
}

// 커서를 올렸을 때 보여 줄 그날의 내용 (없으면 빈 문자열)
function dayInfo(events, dayData, rules, ymd, recurLabels) {
  const lines = [];
  const holiday = holidayOf(ymd);
  if (holiday) lines.push(`${holiday.name}${holiday.kind === "half" ? " (오전 근무)" : ""}`);
  const mark = markOn(dayData, rules, ymd);
  if (mark) lines.push(`[${markText(mark)}]`);
  for (const { meeting } of meetingsOn(dayData, rules, ymd)) {
    lines.push(`회의 ${meetingText(meeting)}${meeting.cancelled ? " (취소)" : ""}`);
  }
  for (const { todo } of todosOn(dayData, rules, ymd)) {
    lines.push(`업무 ${todo.done ? "(완료) " : ""}${todo.text}`);
  }
  for (const e of eventsOn(events, ymd)) {
    const label = { work: "업무", holiday: "휴일", leave: "휴가" }[e.type];
    lines.push(`${label} ${e.startTime ? e.startTime + " " : ""}${e.title}`);
  }
  for (const r of recurringOn(ymd, recurLabels)) lines.push(`정기 ${r.label}`);
  return lines.length ? [ymd.slice(5), ...lines].join("\n") : "";
}

export default function YearView({
  anchor,
  events,
  days: dayData,
  rules,
  recurLabels,
  onPickMonth,
  onOpenWeek,
  onMoveMeeting,
  onMoveTodo,
  onMoveMark,
}) {
  const [picked, setPicked] = useState(""); // 일정 패널이 열린 날짜
  const year = toLocalDate(anchor).getFullYear();
  const today = todayYMD();

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
        const todoCount = Array.from({ length: daysInMonth(year, m) }, (_, i) =>
          todosOn(dayData, rules, `${year}-${pad(m)}-${pad(i + 1)}`).length
        ).reduce((a, b) => a + b, 0);
        const marked = (kinds) =>
          Array.from({ length: daysInMonth(year, m) }, (_, i) =>
            markOn(dayData, rules, `${year}-${pad(m)}-${pad(i + 1)}`)
          ).filter((k) => k && kinds.includes(k.kind)).length;
        return (
          <div key={m} className={styles.yearMonth}>
            <h3>
              <button
                type="button"
                className={styles.yearMonthTitle}
                onClick={() => onPickMonth(first)}
                aria-label={`${year}년 ${m}월 보기`}
                title="월간 화면으로"
              >
                {m}월 ›
              </button>
            </h3>
            <div className={styles.miniGrid}>
              {WEEK_SUN_FIRST.map((w) => (
                <span
                  key={w}
                  className={`${styles.miniHead} ${
                    w === "일" || w === "토" ? styles.weekendText : ""
                  }`}
                >
                  {w}
                </span>
              ))}
              {Array.from({ length: (weekdayIndex(first) + 1) % 7 }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth(year, m) }, (_, i) => {
                const ymd = `${year}-${pad(m)}-${pad(i + 1)}`;
                const kind = dayKind(events, ymd, markOn(dayData, rules, ymd), todosOn(dayData, rules, ymd).length > 0);
                return (
                  <span
                    key={ymd}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPicked(picked === ymd ? "" : ymd)}
                    onKeyDown={(e) => e.key === "Enter" && setPicked(picked === ymd ? "" : ymd)}
                    title={dayInfo(events, dayData, rules, ymd, recurLabels) || undefined}
                    className={[
                      styles.miniDay,
                      weekdayIndex(ymd) >= 5 ? styles.weekendText : "",
                      kind ? styles[`day_${kind}`] : "",
                      ymd === today ? styles.miniToday : "",
                    ].join(" ")}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
            {picked.startsWith(`${year}-${pad(m)}-`) && (
              <div className={styles.yearDay}>
                <div className={styles.popHead}>
                  <b>{m}월 {Number(picked.slice(8))}일</b>
                  <span>
                    <button
                      type="button"
                      className={styles.yearDayLink}
                      onClick={() => onOpenWeek(picked)}
                    >
                      주간 보기
                    </button>
                    <button
                      type="button"
                      className={styles.chipDelete}
                      onClick={() => setPicked("")}
                      aria-label="일정 패널 닫기"
                    >
                      ×
                    </button>
                  </span>
                </div>
                {(() => {
                  const mark = markOn(dayData, rules, picked);
                  const meets = meetingsOn(dayData, rules, picked);
                  const todos = todosOn(dayData, rules, picked);
                  const others = eventsOn(events, picked);
                  if (!mark && !meets.length && !todos.length && !others.length)
                    return <p className={styles.muted}>등록된 일정이 없어요.</p>;
                  return (
                    <ul className={styles.yearDayList}>
                      {mark && (
                        <li>
                          <span className={`${styles.chip} ${styles[`mk_${mark.kind}`]}`}>
                            <span className={styles.chipText}>{markText(mark)}</span>
                          </span>
                          <MovePicker from={picked} label={`${picked} ${markText(mark)}`} onMove={(to) => onMoveMark(picked, to)} />
                        </li>
                      )}
                      {meets.map(({ index, meeting }) => (
                        <li key={`m${index}`}>
                          <span className={`${styles.chip} ${styles.meetChip} ${meeting.cancelled ? styles.meetCancelled : ""}`}>
                            <span className={styles.chipText}>{meetingText(meeting)}</span>
                          </span>
                          <MovePicker from={picked} label={`${picked} 회의 ${meetingText(meeting)}`} onMove={(to) => onMoveMeeting(picked, index, to)} />
                        </li>
                      ))}
                      {todos.map(({ index, todo }) => (
                        <li key={`t${index}`}>
                          <span className={`${styles.chip} ${styles.work} ${todo.done ? styles.chipDone : ""}`}>
                            <span className={styles.chipText}>{todo.text}</span>
                          </span>
                          <MovePicker from={picked} label={`${picked} 업무 ${todo.text}`} onMove={(to) => onMoveTodo(picked, index, to)} />
                        </li>
                      ))}
                      {others.map((e) => (
                        <li key={e.id}>
                          <span className={`${styles.chip} ${styles[e.type]}`}>
                            <span className={styles.chipText}>{e.title}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            )}
            <p className={styles.yearCounts}>
              업무 {count("work") + todoCount} · 휴일 {count("holiday") + marked(["off"])} · 휴가{" "}
              {count("leave") + marked(["leave"])} · 교육{" "}
              {marked(["training"])}
            </p>
          </div>
        );
      })}
      <aside className={styles.yearHelp} aria-label="연간 도움말">
        <h3>도움말</h3>
        <ul className={styles.legend}>
          <li><span className={`${styles.swatch} ${styles.day_work}`}>1</span>업무</li>
          <li><span className={`${styles.swatch} ${styles.day_training}`}>1</span>교육</li>
          <li><span className={`${styles.swatch} ${styles.day_leave}`}>1</span>휴가</li>
          <li><span className={`${styles.swatch} ${styles.day_holiday}`}>1</span>기타 휴무·휴일</li>
          <li><span className={`${styles.swatch} ${styles.weekendText}`}>1</span>토·일요일</li>
        </ul>
        <p>
          날짜에 마우스를 올리면 그날 내용이 보여요. 날짜를 누르면 그날 일정이
          나오고 📅로 날짜를 옮길 수 있어요. 달 이름을 누르면 월간 화면으로 가요.
        </p>
      </aside>
    </div>
    </>
  );
}
