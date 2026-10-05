import { useSyncExternalStore } from "react";

export interface Store<T> {
  get(): T;
  set(v: T): void;
  use(): T;
}

/** Module-level state that only re-renders the components reading it. */
export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  };
  const get = () => value;
  return {
    get,
    set(v) {
      if (Object.is(v, value)) return;
      value = v;
      listeners.forEach((fn) => fn());
    },
    use: () => useSyncExternalStore(subscribe, get, () => initial),
  };
}
