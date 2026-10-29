"use client";

import styles from "./Todo.module.css";

export default function TodoItem({ todo, onDelete }) {
  return (
    <li className={styles.item}>
      <span className={styles.title}>{todo.title}</span>
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
