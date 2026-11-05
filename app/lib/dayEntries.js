import { addDays } from "./date";
import { MARK_KINDS, MEETING_SLOTS, getDay } from "./dayLog";

// 휴가·교육·회의는 날짜별 업무 시트(days)에 저장하고,
// 주간·월간·분기·연간 어디서든 같은 데이터를 읽는다.

export const markText = (mark) =>
  mark.text || MARK_KINDS.find(([k]) => k === mark.kind)?.[1] || "휴무";

export const isEmptyMeeting = (m) =>
  !m.time && !m.place && !m.custom && !m.title;

export const meetingText = (m) =>
  [m.time, m.title || m.custom || m.place].filter(Boolean).join(" ");

// 회의 칸을 보여 줄 순서(칸 번호 목록): 내용이 있는 칸은 시간 순(시간이 없으면 그 뒤),
// 빈 칸은 맨 아래. 입력한 칸 번호와 상관없이 시간 순으로 보인다.
export function meetingOrder(meetings) {
  return meetings
    .map((m, index) => ({ m, index }))
    .sort((a, b) => {
      const ea = isEmptyMeeting(a.m) ? 1 : 0;
      const eb = isEmptyMeeting(b.m) ? 1 : 0;
      if (ea !== eb) return ea - eb;
      if (ea) return a.index - b.index;
      if (!a.m.time !== !b.m.time) return a.m.time ? -1 : 1;
      return a.m.time.localeCompare(b.m.time) || a.index - b.index;
    })
    .map((x) => x.index);
}

// 그날의 회의 중 내용이 있는 칸을 시간 순으로: [{ index, meeting }]
export function meetingsOn(days, rules, ymd) {
  const meetings = getDay(days, ymd, rules).meetings;
  return meetingOrder(meetings)
    .map((index) => ({ index, meeting: meetings[index] }))
    .filter(({ meeting }) => !isEmptyMeeting(meeting));
}

// 그날의 할 일(업무) 중 내용이 있는 칸: [{ index, todo }]
export function todosOn(days, rules, ymd) {
  return getDay(days, ymd, rules)
    .todos.map((todo, index) => ({ index, todo }))
    .filter(({ todo }) => todo.text.trim());
}

// 업무 하나를 날짜별 할 일 칸에 넣는다. 모든 날짜에 빈 칸이 있어야 넣고, 없으면 null.
export function putTodo(days, rules, dates, text, done, pack) {
  const slots = [];
  for (const ymd of dates) {
    const idx = getDay(days, ymd, rules).todos.findIndex((t) => !t.text.trim());
    if (idx < 0) return null;
    slots.push(idx);
  }
  const next = { ...days };
  dates.forEach((ymd, k) => {
    const day = getDay(next, ymd, rules);
    const todos = day.todos.map((t, i) => (i === slots[k] ? { text, done: !!done } : t));
    next[ymd] = pack({ ...day, todos }, ymd, rules);
  });
  return next;
}

export function markOn(days, rules, ymd) {
  return getDay(days, ymd, rules).mark;
}

// 시작일~종료일 사이의 날짜 목록 (최대 400일)
export function datesBetween(from, to) {
  const out = [];
  for (let d = from, i = 0; d <= to && i < 400; d = addDays(d, 1), i++) {
    out.push(d);
  }
  return out;
}

// 첫 번째 빈 회의 칸 번호 (없으면 -1)
export function firstFreeSlot(meetings) {
  for (let i = 0; i < MEETING_SLOTS; i++) {
    if (isEmptyMeeting(meetings[i])) return i;
  }
  return -1;
}
