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
import { datesBetween, firstFreeSlot, putTodo } from "../../lib/dayEntries";
import { RECURRING } from "../../lib/recurring";
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

  // 예전에 events에 저장한 업무를 날짜별 할 일 칸으로 한 번 옮긴다. (칸이 부족하면 그대로 둔다)
  useEffect(() => {
    if (!ready) return;
    const works = events.filter((e) => e.type === "work");
    if (!works.length) return;
    let next = days;
    const moved = new Set();
    for (const ev of works) {
      const text = ev.startTime && ev.endTime ? `${ev.startTime}~${ev.endTime} ${ev.title}` : ev.title;
      const res = putTodo(next, rules, datesBetween(ev.startDate, ev.endDate), text, ev.done, packDay);
      if (res) {
        next = res;
        moved.add(ev.id);
      }
    }
    if (moved.size) {
      setDays(next);
      setEvents((prev) => prev.filter((e) => !moved.has(e.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

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
    if (data.type === "work") {
      const text =
        data.startTime && data.endTime
          ? `${data.startTime}~${data.endTime} ${data.title}`
          : data.title;
      const next = putTodo(days, rules, dates, text, false, packDay);
      if (!next) return "오늘 할 일 칸이 가득 찬 날이 있어요. (한 날에 최대 8개)";
      setDays(next);
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

  // 회의 날짜 변경: 새로 입력하지 않고 다른 날짜로 옮긴다. 안내 문구를 돌려준다(성공이면 빈 문자열).
  // 반복 회의는 그날 것만 취소 표시하고, 옮긴 날짜에는 한 번짜리 회의로 만든다.
  function moveMeeting(fromYmd, slot, toYmd) {
    if (!toYmd || toYmd === fromYmd) return "";
    const m = getDay(days, fromYmd, rules).meetings[slot];
    if (!m) return "";
    const target = firstFreeSlot(getDay(days, toYmd, rules).meetings);
    if (target < 0) return "그 날은 회의 칸이 가득 찼어요.";
    const { ruleId, ...rest } = m;
    const copy = { ...rest, cancelled: false, done: false };
    const cleared = {
      time: "",
      place: "",
      custom: "",
      title: "",
      important: false,
      cancelled: false,
      done: false,
    };
    setDays((prev) => {
      const next = { ...prev };
      const from = getDay(next, fromYmd, rules);
      next[fromYmd] = packDay(
        {
          ...from,
          meetings: from.meetings.map((x, i) =>
            i === slot ? (ruleId ? { ...x, cancelled: true } : cleared) : x
          ),
        },
        fromYmd,
        rules
      );
      const to = getDay(next, toYmd, rules);
      next[toYmd] = packDay(
        {
          ...to,
          meetings: to.meetings.map((x, i) => (i === target ? copy : x)),
        },
        toYmd,
        rules
      );
      return next;
    });
    return "";
  }

  // 월간에서 칩을 누르면 그날이 있는 주간 시트로 이동한다.
  function openWeek(ymd) {
    setAnchor(ymd);
    setFormDate(ymd);
    onChangeView("week");
  }

  function toggleEvent(id) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e))
    );
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
          {editItems && (
            <div className={styles.recurEdit}>
              <h4 className={styles.recurGroupTitle}>정기 업무 내용</h4>
              {RECURRING.map((r) => (
                <label key={r.id} className={styles.recurEditRow}>
                  <span>
                    {r.months ? "분기 " : "매월 "}
                    {r.day}일
                  </span>
                  <textarea
                    className={styles.recurEditInput}
                    rows={2}
                    value={config.recurLabels[r.id] ?? r.label}
                    placeholder={r.label}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const c = getConfig(prev);
                        return {
                          ...c,
                          recurLabels: {
                            ...c.recurLabels,
                            [r.id]: e.target.value.replace(/\n/g, ""),
                          },
                        };
                      })
                    }
                    aria-label={`정기 업무 ${r.label}`}
                  />
                </label>
              ))}
              <p className={styles.muted}>비우면 원래 이름으로 돌아가요.</p>
            </div>
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
          onMoveMeeting={moveMeeting}
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
          recurLabels={config.recurLabels}
          onChangeDay={changeDay}
          onDelete={deleteEvent}
          onToggleEvent={toggleEvent}
          onAdd={addEvent}
          onMoveMeeting={moveMeeting}
          onOpenWeek={openWeek}
          onPickDate={pickDate}
        />
      )}
      {ready && view === "quarter" && (
        <QuarterView
          anchor={anchor}
          events={events}
          days={days}
          rules={rules}
          recurLabels={config.recurLabels}
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
          recurLabels={config.recurLabels}
          onPickMonth={pickMonth}
        />
      )}
      </div>
    </section>
  );
}
