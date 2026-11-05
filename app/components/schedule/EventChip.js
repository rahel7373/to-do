"use client";

import { EVENT_TYPES } from "../../lib/schedule";
import styles from "./Schedule.module.css";

export default function EventChip({ ev, onDelete, onToggle, showTime = false }) {
  const time = showTime && ev.startTime ? `${ev.startTime} ` : "";
  return (
    <span
      className={`${styles.chip} ${styles[ev.type]} ${ev.done ? styles.chipDone : ""}`}
    >
      {onToggle && ev.type === "work" && (
        <input
          type="checkbox"
          className={styles.chipCheck}
          checked={!!ev.done}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggle(ev.id)}
          aria-label={`업무 "${ev.title}" 수행 체크`}
        />
      )}
      <span className={styles.chipText}>
        {time}
        {ev.title}
      </span>
      <button
        type="button"
        className={styles.chipDelete}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(ev.id);
        }}
        aria-label={`${EVENT_TYPES[ev.type].label} "${ev.title}" 삭제`}
      >
        ×
      </button>
    </span>
  );
}
