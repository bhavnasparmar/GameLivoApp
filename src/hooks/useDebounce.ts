import { useRef, useEffect, useState } from 'react';

// ─── useDebounce Hook ─────────────────────────────────────────────────────────

export const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedCallback = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 300,
): T => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return ((...args: unknown[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }) as T;
};
