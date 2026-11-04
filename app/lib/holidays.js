// 휴일 계산: 법정공휴일(양력 + 음력) + 대체공휴일 + 병원 자체 휴일.
// 음력은 브라우저의 Intl 중국력으로 변환하므로 연도별 표를 따로 두지 않는다.
// 임시공휴일은 계산할 수 없으므로 '휴일'로 직접 등록한다.

const pad = (n) => String(n).padStart(2, "0");
const toYMD = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function parse(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shift(ymd, n) {
  const dt = parse(ymd);
  dt.setDate(dt.getDate() + n);
  return toYMD(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

// 일요일 = 0 ... 토요일 = 6
const dayOfWeek = (ymd) => parse(ymd).getDay();

// 대체공휴일 대상 여부를 함께 적는다. (신정·현충일·개원기념일은 대상 아님)
const SOLAR = [
  [1, 1, "신정", false],
  [3, 1, "삼일절", true],
  [5, 5, "어린이날", true],
  [6, 6, "현충일", false],
  [8, 15, "광복절", true],
  [10, 3, "개천절", true],
  [10, 9, "한글날", true],
  [12, 25, "크리스마스", true],
  [10, 15, "개원기념일", false],
];

const lunarFormat = new Intl.DateTimeFormat("en-u-ca-chinese", {
  month: "numeric",
  day: "numeric",
});

// 윤달은 month가 "4bis"처럼 나오므로 일반 달과 구분된다.
function lunarOf(ymd) {
  const parts = lunarFormat.formatToParts(
    new Date(parse(ymd).getTime() + 12 * 3600 * 1000)
  );
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { month: get("month"), day: Number(get("day")) };
}

const cache = new Map();

function buildYear(year) {
  const map = new Map();
  const groups = []; // { name, dates, multi }

  for (const [m, d, name, sub] of SOLAR) {
    groups.push({ name, dates: [toYMD(year, m, d)], multi: false, sub });
  }

  // 음력 명절: 연중 모든 날짜를 음력으로 바꿔 해당 날을 찾는다.
  for (let d = parse(`${year}-01-01`); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const ymd = toYMD(year, d.getMonth() + 1, d.getDate());
    const { month, day } = lunarOf(ymd);
    if (month === "1" && day === 1) {
      groups.push({ name: "설날", dates: [shift(ymd, -1), ymd, shift(ymd, 1)], multi: true, sub: true });
    } else if (month === "8" && day === 15) {
      groups.push({ name: "추석", dates: [shift(ymd, -1), ymd, shift(ymd, 1)], multi: true, sub: true });
    } else if (month === "4" && day === 8) {
      groups.push({ name: "부처님오신날", dates: [ymd], multi: false, sub: true });
    }
  }

  for (const g of groups) {
    g.dates.forEach((date, i) => {
      const label = g.multi && i !== 1 ? `${g.name} 연휴` : g.name;
      if (!map.has(date)) map.set(date, { name: label, kind: "off" });
    });
  }

  // 대체공휴일: 일요일(설날·추석 외에는 토요일 포함)이거나 다른 공휴일과 겹치면 다음 평일.
  const seen = new Set();
  for (const g of groups) {
    const overlap = g.dates.some((d) => seen.has(d));
    const weekend = g.dates.some((d) => {
      const w = dayOfWeek(d);
      return w === 0 || (!g.multi && w === 6);
    });
    g.dates.forEach((d) => seen.add(d));
    if (!g.sub || !(overlap || weekend)) continue;

    let day = shift(g.dates[g.dates.length - 1], 1);
    while (dayOfWeek(day) === 0 || dayOfWeek(day) === 6 || map.has(day)) {
      day = shift(day, 1);
    }
    map.set(day, { name: `대체공휴일(${g.name})`, kind: "off" });
  }

  // 노조설립일: 8월 첫 금요일, 오전만 근무
  for (let d = 1; d <= 7; d++) {
    const ymd = toYMD(year, 8, d);
    if (dayOfWeek(ymd) === 5 && !map.has(ymd)) {
      map.set(ymd, { name: "노조설립일", kind: "half" });
    }
  }
  return map;
}

// { name, kind: "off" | "half" } 또는 null. half = 오전 근무만.
export function holidayOf(ymd) {
  const year = Number(ymd.slice(0, 4));
  if (!cache.has(year)) cache.set(year, buildYear(year));
  return cache.get(year).get(ymd) ?? null;
}
