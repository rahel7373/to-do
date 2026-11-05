import { daysInMonth, weekdayIndex } from "./date";

export const CUSTOM_PLACE = "직접 입력";

export const MEETING_PLACES = [
  "1동 지하1층 대강당",
  "1동 지하1층 제1세미나실",
  "1동 지하1층 제2세미나실",
  "2동 11층 제3세미나실",
  "2동 11층 제4세미나실",
  "3동 중회의실",
  "1동 3층 대회의실",
  "1동 3층 소회의실",
  "팀장님방",
  "내방[수간호사방]",
];

// 날짜 머리글에 크리스마스처럼 표시하는 수동 표시 (key, 라벨, 기본 문구)
export const MARK_KINDS = [
  ["leave", "휴가", "휴가"],
  ["training", "외부 교육", "외부 교육"],
  ["off", "기타 휴무", ""],
];

export const MEETING_SLOTS = 8; // 저장되는 최대 회의 칸
export const MEETING_SHOWN = 4; // 처음에 보이는 회의 칸 수
export const TODO_SLOTS = 8;
export const TODO_DEFAULT_SHOWN = 4; // 처음에 보이는 할 일 칸 수
export const INTERVIEW_SLOTS = 2;

// 완료 여부만 체크하는 업무 (key, 라벨)
export const CHECK_ITEMS = [
  ["workReport", "근무보고서 입력"],
  ["attendance", "근태이상보고"],
  ["notice", "그룹웨어 공지사항 확인 및 전달"],
  ["overtime", "시간외/근태 결재"],
];

const range = (n, make) => Array.from({ length: n }, make);

const emptyMeeting = () => ({
  time: "",
  place: "",
  custom: "",
  title: "",
  important: false,
  cancelled: false, // 회의가 취소됨 (지우지 않고 취소선으로 표시)
});

// 반복 회의 규칙
//  { id, kind: "weekly", weekdays: [0..4] }   매주 지정한 요일 (월요일 = 0)
//  { id, kind: "monthDay", day }               매월 같은 날짜
//  { id, kind: "monthNth", nth, weekday }      매월 N번째(마지막 = -1) 요일
//  공통: slot(회의 칸 번호), time, place, custom, title, important, from(시작 날짜)
export const DEFAULT_MEETING_RULES = [
  {
    id: "default-outpatient",
    kind: "weekly",
    weekdays: [0, 3],
    slot: 0,
    time: "10:00",
    place: "팀장님방",
    custom: "",
    title: "외래간호파트 업무회의",
    important: false,
    from: "2000-01-01",
  },
  {
    id: "default-zumma",
    kind: "weekly",
    weekdays: [0, 2, 4],
    slot: 3,
    time: "09:00",
    place: "",
    custom: "",
    title: "zumma댄스",
    important: false,
    from: "2000-01-01",
  },
];

export const NTH_LABELS = { 1: "첫째", 2: "둘째", 3: "셋째", 4: "넷째", 5: "다섯째", "-1": "마지막" };
const WEEKDAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

export function ruleMatches(rule, ymd) {
  if (rule.from && ymd < rule.from) return false;
  const wd = weekdayIndex(ymd);
  const dom = Number(ymd.slice(8));
  if (rule.kind === "weekly") return rule.weekdays.includes(wd);
  if (rule.kind === "monthDay") return dom === Number(rule.day);
  if (rule.kind === "monthNth") {
    if (wd !== rule.weekday) return false;
    if (rule.nth === -1) {
      const last = daysInMonth(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)));
      return dom + 7 > last;
    }
    return Math.ceil(dom / 7) === rule.nth;
  }
  return false;
}

export function describeRule(rule) {
  if (rule.kind === "weekly") {
    return "매주 " + rule.weekdays.map((w) => WEEKDAY_NAMES[w]).join("·");
  }
  if (rule.kind === "monthDay") return "매월 " + rule.day + "일";
  return "매월 " + NTH_LABELS[rule.nth] + " " + WEEKDAY_NAMES[rule.weekday] + "요일";
}

const hasContent = (m) => !!(m.time || m.place || m.custom || m.title);

function defaultMeetings(ymd, rules) {
  const meetings = range(MEETING_SLOTS, emptyMeeting);
  for (const r of rules) {
    if (!ruleMatches(r, ymd)) continue;
    // 정해 둔 칸이 이미 차 있으면 다음 빈 칸을 쓴다.
    let slot = Math.min(r.slot ?? 0, MEETING_SLOTS - 1);
    for (let k = 0; k < MEETING_SLOTS && hasContent(meetings[slot]); k++) {
      slot = (slot + 1) % MEETING_SLOTS;
    }
    if (hasContent(meetings[slot])) continue;
    meetings[slot] = {
      ...emptyMeeting(),
      time: r.time ?? "",
      place: r.place ?? "",
      custom: r.custom ?? "",
      title: r.title ?? "",
      important: !!r.important,
      ruleId: r.id,
    };
  }
  return meetings;
}

// 차주 헬퍼 칸의 요일별 기본 문구 (월요일 = 0)
const HELPER_DEFAULTS = { 1: "차주헬퍼 장부 작성", 2: "차주헬퍼 공유/수정" };

export function defaultDay(ymd, rules = []) {
  return {
    mark: null, // { kind: "leave" | "training" | "off", text }
    patients: "",
    amDepts: "",
    pmDepts: "",
    meetings: defaultMeetings(ymd, rules),
    meetingCount: MEETING_SHOWN, // 보이는 회의 칸 수 (가득 차면 늘릴 수 있음)
    todoCount: TODO_DEFAULT_SHOWN, // 보이는 할 일 칸 수 (늘릴 수 있음)
    todos: range(TODO_SLOTS, () => ({ text: "", done: false })),
    interviews: range(INTERVIEW_SLOTS, () => ""),
    interviewDone: range(INTERVIEW_SLOTS, () => false),
    leaderAbsent: "",
    nurseAbsent: "",
    helper: HELPER_DEFAULTS[weekdayIndex(ymd)] ?? "",
    helperDone: false,
    checks: {
      workReport: false,
      attendance: false,
      notice: false,
      overtime: false,
      narcotics: false,
    },
    narcoticsSign: "",
    recurDone: {}, // 정기 업무 완료 여부 { 업무id: true }
  };
}

// 저장된 값이 없는 날은 기본값을 보여주고, 수정하면 그때부터 저장한다.
export function getDay(days, ymd, rules = []) {
  const base = defaultDay(ymd, rules);
  const saved = days[ymd];
  if (!saved) return base;
  // 회의 칸: 제목 칸이 없던 이전 저장분 중 비어 있는 칸은 기본값(고정 회의)을 쓴다.
  const meetings = base.meetings.map((def, i) => {
    const s = saved.meetings?.[i];
    if (!s) return def;
    const isOld = !("title" in s) && !s.time && !s.place && !s.custom;
    if (isOld) return def;
    const merged = { ...def, ...s };
    // 규칙이 삭제됐다면 반복 표시만 지운다 (내용은 그대로).
    if (merged.ruleId && !rules.some((r) => r.id === merged.ruleId)) {
      delete merged.ruleId;
    }
    return merged;
  });
  return { ...base, ...saved, meetings };
}

// 저장할 때, 기본값(반복 규칙)과 같은 회의 칸은 null로 두어 규칙이 바뀌면 따라가게 한다.
export function packDay(day, ymd, rules = []) {
  const base = defaultDay(ymd, rules).meetings;
  const same = (a, b) =>
    a.time === b.time &&
    a.place === b.place &&
    a.custom === b.custom &&
    a.title === b.title &&
    !!a.important === !!b.important &&
    !!a.cancelled === !!b.cancelled &&
    (a.ruleId ?? "") === (b.ruleId ?? "");
  return {
    ...day,
    meetings: day.meetings.map((m, i) => (same(m, base[i]) ? null : m)),
  };
}

// 확인사항 칸 설정: 이름을 바꾸거나 항목을 더하고 뺄 수 있다.
export const DEFAULT_SHEET_CONFIG = {
  labels: {
    patients: "총 환자 수",
    amDepts: "지원가능 진료과 (오전)",
    pmDepts: "지원가능 진료과 (오후)",
    meetings: "회의일정",
    todos: "오늘 할 일",
    interviews: "면담",
    leaderAbsent: "팀장님 외부재",
    nurseAbsent: "운영간호사 부재",
    helper: "차주 헬퍼",
    recur: "정기 업무",
    narcotics: "마약류 사인",
  },
  checkItems: CHECK_ITEMS.map(([id, label]) => ({ id, label })),
  recurLabels: {}, // 정기 업무 이름을 고친 것 { 업무id: 이름 }
};

export function getConfig(saved) {
  return {
    labels: { ...DEFAULT_SHEET_CONFIG.labels, ...(saved?.labels ?? {}) },
    recurLabels: { ...(saved?.recurLabels ?? {}) },
    checkItems: Array.isArray(saved?.checkItems)
      ? saved.checkItems
      : DEFAULT_SHEET_CONFIG.checkItems,
  };
}
