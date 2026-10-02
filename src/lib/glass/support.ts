import { useSyncExternalStore } from "react";

interface NavigatorUAData {
  brands?: { brand: string }[];
}

let cached: boolean | undefined;

// `backdrop-filter: url(#svg)` only renders in Chromium; others accept it silently, so CSS.supports() can't tell.
export function supportsSvgBackdrop(): boolean {
  if (cached === undefined) {
    const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
    cached = !!uaData?.brands?.some((b) => b.brand === "Chromium");
  }
  return cached;
}

const noSubscribe = () => () => {};

// false during SSR and hydration
export function useSvgBackdrop(): boolean {
  return useSyncExternalStore(noSubscribe, supportsSvgBackdrop, () => false);
}
