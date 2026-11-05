"use client";

import styles from "./Schedule.module.css";

// 월간·분기 보기의 정기 업무 한 줄: 체크박스 + 이름. 주간 시트와 같은 recurDone에 저장된다.
export default function RecurCheck({ ymd, item, quarterly, days, onChangeDay, showDate }) {
  const done = !!days?.[ymd]?.recurDone?.[item.id];
  return (
    <label
      className={`${styles.recurChip} ${styles.recurCheck}`}
      title={quarterly ? "분기 업무" : "매월 업무"}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={(e) =>
          onChangeDay(ymd, (x) => ({
            ...x,
            recurDone: { ...x.recurDone, [item.id]: e.target.checked },
          }))
        }
        onClick={(e) => e.stopPropagation()}
        aria-label={`${ymd} ${item.label} 완료`}
      />
      <span className={done ? styles.doneText : ""}>
        {showDate ? "" : quarterly ? "분기 " : ""}
        {item.label}
      </span>
    </label>
  );
}
