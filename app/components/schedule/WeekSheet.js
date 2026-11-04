"use client";

import { useState } from "react";
import { addDays, startOfWeek, todayYMD, WEEKDAYS } from "../../lib/date";
import {
  CHECK_ITEMS,
  CUSTOM_PLACE,
  INTERVIEW_SLOTS,
  MARK_KINDS,
  MEETING_PLACES,
  MEETING_SLOTS,
  TODO_SLOTS,
  getDay,
} from "../../lib/dayLog";
import { holidayOf } from "../../lib/holidays";
import { recurringOn } from "../../lib/recurring";
import { eventsOn } from "../../lib/schedule";
import styles from "./Schedule.module.css";

const range = (n) => Array.from({ length: n }, (_, i) => i);

// 그날의 휴일 정보: 내장 휴일 + 직접 등록한 '휴일'.
// kind "off" = 종일 휴일, "half" = 오전 근무만.
function holidayInfo(ymd, events) {
  const builtin = holidayOf(ymd);
  const own = eventsOn(events, ymd)
    .filter((e) => e.type === "holiday")
    .map((e) => e.title);
  const names = [
    ...(builtin?.kind === "off" ? [builtin.name] : []),
    ...own,
  ].filter((n, i, all) => all.indexOf(n) === i);
  if (names.length) return { kind: "off", name: names.join(" · ") };
  return builtin;
}

// 주간 시트: 월~금 열마다 그날의 업무 항목을 한 장에 모아 둔다.
export default function WeekSheet({ anchor, events, days, onChangeDay }) {
  // 수동 표시(휴가·외부 교육 등)를 편집 중인 날짜
  const [editing, setEditing] = useState("");
  // 비어 있는 회의 칸 중 펼쳐 둔 칸 ("날짜#칸번호")
  const [openSlots, setOpenSlots] = useState({});
  const monday = startOfWeek(anchor);
  const dates = range(5).map((i) => addDays(monday, i));
  const today = todayYMD();
  const dayOf = (ymd) => getDay(days, ymd);
  const holidays = Object.fromEntries(
    dates.map((ymd) => [ymd, holidayInfo(ymd, events)])
  );
  // 휴일은 열 전체를 빨갛게, 오늘은 노랗게 칠한다.
  const markOf = (ymd) => dayOf(ymd).mark;
  const colClass = (ymd) =>
    holidays[ymd]?.kind === "off"
      ? styles.holidayCol
      : markOf(ymd)
        ? styles[`${markOf(ymd).kind}Col`]
        : ymd === today
          ? styles.todayCell
          : "";
  const setMark = (ymd, mark) => setField(ymd, "mark", mark);

  const setField = (ymd, key, value) =>
    onChangeDay(ymd, (d) => ({ ...d, [key]: value }));
  const setItem = (ymd, key, i, patch) =>
    onChangeDay(ymd, (d) => ({
      ...d,
      [key]: d[key].map((x, j) => (j === i ? { ...x, ...patch } : x)),
    }));
  const setInterview = (ymd, i, value) =>
    onChangeDay(ymd, (d) => ({
      ...d,
      interviews: d.interviews.map((x, j) => (j === i ? value : x)),
    }));
  const setCheck = (ymd, key, value) =>
    onChangeDay(ymd, (d) => ({ ...d, checks: { ...d.checks, [key]: value } }));

  const label = (ymd) => `${ymd.slice(5).replace("-", "/")}`;

  // 한 행: 왼쪽 라벨 + 날짜별 칸
  const row = (
    title,
    render,
    { span, first = true, id = title, accent = "" } = {}
  ) => (
    <tr key={id}>
      {first && (
        <th
          scope="row"
          className={`${styles.rowLabel} ${accent ? styles[`${accent}Label`] : ""}`}
          rowSpan={span}
        >
          {title}
        </th>
      )}
      {dates.map((ymd) => (
        <td
          key={ymd}
          className={colClass(ymd) || (accent ? styles[`${accent}Cell`] : "")}
        >
          {render(ymd, dayOf(ymd))}
        </td>
      ))}
    </tr>
  );

  const textRow = (title, key) =>
    row(title, (ymd, d) => (
      <input
        className={styles.cellInput}
        value={d[key]}
        onChange={(e) => setField(ymd, key, e.target.value)}
        aria-label={`${label(ymd)} ${title}`}
      />
    ));

  return (
    <div className={styles.sheetWrap}>
      <table className={styles.sheet}>
        <thead>
          <tr>
            <th className={styles.rowLabel} />
            {dates.map((ymd, i) => {
              const h = holidays[ymd];
              const mark = markOf(ymd);
              const headClass =
                h?.kind === "off"
                  ? styles.holidayHead
                  : mark
                    ? styles[`${mark.kind}Head`]
                    : h?.kind === "half"
                      ? styles.halfHead
                      : ymd === today
                        ? styles.todayCell
                        : "";
              const markLabel = mark
                ? mark.text ||
                  MARK_KINDS.find(([k]) => k === mark.kind)?.[1] ||
                  ""
                : "";
              return (
                <th
                  key={ymd}
                  scope="col"
                  className={`${styles.sheetHead} ${headClass}`}
                >
                  {label(ymd)} ({WEEKDAYS[i]})
                  {h && (
                    <div className={styles.holidayName}>
                      {h.name}
                      {h.kind === "half" && " · 오전 근무"}
                    </div>
                  )}
                  {mark && (
                    <div className={styles.holidayName}>{markLabel}</div>
                  )}
                  <button
                    type="button"
                    className={styles.markButton}
                    onClick={() => setEditing(editing === ymd ? "" : ymd)}
                    aria-label={`${label(ymd)} 휴가·교육 표시`}
                  >
                    {mark ? "표시 수정" : "+ 휴가·교육"}
                  </button>
                  {editing === ymd && (
                    <div className={styles.markEditor}>
                      <select
                        className={styles.cellInput}
                        value={mark?.kind ?? ""}
                        onChange={(e) => {
                          const kind = e.target.value;
                          if (!kind) return setMark(ymd, null);
                          const def = MARK_KINDS.find(([k]) => k === kind)[2];
                          setMark(ymd, {
                            kind,
                            text:
                              mark && mark.text !== "" ? mark.text : def,
                          });
                        }}
                        aria-label={`${label(ymd)} 표시 종류`}
                      >
                        <option value="">표시 없음</option>
                        {MARK_KINDS.map(([k, name]) => (
                          <option key={k} value={k}>
                            {name}
                          </option>
                        ))}
                      </select>
                      {mark && (
                        <input
                          className={styles.cellInput}
                          value={mark.text}
                          placeholder="내용 (예: 간호협회 교육)"
                          onChange={(e) =>
                            setMark(ymd, { ...mark, text: e.target.value })
                          }
                          aria-label={`${label(ymd)} 표시 내용`}
                        />
                      )}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {row("총 환자 수", (ymd, d) => (
            <input
              className={styles.cellInput}
              type="number"
              min="0"
              value={d.patients}
              onChange={(e) => setField(ymd, "patients", e.target.value)}
              aria-label={`${label(ymd)} 총 환자 수`}
            />
          ))}
          {textRow("지원가능 진료과 (오전)", "amDepts")}
          {textRow("지원가능 진료과 (오후)", "pmDepts")}

          {range(MEETING_SLOTS).map((i) =>
            row(
              "회의일정",
              (ymd, d) => {
                const m = d.meetings[i];
                const key = `${ymd}#${i}`;
                const empty =
                  !m.time && !m.place && !m.title && !m.custom && !m.important;
                if (empty && !openSlots[key]) {
                  return (
                    <button
                      type="button"
                      className={styles.addMeeting}
                      onClick={() =>
                        setOpenSlots((s) => ({ ...s, [key]: true }))
                      }
                      aria-label={`${label(ymd)} 회의 ${i + 1} 추가`}
                    >
                      + 회의
                    </button>
                  );
                }
                return (
                  <div
                    className={`${styles.meeting} ${m.important ? styles.important : ""}`}
                  >
                    <div className={styles.meetingTop}>
                      <input
                        className={styles.cellInput}
                        type="time"
                        value={m.time}
                        onChange={(e) =>
                          setItem(ymd, "meetings", i, { time: e.target.value })
                        }
                        aria-label={`${label(ymd)} 회의 ${i + 1} 시간`}
                      />
                      <button
                        type="button"
                        className={`${styles.star} ${m.important ? styles.starOn : ""}`}
                        onClick={() =>
                          setItem(ymd, "meetings", i, {
                            important: !m.important,
                          })
                        }
                        aria-pressed={!!m.important}
                        aria-label={`${label(ymd)} 회의 ${i + 1} 중요 표시`}
                        title="중요 일정"
                      >
                        {m.important ? "★" : "☆"}
                      </button>
                      {empty && (
                        <button
                          type="button"
                          className={styles.star}
                          onClick={() =>
                            setOpenSlots((s) => ({ ...s, [key]: false }))
                          }
                          aria-label={`${label(ymd)} 회의 ${i + 1} 접기`}
                          title="접기"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <select
                      className={styles.cellInput}
                      value={m.place}
                      onChange={(e) =>
                        setItem(ymd, "meetings", i, { place: e.target.value })
                      }
                      aria-label={`${label(ymd)} 회의 ${i + 1} 장소`}
                    >
                      <option value="">장소 선택</option>
                      {MEETING_PLACES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value={CUSTOM_PLACE}>{CUSTOM_PLACE}</option>
                    </select>
                    {m.place === CUSTOM_PLACE && (
                      <input
                        className={styles.cellInput}
                        value={m.custom}
                        placeholder="장소 입력"
                        onChange={(e) =>
                          setItem(ymd, "meetings", i, { custom: e.target.value })
                        }
                        aria-label={`${label(ymd)} 회의 ${i + 1} 장소 직접 입력`}
                      />
                    )}
                    <input
                      className={styles.cellInput}
                      value={m.title}
                      placeholder="회의 제목"
                      onChange={(e) =>
                        setItem(ymd, "meetings", i, { title: e.target.value })
                      }
                      aria-label={`${label(ymd)} 회의 ${i + 1} 제목`}
                    />
                  </div>
                );
              },
              {
                span: MEETING_SLOTS,
                first: i === 0,
                id: `meeting${i}`,
                accent: "meeting",
              }
            )
          )}

          {range(TODO_SLOTS).map((i) =>
            row(
              "오늘 할 일",
              (ymd, d) => {
                const t = d.todos[i];
                return (
                  <div className={styles.todoCell}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) =>
                        setItem(ymd, "todos", i, { done: e.target.checked })
                      }
                      aria-label={`${label(ymd)} 할 일 ${i + 1} 완료`}
                    />
                    <input
                      className={`${styles.cellInput} ${t.done ? styles.doneText : ""}`}
                      value={t.text}
                      onChange={(e) =>
                        setItem(ymd, "todos", i, { text: e.target.value })
                      }
                      aria-label={`${label(ymd)} 할 일 ${i + 1}`}
                    />
                  </div>
                );
              },
              { span: TODO_SLOTS, first: i === 0, id: `todo${i}` }
            )
          )}

          {range(INTERVIEW_SLOTS).map((i) =>
            row(
              "면담",
              (ymd, d) => (
                <div className={styles.todoCell}>
                  <input
                    type="checkbox"
                    checked={!!d.interviewDone[i]}
                    onChange={(e) =>
                      onChangeDay(ymd, (x) => ({
                        ...x,
                        interviewDone: x.interviewDone.map((v, j) =>
                          j === i ? e.target.checked : v
                        ),
                      }))
                    }
                    aria-label={`${label(ymd)} 면담 ${i + 1} 완료`}
                  />
                  <input
                    className={`${styles.cellInput} ${d.interviewDone[i] ? styles.doneText : ""}`}
                    value={d.interviews[i]}
                    placeholder="이름"
                    onChange={(e) => setInterview(ymd, i, e.target.value)}
                    aria-label={`${label(ymd)} 면담 ${i + 1}`}
                  />
                </div>
              ),
              { span: INTERVIEW_SLOTS, first: i === 0, id: `interview${i}` }
            )
          )}

          {textRow("팀장님 외부재", "leaderAbsent")}
          {textRow("운영간호사 부재", "nurseAbsent")}
          {row("차주 헬퍼", (ymd, d) => (
            <div className={styles.todoCell}>
              <input
                type="checkbox"
                checked={!!d.helperDone}
                onChange={(e) => setField(ymd, "helperDone", e.target.checked)}
                aria-label={`${label(ymd)} 차주 헬퍼 완료`}
              />
              <input
                className={`${styles.cellInput} ${d.helperDone ? styles.doneText : ""}`}
                value={d.helper}
                onChange={(e) => setField(ymd, "helper", e.target.value)}
                aria-label={`${label(ymd)} 차주 헬퍼`}
              />
            </div>
          ))}

          {CHECK_ITEMS.map(([key, title]) =>
            row(title, (ymd, d) => (
              <label className={styles.checkCell}>
                <input
                  type="checkbox"
                  checked={d.checks[key]}
                  onChange={(e) => setCheck(ymd, key, e.target.checked)}
                />
                <span>{d.checks[key] ? "완료" : "미완료"}</span>
              </label>
            ))
          )}

          {row("정기 업무", (ymd, d) => (
            <div className={styles.recurList}>
              {recurringOn(ymd).map((r) => {
                const done = !!d.recurDone?.[r.id];
                return (
                  <label key={r.id} className={styles.recurItem}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={(e) =>
                        onChangeDay(ymd, (x) => ({
                          ...x,
                          recurDone: {
                            ...x.recurDone,
                            [r.id]: e.target.checked,
                          },
                        }))
                      }
                      aria-label={`${label(ymd)} ${r.label}`}
                    />
                    <span className={done ? styles.doneText : ""}>
                      {r.label}
                    </span>
                  </label>
                );
              })}
            </div>
          ), { accent: "recur" })}

          {row("마약류 사인", (ymd, d) => (
            <div className={styles.todoCell}>
              <input
                type="checkbox"
                checked={d.checks.narcotics}
                onChange={(e) => setCheck(ymd, "narcotics", e.target.checked)}
                aria-label={`${label(ymd)} 마약류 확인`}
              />
              <input
                className={styles.cellInput}
                value={d.narcoticsSign}
                placeholder="사인"
                onChange={(e) => setField(ymd, "narcoticsSign", e.target.value)}
                aria-label={`${label(ymd)} 마약류 사인`}
              />
            </div>
          ))}
        </tbody>
      </table>
    </div>
  );
}
