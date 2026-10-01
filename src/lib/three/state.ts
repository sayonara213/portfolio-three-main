/**
 * Everything the keyboard can be. The scroll timeline tweens these numbers; the render loop reads them.
 * To add a new keyboard behaviour, add a field here, tween it in timeline.ts and read it in KeyboardScene.frame.
 */
export type KeyboardState = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
  flip: number;
  flip2: number;
  exp: number;
  proj: number;
  glow: number;
  motion: number;
  intro: number;
};

export type Pose = Pick<KeyboardState, "x" | "y" | "z" | "rx" | "ry" | "rz" | "s">;
