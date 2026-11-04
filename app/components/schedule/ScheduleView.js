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
  getConfig,
  getDay,
  packDay,
} from "../../lib/dayLog";
import { useLocalList, useLocalState } from "../../lib/useLocalList";
import EventForm from "./EventForm";
import MonthView from "./MonthView";
import QuarterView from "./QuarterView";
import WeekSheet from "./WeekSheet";
import YearView from "./YearView";
import styles from "./Schedule.module.css";

// 이전/다음 이동 단위
function shift(view, ymd, dir) {
  if (view === "week") return addDays(ymd, 7 * dir);
  if (view === "month") return addMonths(ymd, dir);
  if (view === "quarter") return addMonths(ymd, 3 * dir);
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
    return `${year}년 ${Math.floor(d.getMonth() / 3) + 1}분기`;
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

  useEffect(() => {
    const today = todayYMD();
    setAnchor(today);
    setFormDate(today);
  }, []);

  const ready =
    loaded && daysLoaded && rulesLoaded && configLoaded && anchor !== "";

  function addEvent(data) {
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), createdAt: Date.now(), ...data },
    ]);
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
          onChangeConfig={(update) => setConfig((prev) => update(getConfig(prev)))}
        />
      )}
      {ready && view === "month" && (
        <MonthView
          anchor={anchor}
          events={events}
          onDelete={deleteEvent}
          onPickDate={pickDate}
        />
      )}
      {ready && view === "quarter" && (
        <QuarterView anchor={anchor} events={events} onDelete={deleteEvent} />
      )}
      {ready && view === "year" && (
        <YearView anchor={anchor} events={events} onPickMonth={pickMonth} />
      )}
      </div>
    </section>
  );
}
