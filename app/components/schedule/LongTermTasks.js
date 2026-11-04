"use client";

import { useState } from "react";
import { useLocalState } from "../../lib/useLocalList";
import styles from "./Schedule.module.css";

const EMPTY = [];

// 하루에 끝나지 않는 장기·중요 업무 목록 (체크 + 메모). localStorage "longTasks"에 저장한다.
export default function LongTermTasks() {
  const [tasks, setTasks, loaded] = useLocalState("longTasks", EMPTY);
  const [title, setTitle] = useState("");
  const [openMemo, setOpenMemo] = useState({}); // { id: true }

  const patch = (id, p) =>
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...p } : t)));

  function add(e) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    setTasks((list) => [
      ...list,
      { id: crypto.randomUUID(), title: text, done: false, memo: "" },
    ]);
    setTitle("");
  }

  if (!loaded) return null;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section className={styles.longBox} aria-label="장기 중요 업무">
      <h3 className={styles.longTitle}>
        ★ 장기 중요 업무
        {tasks.length > 0 && (
          <span className={styles.longCount}>
            {doneCount}/{tasks.length}
          </span>
        )}
      </h3>
      <ul className={styles.longList}>
        {tasks.map((t) => {
          const memoOn = openMemo[t.id] || !!t.memo;
          return (
            <li key={t.id} className={styles.longItem}>
              <div className={styles.longRow}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => patch(t.id, { done: e.target.checked })}
                  aria-label={`${t.title} 완료`}
                />
                <span className={t.done ? styles.longDone : styles.longText}>
                  {t.title}
                </span>
                <button
                  type="button"
                  className={styles.longBtn}
                  onClick={() =>
                    setOpenMemo((o) => ({ ...o, [t.id]: !openMemo[t.id] }))
                  }
                  aria-label={`${t.title} 메모 ${memoOn ? "접기" : "열기"}`}
                  title="메모"
                >
                  📝
                </button>
                <button
                  type="button"
                  className={styles.longBtn}
                  onClick={() =>
                    setTasks((list) => list.filter((x) => x.id !== t.id))
                  }
                  aria-label={`${t.title} 삭제`}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
              {memoOn && (
                <textarea
                  className={styles.longMemo}
                  value={t.memo}
                  rows={3}
                  placeholder="메모"
                  onChange={(e) => patch(t.id, { memo: e.target.value })}
                  aria-label={`${t.title} 메모`}
                />
              )}
            </li>
          );
        })}
      </ul>
      <form className={styles.longAdd} onSubmit={add}>
        <input
          className={styles.longInput}
          value={title}
          placeholder="업무 추가 (예: 인력 추진)"
          onChange={(e) => setTitle(e.target.value)}
          aria-label="장기 중요 업무 이름"
        />
        <button type="submit" className={styles.longAddBtn}>
          추가
        </button>
      </form>
    </section>
  );
}
