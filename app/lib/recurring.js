import { addDays, weekdayIndex } from "./date";
import { holidayOf } from "./holidays";

const QUARTER_MONTHS = [1, 4, 7, 10];

// 정기 업무: 매달 또는 지정한 달의 며칠에 해야 하는 일.
// 그날이 휴일(주말·공휴일)이면 다음 근무일로 넘어간다.
export const RECURRING = [
  { id: "shift-check", day: 1, label: "근무상황부 점검 돌리기" },
  {
    id: "final-check",
    day: 3,
    label: "근무상황부·시간외·휴게불가 최종점검",
  },
  {
    id: "meeting-draft",
    day: 5,
    months: QUARTER_MONTHS,
    label: "부서회의자료 초안 만들기",
  },
  {
    id: "meeting-staff",
    day: 10,
    months: QUARTER_MONTHS,
    label: "부서회의자료 인력확인 요청",
  },
  {
    id: "narcotics-cross",
    day: 10,
    months: QUARTER_MONTHS,
    label: "마약류 크로스점검",
  },
  {
    id: "meeting-final",
    day: 11,
    months: QUARTER_MONTHS,
    label: "부서회의자료 최종본 제출",
  },
  {
    id: "safety-report",
    day: 15,
    months: QUARTER_MONTHS,
    label: "안전관리보고서 제출",
  },
  {
    id: "quality-report",
    day: 18,
    months: QUARTER_MONTHS,
    label: "질향상보고서 결재 올리기",
  },
];

const pad = (n) => String(n).padStart(2, "0");

// 토·일요일이거나 공휴일(내장 휴일)이면 쉬는 날
function isOff(ymd) {
  return weekdayIndex(ymd) >= 5 || holidayOf(ymd)?.kind === "off";
}

// 실제로 하는 날: 예정일이 쉬는 날이면 다음 근무일
function dueDate(year, month, day) {
  let ymd = `${year}-${pad(month)}-${pad(day)}`;
  while (isOff(ymd)) ymd = addDays(ymd, 1);
  return ymd;
}

// 그날 해야 하는 정기 업무 목록
export function recurringOn(ymd) {
  const [y, m] = ymd.split("-").map(Number);
  return RECURRING.filter(
    (r) => (!r.months || r.months.includes(m)) && dueDate(y, m, r.day) === ymd
  );
}
