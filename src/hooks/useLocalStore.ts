/**
 * Typed localStorage helper — replaces the scattered get*/set* pattern in mockData.
 * Usage:
 *   const [items, setItems] = useLocalStore<MyType[]>('hrms_key', []);
 *
 * This is a simple synchronous hook (no reactive subscription needed since
 * the app is single-tab). It reads once on mount and writes imperatively.
 */
import { useState, useCallback } from "react";

export function useLocalStore<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.error(`Failed to persist ${key} to localStorage`);
      }
    },
    [key]
  );

  return [state, setValue];
}
