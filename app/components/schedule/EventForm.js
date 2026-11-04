"use client";

import { useEffect, useState } from "react";
import { EVENT_TYPES, toMinutes } from "../../lib/schedule";
import styles from "./Schedule.module.css";

export default function EventForm({ defaultDate, onAdd }) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

  // 월간 화면에서 날짜를 누르면 시작일을 그 날짜로 맞춘다.
  useEffect(() => {
    setStartDate(defaultDate);
  }, [defaultDate]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!type) return;
    const label = EVENT_TYPES[type].label;
    const trimmed = title.trim();
    if (type === "work" && !trimmed) return setError("업무 내용을 입력하세요.");
    if (!startDate) return setError("시작일을 선택하세요.");

    const timed = type === "work" && (startTime || endTime);
    if (timed) {
      if (!startTime || !endTime)
        return setError("시작·종료 시간을 모두 입력하세요.");
      if (toMinutes(endTime) <= toMinutes(startTime))
        return setError("종료 시간이 시작 시간보다 늦어야 합니다.");
    }
    // 시간이 있는 업무는 하루짜리만 허용한다.
    const end = timed ? startDate : endDate || startDate;
    if (end < startDate) return setError("종료일이 시작일보다 빠릅니다.");

    onAdd({
      type,
      title: trimmed || label,
      startDate,
      endDate: end,
      startTime: timed ? startTime : null,
      endTime: timed ? endTime : null,
    });
    setTitle("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setError("");
    setType(""); // 다시 접어 공간을 아낀다
  }

  const hasTime = !!(startTime || endTime);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <select
        className={styles.field}
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="종류"
      >
        <option value="">종류 선택</option>
        {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {type && (
        <>
      <input
        className={`${styles.field} ${styles.titleField}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={type === "work" ? "업무 내용" : "메모 (선택)"}
        aria-label="내용"
      />
      <label className={styles.fieldLabel}>
        시작일
        <input
          className={styles.field}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>
      <label className={styles.fieldLabel}>
        종료일
        <input
          className={styles.field}
          type="date"
          value={hasTime ? "" : endDate}
          min={startDate}
          disabled={hasTime}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </label>
      {type === "work" && (
        <>
          <label className={styles.fieldLabel}>
            시작 시간
            <input
              className={styles.field}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className={styles.fieldLabel}>
            종료 시간
            <input
              className={styles.field}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </>
      )}
      <button className={styles.addButton} type="submit">
        추가
      </button>
        </>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
