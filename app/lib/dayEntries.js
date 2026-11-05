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

// 그날의 회의 중 내용이 있는 칸: [{ index, meeting }]
export function meetingsOn(days, rules, ymd) {
  return getDay(days, ymd, rules)
    .meetings.map((meeting, index) => ({ index, meeting }))
    .filter(({ meeting }) => !isEmptyMeeting(meeting));
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
