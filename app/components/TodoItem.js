"use client";

import styles from "./Todo.module.css";

export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={styles.item}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <span className={`${styles.title} ${todo.done ? styles.done : ""}`}>
          {todo.title}
        </span>
      </label>
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`"${todo.title}" 삭제`}
      >
        삭제
      </button>
    </li>
  );
}
