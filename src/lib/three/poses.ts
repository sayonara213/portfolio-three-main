import { CASE_H, CASE_W } from "./keyboard-scene";
import type { Pose } from "./state";

/** Visible world size at z = 0. Poses scale with it, so they fit any viewport. */
export type View = { w: number; h: number };

/** Project i: keyboard on the left for even i (card on the right), on the right for odd i. */
export const side = (i: number) => (i % 2 === 0 ? -1 : 1);

export type PoseSet = {
  hero: (v: View) => Pose;
  stack: (v: View) => Pose;
  proj: (i: number) => (v: View) => Pose;
  footer: (v: View) => Pose;
};

export const DESKTOP: PoseSet = {
  // Hero is locked: tilted back only, big, centred and a little low.
  hero: (v) => ({ x: 0, y: -v.h * 0.125, z: 0, rx: -0.95, ry: 0, rz: 0, s: Math.min(1.25, (v.w * 0.66) / CASE_W, (v.h * 1.04) / CASE_W) }),
  stack: (v) => ({ x: v.w * 0.19, y: -v.h * 0.03, z: 0, rx: -0.62, ry: -0.3, rz: -0.26, s: Math.min(1.3, (v.w * 0.4) / CASE_W, (v.h * 0.7) / CASE_W) }),
  proj: (i) => (v) => {
    const d = side(i);
    return { x: d * v.w * 0.2, y: -v.h * 0.02, z: 0, rx: -0.6, ry: -d * 0.3, rz: d * 0.2, s: Math.min(1.25, (v.w * 0.4) / CASE_W, (v.h * 0.7) / CASE_W) };
  },
  footer: (v) => ({ x: 0, y: v.h * 0.02, z: -7, rx: -1.0, ry: 0, rz: -0.08, s: Math.min(2.1, (v.w * 1.25) / CASE_W, (v.h * 1.5) / CASE_W) }),
};

export const MOBILE: PoseSet = {
  hero: (v) => ({ x: 0, y: -v.h * 0.13, z: 0, rx: -0.85, ry: 0, rz: 0, s: (v.w * 0.97) / CASE_W }),
  // Upright 4 x 8 in the top half; the copy sits below it.
  stack: (v) => ({ x: 0, y: v.h * 0.2, z: 0, rx: -0.5, ry: 0, rz: -Math.PI / 2 + 0.14, s: Math.min((v.w * 0.8) / CASE_H, (v.h * 0.46) / CASE_W) }),
  proj: (i) => (v) => {
    const d = side(i);
    return { x: d * v.w * 0.04, y: v.h * 0.27, z: 0, rx: -0.75, ry: 0, rz: d * 0.06, s: (v.w * 0.86) / CASE_W };
  },
  footer: (v) => ({ x: 0, y: v.h * 0.04, z: -6, rx: -1.05, ry: 0, rz: -0.1, s: Math.min(1.8, (v.w * 1.3) / CASE_W) }),
};
