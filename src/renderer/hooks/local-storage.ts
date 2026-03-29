import { useSyncExternalStore } from "react";

export function useLocalStorage<T>(key: string, defaultValue?: T) {
  const subscribe = (listener: () => void) => {
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  };

  let cachedRaw: string | null = undefined as unknown as string | null;
  let cachedValue: T | undefined;

  const getSnapshot = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = raw ? JSON.parse(raw) : undefined;
      }
      return cachedValue;
    } catch {
      return undefined;
    }
  };

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultValue,
  );

  const setValue = (newValue: T | undefined) => {
    if (!newValue) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(newValue));
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }
  };

  return { value, setValue } as const;
}
