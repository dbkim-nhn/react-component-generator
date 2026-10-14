import { useState, useEffect } from 'react';

// revive는 저장된 JSON을 검증/복원한다. 형식이 맞지 않으면 에러를 던지고, 그 경우 초기값을 쓴다.
// localStorage 접근 실패(비공개 모드, 용량 초과 등)는 무시하고 메모리 상태로만 동작한다.
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  revive?: (parsed: unknown) => T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;
      const parsed: unknown = JSON.parse(raw);
      return revive ? revive(parsed) : (parsed as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 상태 동작에 영향을 주지 않는다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
