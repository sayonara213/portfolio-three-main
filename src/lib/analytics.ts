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

export function track(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (!live) return void console.debug("[track]", name, params);
  gtag("event", name, params);
}

export function setUserProps(props: Params) {
  if (typeof window === "undefined" || !live) return;
  gtag("set", "user_properties", props);
}

const seen = new Set<string>();
export function trackOnce(name: string, id: string, params: Params = {}) {
  const k = `${name}:${id}`;
  if (seen.has(k)) return;
  seen.add(k);
  track(name, params);
}
