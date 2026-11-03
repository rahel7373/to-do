"use client";

import { EVENT_TYPES } from "../../lib/schedule";
import styles from "./Schedule.module.css";

export default function EventChip({ ev, onDelete, showTime = false }) {
  const time = showTime && ev.startTime ? `${ev.startTime} ` : "";
  return (
    <span className={`${styles.chip} ${styles[ev.type]}`}>
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
