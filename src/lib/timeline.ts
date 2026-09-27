import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { KeyboardScene } from "@/lib/three/keyboard-scene";
import { DESKTOP, MOBILE } from "@/lib/three/poses";
import type { Pose } from "@/lib/three/state";

gsap.registerPlugin(ScrollTrigger);

/*
 * SCROLL TIMELINE: scrubbed, no snapping. 1 unit of time = 1 viewport of scroll (#track is 800svh).
 * Transitions start the moment you leave a section and are short; the rest is hold.
 *   0.00        hero (locked)
 *   0.00-0.75   → stack: pose, flip wave white→brand, rim on, stack copy in
 *   0.75-1.50   hold stack
 *   1.50-2.25   → project 1: pose, unused keys grey + pressed, card in
 *   2.75-3.25   → project 2   (hold between)
 *   3.75-4.25   → project 3
 *   4.75-5.25   → project 4
 *   5.75-6.50   → footer: board to background, second flip wave to name caps, scrim + footer copy
 *   6.50-7.00   hold footer
 */
export const SEG = {
  stack: [0, 0.75],
  exp: [1.5, 2.25],
  proj: [[2.75, 3.25], [3.75, 4.25], [4.75, 5.25]],
  footer: [5.75, 6.5],
  end: 7,
} as const;

/** Resting time of each section. Scroll to label × innerHeight to land on it. */
export const LABELS = { hero: 0, stack: 1.1, "project-1": 2.5, "project-2": 3.5, "project-3": 4.5, "project-4": 5.5, footer: 6.75 } as const;

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
    const cards = gsap.utils.toArray<HTMLElement>(".project", root);
    const dx = (i: number) => (cards[i].dataset.side === "left" ? -1 : 1) * 40;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root.querySelector("#track"),
        start: "top top",
        end: "bottom bottom",
        scrub: reduced ? true : 0.8,
        invalidateOnRefresh: true,
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

    // stack → project 1
    [a, b] = SEG.exp;
    tl.to(kb, { ...pose(P.proj(0)), duration: b - a, ease: "power2.inOut" }, a)
      .fromTo(kb, { exp: 0, proj: 0 }, { exp: 1, duration: 0.5 }, a + 0.1)
      .to("#p-stack", { autoAlpha: 0, duration: 0.25 }, a)
      .fromTo(cards[0], { autoAlpha: 0, x: dx(0) }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, b - 0.3);

    // project i-1 → project i
    SEG.proj.forEach(([a, b], n) => {
      const i = n + 1;
      tl.to(kb, { ...pose(P.proj(i)), duration: b - a, ease: "power2.inOut" }, a)
        .to(kb, { proj: i, duration: b - a, ease: "power1.inOut" }, a)
        .to(cards[i - 1], { autoAlpha: 0, x: dx(i - 1), duration: 0.2 }, a)
        .fromTo(cards[i], { autoAlpha: 0, x: dx(i) }, { autoAlpha: 1, x: 0, duration: 0.25, ease: "power2.out" }, b - 0.25);
    });

    // last project → footer
    [a, b] = SEG.footer;
    tl.to(kb, { ...pose(P.footer), duration: b - a, ease: "power2.inOut" }, a)
      .to(kb, { exp: 0, glow: 0.45, duration: 0.4 }, a)
      .fromTo(kb, { flip2: 0 }, { flip2: 1, duration: 0.7 }, a + 0.03)
      .to(cards[cards.length - 1], { autoAlpha: 0, x: dx(cards.length - 1), duration: 0.2 }, a)
      .fromTo("#scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, a + 0.25)
      .fromTo("#p-footer", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a + 0.4)
      .fromTo(".footer-inner", { y: 40 }, { y: 0, duration: 0.3, ease: "power2.out" }, a + 0.4)
      .to({}, { duration: 0 }, SEG.end);

    return () => tl.kill();
  });
  return mm;
}
