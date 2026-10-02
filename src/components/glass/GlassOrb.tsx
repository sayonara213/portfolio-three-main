"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GLASS, type GlassParams } from "@/lib/glass/params";
import { useSvgBackdrop } from "@/lib/glass/support";
import { prefersReducedMotion } from "@/lib/liquid/liquid";
import { ORB, PANEL, type DragMotion } from "@/lib/liquid/motion";
import { createSprings } from "@/lib/liquid/spring";
import { useLiquidPresence } from "@/lib/liquid/use-liquid";
import { Glass } from "./Glass";
import { GlassTuner } from "./GlassTuner";

interface Props {
  open: boolean;
  size?: number;
  glass?: GlassParams;
  motion?: DragMotion;
  inert?: boolean;
}

const CLICK_SLOP = 5;
const PANEL_GAP = 16;
const EDGE = 12;

export function GlassOrb({ open, size: initialSize = 120, glass: initialGlass = GLASS.orb, motion = ORB, inert }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const setOpen = useRef<(open: boolean) => void>(() => {});
  const pos = useRef({ x: 0, y: 0 });
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);

  const [params, setParams] = useState(initialGlass);
  const [size, setSize] = useState(initialSize);
  const sizeRef = useRef(size);
  const [panel, setPanel] = useState(false);
  const panelOpen = panel && open && !inert;
  const panelShown = useLiquidPresence(panelRef, panelOpen, PANEL);
  const svg = useSvgBackdrop();

  // Layout effect: placed and collapsed before the first paint
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !shown) return;
    const reduced = prefersReducedMotion();
    const r = () => sizeRef.current / 2;
    let held = false, moved = false, offX = 0, offY = 0, downX = 0, downY = 0, base = reduced ? 1 : motion.hidden;

    const springs = createSprings(
      { px: motion.follow, py: motion.follow, sx: motion.morph, sy: motion.morph },
      { px: innerWidth / 2, py: innerHeight / 2, sx: base, sy: base },
      ({ px, py, sx, sy }) => {
        pos.current = { x: px, y: py };
        el.style.transform = `translate(${px - r()}px, ${py - r()}px)`;
        el.style.setProperty("--lx", sx.toFixed(4));
        el.style.setProperty("--ly", sy.toFixed(4));
        if (reduced) return;
        const ax = Math.min(Math.abs(springs.springs.px.velocity) * motion.stretch, motion.maxStretch);
        const ay = Math.min(Math.abs(springs.springs.py.velocity) * motion.stretch, motion.maxStretch);
        springs.to({ sx: base * (1 + ax - ay * motion.squash), sy: base * (1 + ay - ax * motion.squash) });
      },
    );
    springs.snap({ px: innerWidth / 2, py: innerHeight / 2 }); // paint now, not on the next frame
    const clampX = (x: number) => Math.min(Math.max(x, r()), innerWidth - r());
    const clampY = (y: number) => Math.min(Math.max(y, r()), innerHeight - r());

    setOpen.current = (on) => {
      base = on ? (held ? motion.grab : 1) : reduced ? 1 : motion.hidden;
      springs.to({ sx: base, sy: base });
    };
    setOpen.current(true);

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      el.setPointerCapture(e.pointerId);
      held = true;
      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      offX = e.clientX - springs.springs.px.value;
      offY = e.clientY - springs.springs.py.value;
      setOpen.current(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!held) return;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_SLOP) {
        moved = true;
        setPanel(false);
      }
      if (!moved) return;
      const to = { px: clampX(e.clientX - offX), py: clampY(e.clientY - offY) };
      if (reduced) springs.snap(to);
      else springs.to(to);
    };
    const onUp = () => {
      if (!held) return;
      held = false;
      if (!moved) setPanel((p) => !p);
      const { px, py } = springs.springs;
      springs.to({ px: clampX(px.target + px.velocity * motion.toss), py: clampY(py.target + py.velocity * motion.toss) });
      setOpen.current(true);
    };
    const onResize = () => springs.to({ px: clampX(springs.springs.px.target), py: clampY(springs.springs.py.target) });

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    addEventListener("resize", onResize);
    return () => {
      springs.destroy();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      removeEventListener("resize", onResize);
    };
  }, [shown, motion]);

  useLayoutEffect(() => {
    sizeRef.current = size;
    const el = ref.current;
    if (el) el.style.transform = `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px)`;
  }, [size]);

  useEffect(() => {
    setOpen.current(open);
    if (open) return;
    const t = setTimeout(() => setShown(false), motion.exitMs);
    return () => clearTimeout(t);
  }, [open, motion]);

  useLayoutEffect(() => {
    const p = panelRef.current;
    if (!panelOpen || !p) return;
    const { x, y } = pos.current, r = sizeRef.current / 2, w = p.offsetWidth, h = p.offsetHeight;
    const right = x + r + PANEL_GAP + w <= innerWidth - EDGE || x < innerWidth / 2;
    const left = right ? x + r + PANEL_GAP : x - r - PANEL_GAP - w;
    const top = Math.min(Math.max(y - h / 2, EDGE), innerHeight - h - EDGE);
    p.style.left = `${Math.min(Math.max(left, EDGE), innerWidth - w - EDGE)}px`;
    p.style.top = `${top}px`;
    p.style.transformOrigin = `${right ? 0 : 100}% ${Math.min(Math.max(y - top, 0), h)}px`;
  }, [panelOpen]);

  // Capture: runs before the page's Esc handler, which would close the orb too
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setPanel(false);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !ref.current?.contains(t)) setPanel(false);
    };
    addEventListener("keydown", onKey, true);
    addEventListener("pointerdown", onDown, true);
    return () => {
      removeEventListener("keydown", onKey, true);
      removeEventListener("pointerdown", onDown, true);
    };
  }, [panelOpen]);

  if (!shown) return null;
  return (
    <>
      <div ref={ref} id="orb" data-state={open ? "open" : "closing"} style={{ width: size, height: size }} inert={inert} aria-hidden="true">
        <Glass params={params} />
      </div>
      {panelShown && (
        <GlassTuner
          ref={panelRef}
          params={params}
          onParams={setParams}
          size={size}
          onSize={setSize}
          onReset={() => {
            setParams(initialGlass);
            setSize(initialSize);
          }}
          onClose={() => setPanel(false)}
          svg={svg}
          closing={!panelOpen}
        />
      )}
    </>
  );
}
