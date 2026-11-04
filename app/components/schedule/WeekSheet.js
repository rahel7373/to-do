"use client";

import { addDays, startOfWeek, todayYMD, WEEKDAYS } from "../../lib/date";
import {
  CHECK_ITEMS,
  CUSTOM_PLACE,
  INTERVIEW_SLOTS,
  MEETING_PLACES,
  MEETING_SLOTS,
  TODO_SLOTS,
  getDay,
} from "../../lib/dayLog";
import { eventsOn, sortAllDay } from "../../lib/schedule";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const range = (n) => Array.from({ length: n }, (_, i) => i);

// 주간 시트: 월~금 열마다 그날의 업무 항목을 한 장에 모아 둔다.
export default function WeekSheet({ anchor, events, days, onDeleteEvent, onChangeDay }) {
  const monday = startOfWeek(anchor);
  const dates = range(5).map((i) => addDays(monday, i));
  const today = todayYMD();
  const dayOf = (ymd) => getDay(days, ymd);

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
  const row = (title, render, { span, first = true, id = title } = {}) => (
    <tr key={id}>
      {first && (
        <th scope="row" className={styles.rowLabel} rowSpan={span}>
          {title}
        </th>
      )}
      {dates.map((ymd) => (
        <td key={ymd} className={ymd === today ? styles.todayCell : ""}>
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
            {dates.map((ymd, i) => (
              <th
                key={ymd}
                scope="col"
                className={`${styles.sheetHead} ${ymd === today ? styles.todayCell : ""}`}
              >
                {label(ymd)} ({WEEKDAYS[i]})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row("휴일·휴가·일정", (ymd) =>
            sortAllDay(eventsOn(events, ymd)).map((ev) => (
              <EventChip key={ev.id} ev={ev} onDelete={onDeleteEvent} showTime />
            ))
          )}

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
                return (
                  <div className={styles.meeting}>
                    <input
                      className={styles.cellInput}
                      type="time"
                      value={m.time}
                      onChange={(e) =>
                        setItem(ymd, "meetings", i, { time: e.target.value })
                      }
                      aria-label={`${label(ymd)} 회의 ${i + 1} 시간`}
                    />
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
                  </div>
                );
              },
              { span: MEETING_SLOTS, first: i === 0, id: `meeting${i}` }
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
                <input
                  className={styles.cellInput}
                  value={d.interviews[i]}
                  placeholder="이름"
                  onChange={(e) => setInterview(ymd, i, e.target.value)}
                  aria-label={`${label(ymd)} 면담 ${i + 1}`}
                />
              ),
              { span: INTERVIEW_SLOTS, first: i === 0, id: `interview${i}` }
            )
          )}

          {textRow("팀장님 외부재", "leaderAbsent")}
          {textRow("운영간호사 부재", "nurseAbsent")}
          {textRow("차주 헬퍼", "helper")}

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
