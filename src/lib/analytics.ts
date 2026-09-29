// Google Analytics 4 via gtag.js (loaded in layout.tsx, production only). Everything the site tracks goes through `track`,
// so event names and parameters live in one place. Events fired before gtag.js has loaded are queued on `dataLayer`.

export const GA_ID = "G-L4MBD2C02T";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const live = process.env.NODE_ENV === "production";

// gtag.js only understands `Arguments` objects on the dataLayer, not arrays, hence `arguments` and the cast.
const gtag = function () {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer ||= []).push(arguments);
} as (...args: unknown[]) => void;

/** Sends a GA4 event. In development it only logs to the console, so local sessions never pollute the data. */
export function track(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (!live) return void console.debug("[track]", name, params);
  gtag("event", name, params);
}

/** Properties GA attaches to every event of the visit (audience filters: language, device, motion preference). */
export function setUserProps(props: Params) {
  if (typeof window === "undefined" || !live) return;
  gtag("set", "user_properties", props);
}

/** Reports the first time each key is seen, so noisy events (hover, typing) stay well under GA's per-session limits. */
const seen = new Set<string>();
export function trackOnce(name: string, id: string, params: Params = {}) {
  const k = `${name}:${id}`;
  if (seen.has(k)) return;
  seen.add(k);
  track(name, params);
}
