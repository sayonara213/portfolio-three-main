import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { KeyboardScene } from "@/lib/three/keyboard-scene";
import { DESKTOP, MOBILE } from "@/lib/three/poses";
import type { Pose } from "@/lib/three/state";

gsap.registerPlugin(ScrollTrigger);
// iOS/Android toolbars resize the viewport while scrolling; don't re-measure the whole timeline for that.
ScrollTrigger.config({ ignoreMobileResize: true });

/*
 * SCROLL TIMELINE: scrubbed; after a pause it finishes a half-done transition (see `snapTime`); pauses inside a hold never move.
 * 1 unit of time = 1 viewport of scroll (#track is 550svh). Transitions start the moment you leave a section and are short; the rest is hold.
 * The Experience carousel is NOT scroll-driven: slides change with buttons, swipe or arrow keys (Portfolio.tsx) and drive `kb.proj`.
 *   0.00        hero (locked)
 *   0.00-0.75   → stack: pose, flip wave white→brand, rim on, stack copy in
 *   0.75-1.50   hold stack
 *   1.50-2.25   → experience: keyboard to the left, unused keys grey + pressed, carousel in
 *   2.25-3.25   hold experience (carousel is interactive)
 *   3.25-4.00   → footer: board to background, second flip wave to name caps, scrim + footer copy
 *   4.00-4.50   hold footer
 */
export const SEG = {
  stack: [0, 0.75],
  exp: [1.5, 2.25],
  footer: [3.25, 4],
  end: 4.5,
} as const;

/** Resting time of each section. Scroll to label × innerHeight to land on it. */
export const LABELS = { hero: 0, stack: 1.1, experience: 2.75, footer: 4.25 } as const;

/** Transitions that finish after a pause (debounced snap). */
const TRANSITIONS: readonly (readonly [number, number])[] = [SEG.stack, SEG.exp, SEG.footer];
/** Fraction of a transition you must have crossed (in your scroll direction) for it to complete instead of revert. */
const COMPLETE_AT = 0.25;

/** Time (viewports) to settle on after a pause: unchanged inside a hold, otherwise the nearest hold edge, biased by direction. */
function snapTime(t: number, dir: number) {
  const seg = TRANSITIONS.find(([a, b]) => t > a && t < b);
  if (!seg) return t;
  const f = (t - seg[0]) / (seg[1] - seg[0]);
  const forward = dir >= 0 ? f > COMPLETE_AT : f >= 1 - COMPLETE_AT;
  return seg[forward ? 1 : 0];
}

export const BREAKPOINT = 768;

type Options = {
  scene: KeyboardScene;
  /** element that contains the panels; selectors are scoped to it */
  root: HTMLElement;
  reduced: boolean;
  onProgress: (p: number) => void;
};

/** Builds the master timeline per breakpoint. Returns the matchMedia so the caller can revert it. */
export function buildTimeline({ scene, root, reduced, onProgress }: Options) {
  const kb = scene.kb;
  const mm = gsap.matchMedia(root);
  mm.add({ desktop: `(min-width: ${BREAKPOINT}px)`, mobile: `(max-width: ${BREAKPOINT - 1}px)` }, (ctx) => {
    const P = ctx.conditions?.desktop ? DESKTOP : MOBILE;
    // Function-based values are re-read on every ScrollTrigger refresh (resize), so poses follow the viewport.
    const pose = (fn: (v: ReturnType<KeyboardScene["view"]>) => Pose) => {
      const o: Record<string, () => number> = {};
      (["x", "y", "z", "rx", "ry", "rz", "s"] as const).forEach((k) => (o[k] = () => fn(scene.view())[k]));
      return o;
    };

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root.querySelector("#track"),
        start: "top top",
        end: "bottom bottom",
        scrub: reduced ? true : 0.4,
        invalidateOnRefresh: true,
        // Debounced: after the scroll goes quiet, finish a half-done transition. Touch waits longer for momentum to end.
        snap: reduced
          ? undefined
          : {
              snapTo: (p: number, st?: ScrollTrigger) => snapTime(p * SEG.end, st?.direction ?? 1) / SEG.end,
              delay: matchMedia("(pointer: coarse)").matches ? 0.35 : 0.25,
              duration: { min: 0.4, max: 0.6 },
              ease: "power2.out",
            },
        onUpdate: (st) => onProgress(st.progress),
      },
    });
    Object.entries(LABELS).forEach(([n, t]) => tl.addLabel(n, t));

    // hero → stack
    let [a, b]: readonly number[] = SEG.stack;
    tl.fromTo(kb, pose(P.hero), { ...pose(P.stack), duration: b - a, ease: "power2.inOut" }, a)
      .fromTo(kb, { flip: 0 }, { flip: 1, duration: 0.7 }, a + 0.03)
      .fromTo(kb, { glow: 0 }, { glow: 1, duration: 0.3 }, a + 0.45)
      .fromTo(kb, { motion: 0 }, { motion: 1, duration: 0.3 }, a + 0.4)
      .to(".hero-name", { yPercent: -35, duration: 0.35 }, a)
      .to("#p-hero", { autoAlpha: 0, duration: 0.3 }, a)
      .fromTo("#p-stack", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a + 0.45)
      .fromTo(".stack-copy", { y: 40 }, { y: 0, duration: 0.3, ease: "power2.out" }, a + 0.45);

    // stack → experience
    [a, b] = SEG.exp;
    tl.to(kb, { ...pose(P.exp), duration: b - a, ease: "power2.inOut" }, a)
      .fromTo(kb, { exp: 0 }, { exp: 1, duration: 0.5 }, a + 0.1)
      .to("#p-stack", { autoAlpha: 0, duration: 0.25 }, a)
      .fromTo(".exp", { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, b - 0.3);

    // experience → footer
    [a, b] = SEG.footer;
    tl.to(kb, { ...pose(P.footer), duration: b - a, ease: "power2.inOut" }, a)
      .to(kb, { exp: 0, glow: 0.45, duration: 0.4 }, a)
      .fromTo(kb, { flip2: 0 }, { flip2: 1, duration: 0.7 }, a + 0.03)
      .to(".exp", { autoAlpha: 0, x: 40, duration: 0.2 }, a)
      .fromTo("#scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, a + 0.25)
      .fromTo("#p-footer", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a + 0.4)
      .fromTo(".footer-inner", { y: 40 }, { y: 0, duration: 0.3, ease: "power2.out" }, a + 0.4)
      .to({}, { duration: 0 }, SEG.end);

    return () => tl.kill();
  });
  return mm;
}
