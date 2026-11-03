"use client";

import { useEffect, useState } from "react";
import {
  addDays,
  addMonths,
  startOfWeek,
  toLocalDate,
  todayYMD,
} from "../../lib/date";
import { useLocalList } from "../../lib/useLocalList";
import EventForm from "./EventForm";
import MonthView from "./MonthView";
import QuarterView from "./QuarterView";
import WeekView from "./WeekView";
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

export default function ScheduleView({ view, onChangeView }) {
  const [events, setEvents, loaded] = useLocalList("events");
  // 오늘 날짜는 서버 렌더링 때 알 수 없으므로 마운트 후에 채운다.
  const [anchor, setAnchor] = useState("");
  const [formDate, setFormDate] = useState("");

  useEffect(() => {
    const today = todayYMD();
    setAnchor(today);
    setFormDate(today);
  }, []);

  const ready = loaded && anchor !== "";

  function addEvent(data) {
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), createdAt: Date.now(), ...data },
    ]);
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
    <section>
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

      {ready && view === "week" && (
        <WeekView anchor={anchor} events={events} onDelete={deleteEvent} />
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
    </section>
  );
}
