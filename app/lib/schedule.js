// 출근·퇴근 시각 (시간대 타임테이블의 범위)
export const WORK_START = 9;
export const WORK_END = 18;

export const EVENT_TYPES = {
  work: { label: "업무" },
  holiday: { label: "휴일" },
  leave: { label: "휴가" },
};

export function eventCoversDate(ev, ymd) {
  return ev.startDate <= ymd && ymd <= ev.endDate;
}

export function eventsOn(events, ymd) {
  return events.filter((e) => eventCoversDate(e, ymd));
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isTimed(ev) {
  return !!ev.startTime && !!ev.endTime;
}

// 종일 줄 정렬: 휴가·휴일 먼저, 그다음 업무(등록순)
export function sortAllDay(list) {
  const rank = { leave: 0, holiday: 1, work: 2 };
  return [...list].sort(
    (a, b) => rank[a.type] - rank[b.type] || a.createdAt - b.createdAt
  );
}

// 시간이 겹치는 업무를 나란히 놓기 위해 lane(세로 줄)을 배정한다.
export function layoutTimed(list) {
  const sorted = [...list].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );
  const laneEnds = [];
  const placed = sorted.map((ev) => {
    const start = toMinutes(ev.startTime);
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = toMinutes(ev.endTime);
    return { ev, lane };
  });
  return placed.map((p) => ({ ...p, lanes: laneEnds.length }));
}
