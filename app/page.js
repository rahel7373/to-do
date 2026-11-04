"use client";

import { useState } from "react";
import TodoView from "./components/TodoView";
import ScheduleView from "./components/schedule/ScheduleView";

const TABS = [
  { id: "week", label: "주간" },
  { id: "month", label: "월간" },
  { id: "quarter", label: "분기" },
  { id: "year", label: "연간" },
  { id: "todo", label: "할 일 목록" },
];

export default function Home() {
  const [tab, setTab] = useState("week");
  const isTodo = tab === "todo";

  const top = (
    <>
      <h1 className={isTodo ? undefined : "appTitle"}>업무 관리</h1>
      <nav className={isTodo ? "tabs" : "tabs tabsCompact"} aria-label="보기 선택">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? "tab tabActive" : "tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );

  // 일정 화면은 왼쪽 열에 제목·탭·입력 폼을 두고, 나머지 폭을 시트가 쓴다.
  if (!isTodo) {
    return (
      <main className="scheduleMain">
        <ScheduleView view={tab} onChangeView={setTab} top={top} />
      </main>
    );
  }
  return (
    <main className="container">
      {top}
      <TodoView />
    </main>
  );
}
