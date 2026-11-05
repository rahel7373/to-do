"use client";

import { useEffect, useState } from "react";
import {
  addDays,
  addMonths,
  startOfWeek,
  toLocalDate,
  todayYMD,
} from "../../lib/date";
import {
  DEFAULT_MEETING_RULES,
  DEFAULT_SHEET_CONFIG,
  MARK_KINDS,
  getConfig,
  getDay,
  packDay,
} from "../../lib/dayLog";
import { useLocalList, useLocalState } from "../../lib/useLocalList";
import EventForm from "./EventForm";
import LongTermTasks from "./LongTermTasks";
import { datesBetween, firstFreeSlot } from "../../lib/dayEntries";
import MonthView from "./MonthView";
import QuarterView from "./QuarterView";
import WeekSheet from "./WeekSheet";
import YearView from "./YearView";
import styles from "./Schedule.module.css";

// 이전/다음 이동 단위
function shift(view, ymd, dir) {
  if (view === "week") return addDays(ymd, 7 * dir);
  if (view === "month") return addMonths(ymd, dir);
  if (view === "quarter") return addMonths(ymd, 12 * dir);
  return addMonths(ymd, 12 * dir);
}

function rangeLabel(view, ymd) {
  const d = toLocalDate(ymd);
  const year = d.getFullYear();
  if (view === "week") {
    const mon = startOfWeek(ymd);
    return `${mon} ~ ${addDays(mon, 4)}`;
  }
  if (view === "month") return `${year}년 ${d.getMonth() + 1}월`;
  if (view === "quarter") {
    return `${year}년 분기별`;
  }
  return `${year}년`;
}

const EMPTY_DAYS = {};

export default function ScheduleView({ view, onChangeView, top }) {
  const [events, setEvents, loaded] = useLocalList("events");
  const [days, setDays, daysLoaded] = useLocalState("days", EMPTY_DAYS);
  const [rules, setRules, rulesLoaded] = useLocalState(
    "meetingRules",
    DEFAULT_MEETING_RULES
  );
  const [savedConfig, setConfig, configLoaded] = useLocalState(
    "sheetConfig",
    DEFAULT_SHEET_CONFIG
  );
  const config = getConfig(savedConfig);
  // 오늘 날짜는 서버 렌더링 때 알 수 없으므로 마운트 후에 채운다.
  const [anchor, setAnchor] = useState("");
  const [formDate, setFormDate] = useState("");
  // 확인사항 칸(차주 헬퍼 이하) 항목 추가·삭제 모드
  const [editItems, setEditItems] = useState(false);

  useEffect(() => {
    const today = todayYMD();
    setAnchor(today);
    setFormDate(today);
  }, []);

  const ready =
    loaded && daysLoaded && rulesLoaded && configLoaded && anchor !== "";

  // 휴가·교육·기타 휴무·회의는 날짜별 업무 시트에 넣어 주간·월간·분기·연간에 함께 보이게 한다.
  // 돌려주는 문자열은 사용자에게 보여 줄 안내(비어 있으면 성공)이다.
  function addEvent(data) {
    const dates = datesBetween(data.startDate, data.endDate);
    if (["leave", "training", "off"].includes(data.type)) {
      const defaultText = MARK_KINDS.find(([k]) => k === data.type)?.[1] ?? "";
      const text = data.title === defaultText ? "" : data.title;
      setDays((prev) => {
        const next = { ...prev };
        for (const ymd of dates) {
          next[ymd] = packDay(
            { ...getDay(next, ymd, rules), mark: { kind: data.type, text } },
            ymd,
            rules
          );
        }
        return next;
      });
      return "";
    }
    if (data.type === "meeting") {
      setDays((prev) => {
        const next = { ...prev };
        for (const ymd of dates) {
          const day = getDay(next, ymd, rules);
          const slot = firstFreeSlot(day.meetings);
          if (slot < 0) {
            continue;
          }
          const meetings = day.meetings.map((m, i) =>
            i === slot
              ? { ...m, time: data.startTime ?? "", title: data.title }
              : m
          );
          next[ymd] = packDay({ ...day, meetings }, ymd, rules);
        }
        return next;
      });
      return "";
    }
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), createdAt: Date.now(), ...data },
    ]);
    return "";
  }

  // 날짜별 업무 시트 수정: 저장된 값이 없으면 기본값에서 시작한다.
  function changeDay(ymd, update) {
    setDays((prev) => ({
      ...prev,
      [ymd]: packDay(update(getDay(prev, ymd, rules)), ymd, rules),
    }));
  }

  function deleteEvent(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function pickDate(ymd) {
    setFormDate(ymd);
  }

  function pickMonth(first) {
    setAnchor(first);
    setFormDate(first);
    onChangeView("month");
  }

  return (
    <section className={styles.layout}>
      <aside className={styles.sidebar}>
        {top}
        <EventForm defaultDate={formDate} onAdd={addEvent} />

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          disabled={!anchor}
          onClick={() => setAnchor((a) => shift(view, a, -1))}
          aria-label="이전"
        >
          ◀
        </button>
        <strong className={styles.navLabel}>
          {anchor ? rangeLabel(view, anchor) : ""}
        </strong>
        <button
          type="button"
          className={styles.navButton}
          disabled={!anchor}
          onClick={() => setAnchor((a) => shift(view, a, 1))}
          aria-label="다음"
        >
          ▶
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setAnchor(todayYMD())}
        >
          오늘
        </button>
        <span className={styles.legend}>
          <i className={`${styles.dot} ${styles.work}`} /> 업무
          <i className={`${styles.dot} ${styles.holiday}`} /> 휴일
          <i className={`${styles.dot} ${styles.leave}`} /> 휴가
        </span>
      </div>

      {view === "week" && (
        <div className={styles.sideTools}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setEditItems((on) => !on)}
            aria-pressed={editItems}
          >
            {editItems ? "항목 편집 끝내기" : "확인사항 항목 편집"}
          </button>
          {editItems && (
            <p className={styles.muted}>
              차주 헬퍼 아래 확인 항목을 더하고 뺄 수 있어요. 이름은 편집 모드가
              아니어도 줄 이름을 눌러 바로 바꿀 수 있어요.
            </p>
          )}
        </div>
      )}
      <LongTermTasks />
      </aside>

      <div className={styles.content}>
      {ready && view === "week" && (
        <WeekSheet
          anchor={anchor}
          events={events}
          days={days}
          rules={rules}
          config={config}
          onChangeDay={changeDay}
          onAddRule={(rule) => setRules((prev) => [...prev, rule])}
          onDeleteRule={(id) =>
            setRules((prev) => prev.filter((r) => r.id !== id))
          }
          editItems={editItems}
          onChangeConfig={(update) => setConfig((prev) => update(getConfig(prev)))}
        />
      )}
      {ready && view === "month" && (
        <MonthView
          anchor={anchor}
          events={events}
          days={days}
          rules={rules}
          onChangeDay={changeDay}
          onDelete={deleteEvent}
          onPickDate={pickDate}
        />
      )}
      {ready && view === "quarter" && (
        <QuarterView
          anchor={anchor}
          events={events}
          days={days}
          rules={rules}
          onChangeDay={changeDay}
          onDelete={deleteEvent}
        />
      )}
      {ready && view === "year" && (
        <YearView
          anchor={anchor}
          events={events}
          days={days}
          rules={rules}
          onPickMonth={pickMonth}
        />
      )}
      </div>
    </section>
  );
}
