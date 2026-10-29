"use client";

import { formatDday, isOverdue } from "../lib/date";
import styles from "./Todo.module.css";

export default function TodoItem({ todo, onToggle, onDelete }) {
  const overdue = isOverdue(todo);

  return (
    <li className={`${styles.item} ${overdue ? styles.overdue : ""}`}>
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
      {todo.dueDate && (
        <span className={styles.due}>
          {todo.dueDate} · {formatDday(todo.dueDate)}
        </span>
      )}
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
