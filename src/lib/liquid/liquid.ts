import { createSprings, type SpringConfig } from "./spring";
import type { Scale2D } from "./motion";

export interface LiquidController {
  to(s: Scale2D): void;
  snap(s: Scale2D): void;
  kick(v: Scale2D): void;
  configure(springs: { x: SpringConfig; y: SpringConfig }): void;
  destroy(): void;
}

const NOOP: LiquidController = { to() {}, snap() {}, kick() {}, configure() {}, destroy() {} };

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createLiquid(el: HTMLElement, springs: { x: SpringConfig; y: SpringConfig }, labelFollow: number): LiquidController {
  if (prefersReducedMotion()) return NOOP;

  el.style.setProperty("--lf", String(labelFollow));
  const group = createSprings({ x: springs.x, y: springs.y }, { x: 1, y: 1 }, ({ x, y }) => {
    el.style.setProperty("--lx", x.toFixed(4));
    el.style.setProperty("--ly", y.toFixed(4));
  });

  return {
    to: group.to,
    snap: group.snap,
    kick: group.kick,
    configure({ x, y }) {
      group.springs.x.config = x;
      group.springs.y.config = y;
    },
    destroy() {
      group.destroy();
      el.style.removeProperty("--lx");
      el.style.removeProperty("--ly");
      el.style.removeProperty("--lf");
    },
  };
}
