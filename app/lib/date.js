function toLocalDate(str) {
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
