"use client";

import { useState } from "react";
import styles from "./Schedule.module.css";

// 새 날짜를 골라 항목을 옮기는 입력칸. onMove(새 날짜)는 안내 문구를 돌려준다(성공이면 빈 문자열).
export function DateMove({ from, label, onMove, onDone }) {
  const [to, setTo] = useState(from);
  return (
    <span className={styles.moveRow} onClick={(e) => e.stopPropagation()}>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        aria-label={`${label} 옮길 날짜`}
      />
      <button
        type="button"
        disabled={!to || to === from}
        onClick={() => {
          const msg = onMove(to);
          if (msg) alert(msg);
          else onDone?.();
        }}
        aria-label={`${label} 날짜로 이동`}
      >
        이동
      </button>
    </span>
  );
}

// 작은 달력 버튼을 누르면 날짜 입력칸이 펼쳐진다.
export default function MovePicker({ from, label, onMove }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.movePicker}>
      <button
        type="button"
        className={styles.moveToggle}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`${label} 날짜 변경`}
        title="날짜 변경 (새로 입력하지 않고 옮기기)"
      >
        📅
      </button>
      {open && (
        <span className={styles.movePop}>
          <DateMove
            from={from}
            label={label}
            onMove={onMove}
            onDone={() => setOpen(false)}
          />
        </span>
      )}
    </span>
  );
}
