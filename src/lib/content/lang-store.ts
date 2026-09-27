import { useSyncExternalStore } from "react";
import { I18N, type Lang } from "./i18n";

// The chosen language lives in localStorage. The server always renders English; the client switches after hydration.
const KEY = "ms-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null; // survives when storage is blocked

function read(): Lang {
  if (current) return current;
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in I18N) return v as Lang;
  } catch {}
  return "en";
}

export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  listeners.forEach((fn) => fn());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    read,
    () => "en",
  );
}
