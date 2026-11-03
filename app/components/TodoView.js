"use client";

import TodoForm from "./TodoForm";
import TodoList from "./TodoList";
import { sortTodos } from "../lib/date";
import { useLocalList } from "../lib/useLocalList";

export default function TodoView() {
  const [todos, setTodos, loaded] = useLocalList("todos");

  function addTodo(title, dueDate) {
    const todo = {
      id: crypto.randomUUID(),
      title,
      done: false,
      dueDate,
      createdAt: Date.now(),
    };
    setTodos((prev) => [todo, ...prev]);
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <TodoForm onAdd={addTodo} />
      {loaded && (
        <TodoList
          todos={sortTodos(todos)}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      )}
    </>
  );
}
