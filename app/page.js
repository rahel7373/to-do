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

  return (
    <main className={isTodo ? "container" : "container containerWide"}>
      <h1>업무 관리</h1>
      <nav className="tabs" aria-label="보기 선택">
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
      {isTodo ? <TodoView /> : <ScheduleView view={tab} onChangeView={setTab} />}
    </main>
  );
}
