"use client";

import { useEffect, useState } from "react";

// localStorage에 배열을 저장하는 훅. 브라우저에서만 읽을 수 있으므로 마운트 후에 불러온다.
export function useLocalList(key) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // 저장 공간 부족·차단 시에는 화면 상태만 유지한다.
    }
  }, [key, items, loaded]);

  return [items, setItems, loaded];
}
