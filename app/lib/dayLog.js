import { weekdayIndex } from "./date";

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
];

// 날짜 머리글에 크리스마스처럼 표시하는 수동 표시 (key, 라벨, 기본 문구)
export const MARK_KINDS = [
  ["leave", "휴가", "휴가"],
  ["training", "외부 교육", "외부 교육"],
  ["off", "기타 휴무", ""],
];

export const MEETING_SLOTS = 4;
export const TODO_SLOTS = 8;
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
});

// 요일별로 미리 들어가는 회의 (월요일 = 0). 값은 수정할 수 있다.
const FIXED_MEETINGS = {
  0: [
    [0, { time: "10:00", place: "팀장님방", title: "외래간호파트 업무회의" }],
    [3, { time: "09:00", title: "zumma댄스" }],
  ],
  2: [[3, { time: "09:00", title: "zumma댄스" }]],
  3: [[0, { time: "10:00", place: "팀장님방", title: "외래간호파트 업무회의" }]],
  4: [[3, { time: "09:00", title: "zumma댄스" }]],
};

function defaultMeetings(ymd) {
  const meetings = range(MEETING_SLOTS, emptyMeeting);
  for (const [slot, fixed] of FIXED_MEETINGS[weekdayIndex(ymd)] ?? []) {
    meetings[slot] = { ...meetings[slot], ...fixed };
  }
  return meetings;
}

// 차주 헬퍼 칸의 요일별 기본 문구 (월요일 = 0)
const HELPER_DEFAULTS = { 1: "차주헬퍼 장부 작성", 2: "차주헬퍼 공유/수정" };

export function defaultDay(ymd) {
  return {
    mark: null, // { kind: "leave" | "training" | "off", text }
    patients: "",
    amDepts: "",
    pmDepts: "",
    meetings: defaultMeetings(ymd),
    todos: range(TODO_SLOTS, () => ({ text: "", done: false })),
    interviews: range(INTERVIEW_SLOTS, () => ""),
    leaderAbsent: "",
    nurseAbsent: "",
    helper: HELPER_DEFAULTS[weekdayIndex(ymd)] ?? "",
    checks: {
      workReport: false,
      attendance: false,
      notice: false,
      overtime: false,
      narcotics: false,
    },
    narcoticsSign: "",
  };
}

// 저장된 값이 없는 날은 기본값을 보여주고, 수정하면 그때부터 저장한다.
export function getDay(days, ymd) {
  const base = defaultDay(ymd);
  const saved = days[ymd];
  if (!saved) return base;
  // 회의 칸: 제목 칸이 없던 이전 저장분 중 비어 있는 칸은 기본값(고정 회의)을 쓴다.
  const meetings = base.meetings.map((def, i) => {
    const s = saved.meetings?.[i];
    if (!s) return def;
    const isOld = !("title" in s) && !s.time && !s.place && !s.custom;
    return isOld ? def : { ...def, ...s };
  });
  return { ...base, ...saved, meetings };
}
