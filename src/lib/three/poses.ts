import { CASE_H, CASE_W } from "./keyboard-scene";
import type { Pose } from "./state";

export type View = { w: number; h: number };

export type PoseSet = {
  hero: (v: View) => Pose;
  stack: (v: View) => Pose;
  exp: (v: View) => Pose;
  footer: (v: View) => Pose;
};

export const DESKTOP: PoseSet = {
  hero: (v) => ({ x: 0, y: -v.h * 0.125, z: 0, rx: -0.95, ry: 0, rz: 0, s: Math.min(1.25, (v.w * 0.66) / CASE_W, (v.h * 1.04) / CASE_W) }),
  stack: (v) => ({ x: v.w * 0.19, y: -v.h * 0.03, z: 0, rx: -0.62, ry: -0.3, rz: -0.26, s: Math.min(1.3, (v.w * 0.4) / CASE_W, (v.h * 0.7) / CASE_W) }),
  exp: (v) => ({ x: -v.w * 0.2, y: -v.h * 0.02, z: 0, rx: -0.6, ry: 0.3, rz: -0.2, s: Math.min(1.25, (v.w * 0.4) / CASE_W, (v.h * 0.7) / CASE_W) }),
  footer: (v) => ({ x: 0, y: v.h * 0.02, z: -7, rx: -1.0, ry: 0, rz: -0.08, s: Math.min(2.1, (v.w * 1.25) / CASE_W, (v.h * 1.5) / CASE_W) }),
};

export const MOBILE: PoseSet = {
  hero: (v) => ({ x: 0, y: -v.h * 0.13, z: 0, rx: -0.85, ry: 0, rz: 0, s: (v.w * 0.97) / CASE_W }),
  stack: (v) => ({ x: 0, y: v.h * 0.2, z: 0, rx: -0.5, ry: 0, rz: -Math.PI / 2 + 0.14, s: Math.min((v.w * 0.8) / CASE_H, (v.h * 0.46) / CASE_W) }),
  exp: (v) => ({ x: 0, y: v.h * 0.29, z: 0, rx: -0.62, ry: 0, rz: 0, s: (v.w * 0.86) / CASE_W }),
  footer: (v) => ({ x: 0, y: v.h * 0.04, z: -6, rx: -1.05, ry: 0, rz: -0.1, s: Math.min(1.8, (v.w * 1.3) / CASE_W) }),
};
