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

// 휴가·휴일 먼저, 그다음 업무(등록순)
export function sortAllDay(list) {
  const rank = { leave: 0, holiday: 1, work: 2 };
  return [...list].sort(
    (a, b) => rank[a.type] - rank[b.type] || a.createdAt - b.createdAt
  );
}
