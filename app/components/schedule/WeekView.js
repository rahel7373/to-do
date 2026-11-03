"use client";

import { addDays, startOfWeek, todayYMD, WEEKDAYS } from "../../lib/date";
import {
  WORK_END,
  WORK_START,
  eventsOn,
  isTimed,
  layoutTimed,
  sortAllDay,
  toMinutes,
} from "../../lib/schedule";
import EventChip from "./EventChip";
import styles from "./Schedule.module.css";

const HOUR_HEIGHT = 48;
const HOURS = Array.from(
  { length: WORK_END - WORK_START },
  (_, i) => WORK_START + i
);

export default function WeekView({ anchor, events, onDelete }) {
  const monday = startOfWeek(anchor);
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const today = todayYMD();

  return (
    <div className={styles.week}>
      <div className={styles.weekRow}>
        <div className={styles.timeCol} />
        {days.map((d, i) => (
          <div
            key={d}
            className={`${styles.dayHead} ${d === today ? styles.today : ""}`}
          >
            {WEEKDAYS[i]} {d.slice(5).replace("-", "/")}
          </div>
        ))}
      </div>

      <div className={styles.weekRow}>
        <div className={`${styles.timeCol} ${styles.allDayLabel}`}>종일</div>
        {days.map((d) => {
          const list = sortAllDay(
            eventsOn(events, d).filter((e) => !isTimed(e))
          );
          return (
            <div key={d} className={styles.allDayCell}>
              {list.map((ev) => (
                <EventChip key={ev.id} ev={ev} onDelete={onDelete} />
              ))}
            </div>
          );
        })}
      </div>

      <div className={styles.weekRow}>
        <div className={styles.timeCol}>
          {HOURS.map((h) => (
            <div
              key={h}
              className={styles.hourLabel}
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((d) => {
          const timed = layoutTimed(eventsOn(events, d).filter(isTimed));
          return (
            <div
              key={d}
              className={styles.dayCol}
              style={{ height: HOURS.length * HOUR_HEIGHT }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className={styles.hourLine}
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
              {timed.map(({ ev, lane, lanes }) => {
                // 출근~퇴근 범위를 벗어나는 부분은 잘라서 표시한다.
                const from = Math.max(toMinutes(ev.startTime), WORK_START * 60);
                const to = Math.min(toMinutes(ev.endTime), WORK_END * 60);
                if (to <= from) return null;
                return (
                  <div
                    key={ev.id}
                    className={styles.timedEvent}
                    style={{
                      top: ((from - WORK_START * 60) / 60) * HOUR_HEIGHT,
                      height: Math.max(((to - from) / 60) * HOUR_HEIGHT, 22),
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    <EventChip ev={ev} onDelete={onDelete} showTime />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
