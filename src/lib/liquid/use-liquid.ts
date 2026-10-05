import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { listen } from "@/lib/dom";
import { usePresence } from "@/lib/use-presence";
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

    const leave = () => set(false, false);
    const up = () => set(hover, false);
    const unlisten = listen(el, {
      // Touch has no hover: it would stick after the tap
      pointerenter: (e) => e.pointerType !== "touch" && set(true, press),
      pointerleave: leave,
      pointerdown: (e) => e.isPrimary && set(hover, true),
      pointerup: up,
      pointercancel: leave,
      keydown: (e) => !e.repeat && (e.key === "Enter" || e.key === " ") && set(hover, true),
      keyup: up,
      blur: up,
    });
    return () => {
      liquid.destroy();
      unlisten();
    };
  }, [ref, motion]);
}

export function useLiquidPresence(ref: RefObject<HTMLElement | null>, open: boolean, motion: PresenceMotion): boolean {
  const shown = usePresence(open, motion.exitMs);
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
  }, [open, motion]);

  return shown;
}
