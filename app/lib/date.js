export function toLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// 마감일까지 남은 일수 (오늘 = 0, 지났으면 음수)
export function daysUntil(dueDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((toLocalDate(dueDate) - today) / 86400000);
}

export function formatDday(dueDate) {
  const n = daysUntil(dueDate);
  if (n === 0) return "오늘";
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

export function isOverdue(todo) {
  return !todo.done && !!todo.dueDate && daysUntil(todo.dueDate) < 0;
}

// 마감일 빠른 순, 마감일 없는 항목은 맨 아래, 같으면 최근 등록 순
export function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });
}

const pad = (n) => String(n).padStart(2, "0");

export function toYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayYMD() {
  return toYMD(new Date());
}

export function addDays(ymd, n) {
  const d = toLocalDate(ymd);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

// 말일을 넘기지 않도록 일(day)을 보정해서 월을 더한다.
export function addMonths(ymd, n) {
  const d = toLocalDate(ymd);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth() + 1)));
  return toYMD(d);
}

// month: 1~12
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// 해당 날짜가 속한 주의 월요일
export function startOfWeek(ymd) {
  const d = toLocalDate(ymd);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toYMD(d);
}

// 월요일 = 0 ... 일요일 = 6
export function weekdayIndex(ymd) {
  return (toLocalDate(ymd).getDay() + 6) % 7;
}

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
