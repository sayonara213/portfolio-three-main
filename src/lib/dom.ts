type Handlers<M> = { [K in keyof M]?: (e: M[K]) => void };

/** Adds several listeners at once; returns one cleanup that removes them all. */
export function listen<M = HTMLElementEventMap>(target: EventTarget, handlers: Handlers<NoInfer<M>>, options?: boolean | AddEventListenerOptions) {
  const entries = Object.entries(handlers) as [string, EventListener][];
  entries.forEach(([type, fn]) => target.addEventListener(type, fn, options));
  return () => entries.forEach(([type, fn]) => target.removeEventListener(type, fn, options));
}
