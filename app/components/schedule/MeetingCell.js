"use client";

import { useState } from "react";
import { weekdayIndex, WEEKDAYS } from "../../lib/date";
import {
  CUSTOM_PLACE,
  MEETING_PLACES,
  NTH_LABELS,
  describeRule,
} from "../../lib/dayLog";
import styles from "./Schedule.module.css";

const NTH_KEYS = [1, 2, 3, 4, 5, -1];

// 회의 한 칸. 비어 있으면 '+ 회의' 버튼만 보이고, 누르면 입력칸이 펼쳐진다.
export default function MeetingCell({
  ymd,
  index,
  label,
  meeting: m,
  rule,
  open,
  onOpen,
  onPatch,
  onAddRule,
  onDeleteRule,
}) {
  const [draft, setDraft] = useState(null); // 반복 설정 중이면 설정값
  const name = `${label} 회의 ${index + 1}`;
  const empty =
    !m.time && !m.place && !m.title && !m.custom && !m.important;

  if (empty && !open) {
    return (
      <button
        type="button"
        className={styles.addMeeting}
        onClick={() => onOpen(true)}
        aria-label={`${name} 추가`}
      >
        + 회의
      </button>
    );
  }

  function startDraft() {
    setDraft({
      kind: "weekly",
      weekdays: [weekdayIndex(ymd)],
      day: Number(ymd.slice(8)),
      nth: Math.ceil(Number(ymd.slice(8)) / 7),
      weekday: weekdayIndex(ymd),
    });
  }

  function saveDraft() {
    const rule = {
      id: crypto.randomUUID(),
      kind: draft.kind,
      slot: index,
      time: m.time,
      place: m.place,
      custom: m.custom,
      title: m.title,
      important: !!m.important,
      from: ymd,
    };
    if (draft.kind === "weekly") {
      rule.weekdays = [...draft.weekdays].sort();
    } else if (draft.kind === "monthDay") {
      rule.day = draft.day;
    } else {
      rule.nth = draft.nth;
      rule.weekday = draft.weekday;
    }
    onAddRule(rule);
    onPatch({ ruleId: rule.id });
    setDraft(null);
  }

  const canRepeat = !!(m.title || m.time || m.place);
  const weeklyEmpty = draft?.kind === "weekly" && draft.weekdays.length === 0;

  return (
    <div
      className={`${styles.meeting} ${m.important ? styles.important : ""}`}
    >
      <div className={styles.meetingTop}>
        <input
          className={styles.cellInput}
          type="time"
          value={m.time}
          onChange={(e) => onPatch({ time: e.target.value })}
          aria-label={`${name} 시간`}
        />
        <button
          type="button"
          className={`${styles.star} ${m.important ? styles.starOn : ""}`}
          onClick={() => onPatch({ important: !m.important })}
          aria-pressed={!!m.important}
          aria-label={`${name} 중요 표시`}
          title="중요 일정"
        >
          {m.important ? "★" : "☆"}
        </button>
        {empty && (
          <button
            type="button"
            className={styles.star}
            onClick={() => onOpen(false)}
            aria-label={`${name} 접기`}
            title="접기"
          >
            ✕
          </button>
        )}
      </div>

      {/* 장소: 직접 입력을 고르면 목록 대신 입력칸만 보인다. */}
      {m.place === CUSTOM_PLACE ? (
        <div className={styles.meetingTop}>
          <input
            className={styles.cellInput}
            value={m.custom}
            placeholder="장소 입력"
            autoFocus
            onChange={(e) => onPatch({ custom: e.target.value })}
            aria-label={`${name} 장소 직접 입력`}
          />
          <button
            type="button"
            className={styles.star}
            onClick={() => onPatch({ place: "", custom: "" })}
            aria-label={`${name} 장소 목록으로`}
            title="목록에서 고르기"
          >
            ▾
          </button>
        </div>
      ) : (
        <select
          className={styles.cellInput}
          value={m.place}
          onChange={(e) => onPatch({ place: e.target.value })}
          aria-label={`${name} 장소`}
        >
          <option value="">장소 선택</option>
          {MEETING_PLACES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value={CUSTOM_PLACE}>{CUSTOM_PLACE}</option>
        </select>
      )}

      <input
        className={styles.cellInput}
        value={m.title}
        placeholder="회의 제목"
        onChange={(e) => onPatch({ title: e.target.value })}
        aria-label={`${name} 제목`}
      />

      {/* 반복: 같은 회의를 매주/매월 자동으로 넣는다. */}
      {rule ? (
        <div className={styles.repeatInfo}>
          <span>🔁 {describeRule(rule)}</span>
          <button
            type="button"
            className={styles.repeatButton}
            onClick={() => onDeleteRule(rule.id)}
            aria-label={`${name} 반복 해제`}
          >
            반복 해제
          </button>
        </div>
      ) : draft ? (
        <div className={styles.repeatEditor}>
          <select
            className={styles.cellInput}
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
            aria-label={`${name} 반복 방식`}
          >
            <option value="weekly">매주 요일</option>
            <option value="monthDay">매월 같은 날짜</option>
            <option value="monthNth">매월 N번째 요일</option>
          </select>
          {draft.kind === "weekly" && (
            <div className={styles.weekdayPick}>
              {WEEKDAYS.slice(0, 5).map((w, i) => (
                <label key={w}>
                  <input
                    type="checkbox"
                    checked={draft.weekdays.includes(i)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        weekdays: e.target.checked
                          ? [...draft.weekdays, i]
                          : draft.weekdays.filter((x) => x !== i),
                      })
                    }
                    aria-label={`${name} 반복 ${w}요일`}
                  />
                  {w}
                </label>
              ))}
            </div>
          )}
          {draft.kind === "monthDay" && (
            <label className={styles.repeatRow}>
              매월
              <input
                className={styles.cellInput}
                type="number"
                min="1"
                max="31"
                value={draft.day}
                onChange={(e) =>
                  setDraft({ ...draft, day: Number(e.target.value) })
                }
                aria-label={`${name} 반복 날짜`}
              />
              일
            </label>
          )}
          {draft.kind === "monthNth" && (
            <div className={styles.repeatRow}>
              <select
                className={styles.cellInput}
                value={draft.nth}
                onChange={(e) =>
                  setDraft({ ...draft, nth: Number(e.target.value) })
                }
                aria-label={`${name} 반복 몇 번째`}
              >
                {NTH_KEYS.map((n) => (
                  <option key={n} value={n}>
                    {NTH_LABELS[n]}
                  </option>
                ))}
              </select>
              <select
                className={styles.cellInput}
                value={draft.weekday}
                onChange={(e) =>
                  setDraft({ ...draft, weekday: Number(e.target.value) })
                }
                aria-label={`${name} 반복 요일`}
              >
                {WEEKDAYS.slice(0, 5).map((w, i) => (
                  <option key={w} value={i}>
                    {w}요일
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.repeatRow}>
            <button
              type="button"
              className={styles.repeatButton}
              disabled={weeklyEmpty}
              onClick={saveDraft}
              aria-label={`${name} 반복 등록`}
            >
              반복 등록
            </button>
            <button
              type="button"
              className={styles.repeatButton}
              onClick={() => setDraft(null)}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        canRepeat && (
          <button
            type="button"
            className={styles.repeatButton}
            onClick={startDraft}
            aria-label={`${name} 반복 설정`}
          >
            🔁 반복
          </button>
        )
      )}
    </div>
  );
}
