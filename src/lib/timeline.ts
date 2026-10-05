import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { KeyboardScene } from "@/lib/three/keyboard-scene";
import { DESKTOP, MOBILE } from "@/lib/three/poses";
import type { Pose } from "@/lib/three/state";

gsap.registerPlugin(ScrollTrigger);
// iOS/Android toolbars resize the viewport while scrolling; don't re-measure the whole timeline for that.
ScrollTrigger.config({ ignoreMobileResize: true });

// Not scrubbed: scroll only picks a section, which plays its transition, so the page never rests between states.
// The carousel isn't scroll-driven either: Portfolio.tsx drives `kb.proj`.
export const SECTIONS = ["hero", "stack", "experience", "footer"] as const;
export type Section = (typeof SECTIONS)[number];

const STEP = 0.75;
const LABELS: Record<Section, number> = { hero: 0, stack: STEP, experience: STEP * 2, footer: STEP * 3 };

// In viewports scrolled; must match #track (550svh = 4.5 viewports of scroll)
export const SCROLL_LENGTH = 4.5;
const STARTS: Record<Section, number> = { hero: 0, stack: 0.5, experience: 1.85, footer: 3.2 };

const SECONDS_PER_STEP = 1.1;
const CUT = { out: 0.15, in: 0.3, land: 0.5, landSeconds: 0.75 };
const DRIFT_FOLLOW = 0.35;
const CUT_TARGETS = "#gl, main";

export const BREAKPOINT = 768;

export function locate(progress: number): { section: Section; local: number } {
  const v = progress * SCROLL_LENGTH;
  let i = SECTIONS.length - 1;
  while (i > 0 && v < STARTS[SECTIONS[i]]) i--;
  const start = STARTS[SECTIONS[i]], end = i < SECTIONS.length - 1 ? STARTS[SECTIONS[i + 1]] : SCROLL_LENGTH;
  return { section: SECTIONS[i], local: Math.min(Math.max((v - start) / (end - start), 0), 1) };
}

type Options = {
  scene: KeyboardScene;
  root: HTMLElement;
  reduced: boolean;
  onProgress: (p: number) => void;
  onSection: (s: Section) => void;
};

export function buildTimeline({ scene, root, reduced, onProgress, onSection }: Options) {
  const kb = scene.kb;
  let section: Section = "hero";
  const mm = gsap.matchMedia(root);
  mm.add({ desktop: `(min-width: ${BREAKPOINT}px)`, mobile: `(max-width: ${BREAKPOINT - 1}px)` }, (ctx) => {
    const P = ctx.conditions?.desktop ? DESKTOP : MOBILE;
    // Function-based values are re-read when the timeline is invalidated (resize), so poses follow the viewport.
    const pose = (fn: (v: ReturnType<KeyboardScene["view"]>) => Pose) => {
      const o: Record<string, () => number> = {};
      (["x", "y", "z", "rx", "ry", "rz", "s"] as const).forEach((k) => (o[k] = () => fn(scene.view())[k]));
      return o;
    };

    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    Object.entries(LABELS).forEach(([n, t]) => tl.addLabel(n, t));

    let a = LABELS.hero;
    tl.fromTo(kb, pose(P.hero), { ...pose(P.stack), duration: STEP, ease: "power2.inOut" }, a)
      .fromTo(kb, { flip: 0 }, { flip: 1, duration: 0.7 }, a + 0.03)
      .fromTo(kb, { glow: 0 }, { glow: 1, duration: 0.3 }, a + 0.45)
      .fromTo(kb, { motion: 0 }, { motion: 1, duration: 0.3 }, a + 0.4)
      .to(".hero-name", { yPercent: -35, duration: 0.35 }, a)
      .to("#p-hero", { autoAlpha: 0, duration: 0.3 }, a)
      .fromTo("#p-stack", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a + 0.45)
      .fromTo(".stack-copy", { y: 40 }, { y: 0, duration: 0.3, ease: "power2.out" }, a + 0.45);

    a = LABELS.stack;
    tl.to(kb, { ...pose(P.exp), duration: STEP, ease: "power2.inOut" }, a)
      .fromTo(kb, { exp: 0 }, { exp: 1, duration: 0.5 }, a + 0.1)
      .to("#p-stack", { autoAlpha: 0, duration: 0.25 }, a)
      .fromTo(".exp", { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, a + STEP - 0.3);

    a = LABELS.experience;
    tl.to(kb, { ...pose(P.footer), duration: STEP, ease: "power2.inOut" }, a)
      .to(kb, { exp: 0, glow: 0.45, duration: 0.4 }, a)
      .fromTo(kb, { flip2: 0 }, { flip2: 1, duration: 0.7 }, a + 0.03)
      .to(".exp", { autoAlpha: 0, x: 40, duration: 0.2 }, a)
      .fromTo("#scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, a + 0.25)
      .fromTo("#p-footer", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a + 0.4)
      .fromTo(".footer-inner", { y: 40 }, { y: 0, duration: 0.3, ease: "power2.out" }, a + 0.4);

    // matchMedia rebuilds on breakpoint change: land on the current section without animating
    tl.progress(1).progress(0).seek(LABELS[section]);

    let tween: gsap.core.Tween | null = null;
    let cut: gsap.core.Timeline | null = null;

    // Hand drift off on the transition's clock and ease (poses are power2.inOut), blending toward the live scroll
    // position, or the board visibly drops before / moves after the transition.
    let local = 0, handoff = false;
    let driftTween: gsap.core.Tween | null = null;
    // One retargeted tween, not a new one per scroll event
    const followTo = gsap.quickTo(scene, "drift", { duration: DRIFT_FOLLOW, ease: "power2.out" });
    const follow = () => {
      handoff = false;
      driftTween?.kill();
      followTo(local, scene.drift);
    };
    const handOff = (duration: number) => {
      handoff = true;
      driftTween?.kill();
      followTo.tween.pause();
      const from = scene.drift, blend = { k: 0 };
      driftTween = gsap.to(blend, {
        k: 1,
        duration,
        ease: "power2.inOut",
        onUpdate: () => void (scene.drift = from + (local - from) * blend.k),
        onComplete: () => void (handoff = false),
      });
    };
    const stop = () => {
      tween?.kill();
      if (cut) {
        cut.kill();
        cut = null;
        gsap.to(CUT_TARGETS, { opacity: 1, duration: CUT.in, overwrite: true });
      }
    };
    const play = (to: Section) => {
      stop();
      const target = LABELS[to];
      const steps = Math.abs(target - tl.time()) / STEP;
      if (reduced || !steps) {
        tl.seek(target);
        follow();
        return;
      }
      if (steps < 1.5) {
        const duration = steps * SECONDS_PER_STEP;
        tween = tl.tweenTo(target, { duration, ease: "none" });
        handOff(duration);
        return;
      }
      const landFrom = target - Math.sign(target - tl.time()) * STEP * CUT.land;
      cut = gsap
        .timeline({
          onComplete: () => {
            cut = null;
            follow(); // scroll is ignored during the fade-in
          },
        })
        .to(CUT_TARGETS, { opacity: 0, duration: CUT.out, ease: "power1.in", overwrite: true })
        .add(() => {
          tl.seek(landFrom);
          tween = tl.tweenTo(target, { duration: CUT.landSeconds, ease: "power1.out" });
          driftTween?.kill();
          followTo.tween.pause();
          scene.drift = local;
          handoff = false;
        })
        .to(CUT_TARGETS, { opacity: 1, duration: CUT.in, ease: "power1.out" });
    };

    const st = ScrollTrigger.create({
      trigger: root.querySelector("#track"),
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const where = locate(self.progress);
        const next = where.section;
        local = where.local;
        onProgress(self.progress);
        if (next === section) {
          if (!handoff && !cut) follow();
          return;
        }
        section = next;
        onSection(next);
        play(next);
      },
    });

    // Seek to 0 before invalidating so `to` tweens re-record their start values in order, not from the current state.
    const onRefresh = () => {
      const t = tween?.isActive() || cut ? LABELS[section] : tl.time();
      stop();
      tl.seek(0).invalidate().progress(1).progress(0).seek(t);
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      stop();
      driftTween?.kill();
      followTo.tween.kill();
      st.kill();
      tl.kill();
    };
  });
  return mm;
}
