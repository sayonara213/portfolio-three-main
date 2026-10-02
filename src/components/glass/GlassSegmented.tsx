"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { GLASS, type GlassParams } from "@/lib/glass/params";
import { prefersReducedMotion } from "@/lib/liquid/liquid";
import { SEGMENT, type SegmentMotion } from "@/lib/liquid/motion";
import { createSprings, type SpringGroup } from "@/lib/liquid/spring";
import { Glass } from "./Glass";

export interface SegmentOption<T extends string> {
  id: T;
  label: ReactNode;
  lang?: string;
}

interface Props<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  "aria-label"?: string;
  className?: string;
  track?: GlassParams;
  blob?: GlassParams;
  motion?: SegmentMotion;
}

export function GlassSegmented<T extends string>({ options, value, onChange, className, track = GLASS.clear, blob = GLASS.primary, motion = SEGMENT, ...aria }: Props<T>) {
  const root = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLSpanElement>(null);
  const place = useRef<(animate: boolean) => void>(() => {});
  const valueRef = useRef(value);

  useEffect(() => {
    const el = root.current!, b = blobRef.current!;
    const reduced = prefersReducedMotion();
    let width = 0;

    // l / r: blob edges in px; s: size
    const springs: SpringGroup<"l" | "r" | "s"> = createSprings({ l: motion.lead, r: motion.trail, s: motion.lift }, { l: 0, r: 0, s: 1 }, ({ l, r, s }) => {
      if (!width) return;
      const stretch = (r - l) / width;
      b.style.transform = `translateX(${(l + r) / 2 - width / 2}px)`;
      b.style.setProperty("--lx", (stretch * s).toFixed(4));
      b.style.setProperty("--ly", ((1 - (stretch - 1) * motion.squash) * s).toFixed(4));
    });

    place.current = (animate) => {
      const btn = el.querySelector<HTMLElement>(`[data-seg="${CSS.escape(valueRef.current)}"]`);
      if (!btn) return;
      const l = btn.offsetLeft, r = l + btn.offsetWidth;
      // Blob keeps the target width so its glass map is built once; springs scale it in between
      width = r - l;
      b.style.width = `${width}px`;
      if (!animate || reduced) return springs.snap({ l, r });
      const right = l > springs.springs.l.value;
      springs.springs.l.config = right ? motion.trail : motion.lead;
      springs.springs.r.config = right ? motion.lead : motion.trail;
      springs.to({ l, r });
      springs.kick({ s: motion.change });
    };
    place.current(false);

    const ro = new ResizeObserver(() => place.current(false));
    ro.observe(el);

    const press = (on: boolean) => () => !reduced && springs.to({ s: on ? motion.press : 1 });
    const down = press(true), up = press(false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
    return () => {
      ro.disconnect();
      springs.destroy();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [motion]);

  useEffect(() => {
    if (valueRef.current === value) return;
    valueRef.current = value;
    place.current(true);
  }, [value]);

  return (
    <div ref={root} className={`seg${className ? ` ${className}` : ""}`} role="group" {...aria}>
      <Glass params={track} />
      <span ref={blobRef} className="seg-blob" aria-hidden="true">
        <Glass params={blob} />
      </span>
      {options.map((o) => (
        <button type="button" key={o.id} data-seg={o.id} lang={o.lang} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
