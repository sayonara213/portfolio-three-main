import { useSyncExternalStore } from "react";
import { I18N, type Lang } from "./i18n";

// The server always renders English; the client switches after hydration, while the splash is still up.
const KEY = "ms-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null; // survives when storage is blocked

function read(): Lang {
  if (current) return current;
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in I18N) return v as Lang;
  } catch {}
  return detect();
}

function detect(): Lang {
  for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const l = tag?.toLowerCase().split("-")[0];
    if (l && l in I18N) return l as Lang;
  }
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
