"use client";

import { useEffect, useState } from "react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import { loadTodos, saveTodos } from "./lib/storage";

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // localStorage는 브라우저에서만 읽을 수 있으므로 마운트 후에 불러온다.
  useEffect(() => {
    setTodos(loadTodos());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTodos(todos);
  }, [todos, loaded]);

  function addTodo(title) {
    const todo = {
      id: crypto.randomUUID(),
      title,
      done: false,
      dueDate: null,
      createdAt: Date.now(),
    };
    setTodos((prev) => [todo, ...prev]);
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="container">
      <h1>할 일 관리</h1>
      <TodoForm onAdd={addTodo} />
      {loaded && <TodoList todos={todos} onDelete={deleteTodo} />}
    </main>
  );
}
