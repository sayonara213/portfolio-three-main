/**
 * Everything the keyboard can be. The scroll timeline tweens these numbers; the render loop reads them.
 * To add a new keyboard behaviour, add a field here, tween it in timeline.ts and read it in KeyboardScene.frame.
 */
export type KeyboardState = {
  /** board position in world units (z < 0 pushes it into the background) */
  x: number;
  y: number;
  z: number;
  /** board rotation in radians */
  rx: number;
  ry: number;
  rz: number;
  /** board scale */
  s: number;
  /** 0 → 1: first flip wave, hero letters → tech logos, white → brand colours */
  flip: number;
  /** 0 → 1: second flip wave, tech logos → name letters (footer) */
  flip2: number;
  /** 0 → 1: Experience mode, unused techs grey and sink */
  exp: number;
  /** current project slide, fractional while the carousel moves; driven by the carousel, not by scroll */
  proj: number;
  /** RGB rim strength */
  glow: number;
  /** 0 → 1: idle float and pointer parallax. 0 in the hero, which is locked */
  motion: number;
  /** splash intro zoom, animates 0 → 1 (board scales 0.82 → 1) */
  intro: number;
};

export type Pose = Pick<KeyboardState, "x" | "y" | "z" | "rx" | "ry" | "rz" | "s">;
