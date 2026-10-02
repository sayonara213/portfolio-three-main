"use client";

import type { Ref } from "react";
import { GLASS, type GlassParams } from "@/lib/glass/params";
import { GlassButton } from "./GlassButton";
import { Glass } from "./Glass";

type NumericKey = { [K in keyof GlassParams]: GlassParams[K] extends number ? K : never }[keyof GlassParams];

interface Control {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  svgOnly?: boolean;
}

const CONTROLS: Control[] = [
  { key: "opacity", label: "Tint", min: 0, max: 0.6, step: 0.01 },
  { key: "refraction", label: "Refraction", min: 0, max: 140, step: 1, unit: "px", svgOnly: true },
  { key: "aberration", label: "Aberration", min: 0, max: 30, step: 0.5, unit: "px", svgOnly: true },
  { key: "bezel", label: "Edge", min: 4, max: 60, step: 1, unit: "px", svgOnly: true },
  { key: "blur", label: "Blur", min: 0, max: 10, step: 0.25, unit: "px" },
  { key: "saturation", label: "Saturation", min: 0, max: 3, step: 0.05, unit: "×" },
  { key: "specular", label: "Highlight", min: 0, max: 1, step: 0.01 },
];

export const SIZE_RANGE = { min: 60, max: 260 };

interface Props {
  params: GlassParams;
  onParams: (p: GlassParams) => void;
  size: number;
  onSize: (n: number) => void;
  onReset: () => void;
  onClose: () => void;
  svg: boolean;
  closing: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function GlassTuner({ params, onParams, size, onSize, onReset, onClose, svg, closing, ref }: Props) {
  const slider = (id: string, label: string, value: number, min: number, max: number, step: number, unit: string, set: (n: number) => void) => (
    <label className="tuner-row" key={id}>
      <span className="tuner-label">
        {label}
        <output>{`${+value.toFixed(2)}${unit}`}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--p": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        onChange={(e) => set(+e.target.value)}
      />
    </label>
  );

  return (
    <div ref={ref} className="tuner" role="dialog" aria-label="Liquid glass settings" data-state={closing ? "closing" : "open"} inert={closing}>
      <Glass params={GLASS.panel} />
      <div className="tuner-head">
        <strong className="rainbow-text">Liquid glass</strong>
        <GlassButton className="tuner-btn" onClick={onReset}>
          Reset
        </GlassButton>
        <GlassButton className="tuner-btn tuner-x" aria-label="Close settings" onClick={onClose}>
          ×
        </GlassButton>
      </div>
      {slider("size", "Size", size, SIZE_RANGE.min, SIZE_RANGE.max, 1, "px", onSize)}
      {CONTROLS.filter((c) => svg || !c.svgOnly).map((c) =>
        slider(c.key, c.label, params[c.key], c.min, c.max, c.step, c.unit ?? "", (n) => onParams({ ...params, [c.key]: n })),
      )}
      {!svg && <p className="tuner-note">Refraction and aberration render in Chromium browsers only.</p>}
      <p className="tuner-note">Drag the orb · Esc to close</p>
    </div>
  );
}
