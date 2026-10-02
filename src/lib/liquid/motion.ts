import type { SpringConfig } from "./spring";

export interface Scale2D {
  x: number;
  y: number;
}

export interface LiquidMotion {
  x: SpringConfig;
  y: SpringConfig;
  hover: Scale2D;
  press: Scale2D;
  labelFollow: number;
}

export const REST: Scale2D = { x: 1, y: 1 };

export const LIQUID = {
  button: {
    x: { stiffness: 420, damping: 15, mass: 1 },
    y: { stiffness: 330, damping: 12, mass: 1 },
    hover: { x: 1.06, y: 1.1 },
    press: { x: 1.12, y: 0.88 },
    labelFollow: 0.35,
  },
  subtle: {
    x: { stiffness: 500, damping: 22, mass: 1 },
    y: { stiffness: 420, damping: 19, mass: 1 },
    hover: { x: 1.05, y: 1.06 },
    press: { x: 1.08, y: 0.92 },
    labelFollow: 0.25,
  },
} satisfies Record<string, LiquidMotion>;

export interface PopoverMotion {
  x: SpringConfig;
  y: SpringConfig;
  appear: Scale2D;
  change: Scale2D;
  labelFollow: number;
}

export const POPOVER: PopoverMotion = {
  x: { stiffness: 380, damping: 16, mass: 1 },
  y: { stiffness: 300, damping: 13, mass: 1 },
  appear: { x: 0.55, y: 0.35 },
  change: { x: 1.4, y: -1.1 },
  labelFollow: 0.6,
};

export interface PresenceMotion {
  x: SpringConfig;
  y: SpringConfig;
  appear: Scale2D;
  exit: Scale2D;
  exitSpring: SpringConfig;
  /** keep in sync with CSS fades */
  exitMs: number;
  labelFollow: number;
}

export const SHEET: PresenceMotion = {
  x: { stiffness: 260, damping: 15, mass: 1 },
  y: { stiffness: 220, damping: 13, mass: 1 },
  appear: { x: 0.82, y: 0.7 },
  exit: { x: 0.9, y: 0.84 },
  exitSpring: { stiffness: 520, damping: 46, mass: 1 },
  exitMs: 220,
  labelFollow: 1,
};

export const PANEL: PresenceMotion = {
  x: { stiffness: 340, damping: 17, mass: 1 },
  y: { stiffness: 280, damping: 15, mass: 1 },
  appear: { x: 0.6, y: 0.5 },
  exit: { x: 0.85, y: 0.8 },
  exitSpring: { stiffness: 600, damping: 48, mass: 1 },
  exitMs: 200,
  labelFollow: 1,
};

export interface DragMotion {
  follow: SpringConfig;
  morph: SpringConfig;
  stretch: number;
  maxStretch: number;
  squash: number;
  grab: number;
  toss: number;
  hidden: number;
  exitMs: number;
}

export const ORB: DragMotion = {
  follow: { stiffness: 900, damping: 48, mass: 1 },
  morph: { stiffness: 300, damping: 11, mass: 1 },
  stretch: 0.00028,
  maxStretch: 0.45,
  squash: 0.6,
  grab: 1.12,
  toss: 0.12,
  hidden: 0.2,
  exitMs: 260,
};

export interface SegmentMotion {
  lead: SpringConfig;
  trail: SpringConfig;
  lift: SpringConfig;
  press: number;
  change: number;
  squash: number;
}

export const SEGMENT: SegmentMotion = {
  lead: { stiffness: 520, damping: 30, mass: 1 },
  trail: { stiffness: 240, damping: 21, mass: 1 },
  lift: { stiffness: 380, damping: 13, mass: 1 },
  press: 1.14,
  change: 2.6,
  squash: 0.35,
};
