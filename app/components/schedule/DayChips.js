"use client";

import { useEffect, useState } from "react";
import { markText, meetingText } from "../../lib/dayEntries";
import styles from "./Schedule.module.css";

// 월간 달력 한 칸: 휴가·교육 표시와 회의 (주간 시트와 같은 데이터)
// 칸이 작아서 버튼은 숨기고, 항목을 우클릭(또는 길게 누름)하면 작은 메뉴로 취소·삭제를 한다.
export default function DayChips({ ymd, mark, meetings, onChangeDay }) {
  const [menu, setMenu] = useState(null); // "mark" | 회의 칸 번호

  useEffect(() => {
    if (menu === null) return;
    const close = () => setMenu(null);
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  const open = (key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu(key);
  };

  return (
    <>
      {mark && (
        <span
          className={`${styles.chip} ${styles.chipMenuHost} ${styles[`mk_${mark.kind}`]}`}
          onContextMenu={open("mark")}
          title="우클릭: 삭제"
        >
          <span className={styles.chipText}>{markText(mark)}</span>
          {menu === "mark" && (
            <span className={styles.chipMenu}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(null);
                  onChangeDay(ymd, (d) => ({ ...d, mark: null }));
                }}
                aria-label={`${ymd} ${markText(mark)} 표시 삭제`}
              >
                삭제
              </button>
            </span>
          )}
        </span>
      )}
      {meetings.map(({ index, meeting }) => (
        <span
          key={index}
          className={`${styles.chip} ${styles.chipMenuHost} ${styles.meetChip} ${
            meeting.important ? styles.meetImportant : ""
          } ${meeting.cancelled ? styles.meetCancelled : ""}`}
          onContextMenu={open(index)}
          title="우클릭: 취소 표시"
        >
          <span className={styles.chipText}>{meetingText(meeting)}</span>
          {menu === index && (
            <span className={styles.chipMenu}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(null);
                  onChangeDay(ymd, (d) => ({
                    ...d,
                    meetings: d.meetings.map((m, i) =>
                      i === index ? { ...m, cancelled: !m.cancelled } : m
                    ),
                  }));
                }}
                aria-label={`${ymd} 회의 ${meetingText(meeting)} 취소 표시`}
              >
                {meeting.cancelled ? "취소 해제" : "취소 표시"}
              </button>
            </span>
          )}
        </span>
      ))}
    </>
  );
}
