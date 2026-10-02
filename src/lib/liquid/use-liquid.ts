import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createLiquid, type LiquidController } from "./liquid";
import { REST, type LiquidMotion, type PresenceMotion } from "./motion";

export function useLiquid(ref: RefObject<HTMLElement | null>, motion: LiquidMotion) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const liquid = createLiquid(el, motion, motion.labelFollow);
    let hover = false, press = false;

    const set = (h: boolean, p: boolean) => {
      if (h === hover && p === press) return;
      hover = h;
      press = p;
      liquid.to(press ? motion.press : hover ? motion.hover : REST);
    };

    // Touch has no hover: it would stick after the tap
    const onEnter = (e: PointerEvent) => e.pointerType !== "touch" && set(true, press);
    const onLeave = () => set(false, false);
    const onDown = (e: PointerEvent) => e.isPrimary && set(hover, true);
    const onUp = () => set(hover, false);
    const onKeyDown = (e: KeyboardEvent) => !e.repeat && (e.key === "Enter" || e.key === " ") && set(hover, true);
    const listeners = [
      ["pointerenter", onEnter],
      ["pointerleave", onLeave],
      ["pointerdown", onDown],
      ["pointerup", onUp],
      ["pointercancel", onLeave],
      ["keydown", onKeyDown],
      ["keyup", onUp],
      ["blur", onUp],
    ] as const;
    listeners.forEach(([type, fn]) => el.addEventListener(type, fn as EventListener));
    return () => {
      liquid.destroy();
      listeners.forEach(([type, fn]) => el.removeEventListener(type, fn as EventListener));
    };
  }, [ref, motion]);
}

export function useLiquidPresence(ref: RefObject<HTMLElement | null>, open: boolean, motion: PresenceMotion): boolean {
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  const liquid = useRef<LiquidController | null>(null);

  // Layout effect: collapse before the first frame paints, so it never flashes at full size
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !shown) return;
    const l = createLiquid(el, motion, motion.labelFollow);
    liquid.current = l;
    l.snap(motion.appear);
    l.to(REST);
    return () => {
      l.destroy();
      liquid.current = null;
    };
  }, [ref, shown, motion]);

  useEffect(() => {
    const l = liquid.current;
    if (!l) return;
    if (open) {
      l.configure(motion);
      l.to(REST);
      return;
    }
    l.configure({ x: motion.exitSpring, y: motion.exitSpring });
    l.to(motion.exit);
    const t = setTimeout(() => setShown(false), motion.exitMs);
    return () => clearTimeout(t);
  }, [open, motion]);

  return shown;
}
