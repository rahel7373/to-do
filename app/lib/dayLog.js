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

// 차주 헬퍼 칸의 요일별 기본 문구 (월요일 = 0)
const HELPER_DEFAULTS = { 1: "차주헬퍼 장부 작성", 2: "차주헬퍼 공유/수정" };

export function defaultDay(ymd) {
  return {
    patients: "",
    amDepts: "",
    pmDepts: "",
    meetings: range(MEETING_SLOTS, () => ({ time: "", place: "", custom: "" })),
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
  return { ...defaultDay(ymd), ...days[ymd] };
}
