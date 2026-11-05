"use client";

import { markText, meetingText } from "../../lib/dayEntries";
import styles from "./Schedule.module.css";

// 월간 달력 한 칸: 휴가·교육 표시와 회의 (주간 시트와 같은 데이터)
export default function DayChips({ ymd, mark, meetings, onChangeDay }) {
  return (
    <>
      {mark && (
        <span className={`${styles.chip} ${styles[`mk_${mark.kind}`]}`}>
          <span className={styles.chipText}>{markText(mark)}</span>
          <button
            type="button"
            className={styles.chipDelete}
            onClick={(e) => {
              e.stopPropagation();
              onChangeDay(ymd, (d) => ({ ...d, mark: null }));
            }}
            aria-label={`${ymd} ${markText(mark)} 표시 삭제`}
          >
            ×
          </button>
        </span>
      )}
      {meetings.map(({ index, meeting }) => (
        <span
          key={index}
          className={`${styles.chip} ${styles.meetChip} ${
            meeting.important ? styles.meetImportant : ""
          } ${meeting.cancelled ? styles.meetCancelled : ""}`}
        >
          <span className={styles.chipText}>{meetingText(meeting)}</span>
          <button
            type="button"
            className={styles.chipDelete}
            onClick={(e) => {
              e.stopPropagation();
              onChangeDay(ymd, (d) => ({
                ...d,
                meetings: d.meetings.map((m, i) =>
                  i === index ? { ...m, cancelled: !m.cancelled } : m
                ),
              }));
            }}
            aria-label={`${ymd} 회의 ${meetingText(meeting)} 취소 표시`}
            title={meeting.cancelled ? "취소 표시 해제" : "회의가 취소되면 눌러 표시"}
          >
            {meeting.cancelled ? "복원" : "취소"}
          </button>
        </span>
      ))}
    </>
  );
}
