import { useEffect, useState } from "react";

/** True while `open`, and for `exitMs` after it turns false so an exit animation can play before unmounting. */
export function usePresence(open: boolean, exitMs: number): boolean {
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setShown(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  return shown;
}
