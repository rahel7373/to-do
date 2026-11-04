"use client";

import { useEffect, useState } from "react";

// localStorage에 값을 저장하는 훅. 브라우저에서만 읽을 수 있으므로 마운트 후에 불러온다.
// initial은 렌더링마다 바뀌지 않는 값(모듈 상수 등)을 넘긴다.
export function useLocalState(key, initial) {
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : initial;
      const sameShape =
        parsed !== null &&
        typeof parsed === "object" &&
        Array.isArray(parsed) === Array.isArray(initial);
      setValue(sameShape ? parsed : initial);
    } catch {
      setValue(initial);
    }
    setLoaded(true);
  }, [key, initial]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 공간 부족·차단 시에는 화면 상태만 유지한다.
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

const EMPTY_LIST = [];

export function useLocalList(key) {
  return useLocalState(key, EMPTY_LIST);
}
