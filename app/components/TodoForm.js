"use client";

import { useState } from "react";
import styles from "./Todo.module.css";

export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일을 입력하세요"
        aria-label="할 일"
      />
      <button className={styles.addButton} type="submit">
        추가
      </button>
    </form>
  );
}
