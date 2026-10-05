"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { getDisplacementMap } from "@/lib/glass/displacement-map";
import { useSvgBackdrop } from "@/lib/glass/support";
import type { GlassParams } from "@/lib/glass/params";

// Isolate one channel, keeping alpha.
const CHANNEL = {
  r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
};

export const Glass = memo(function Glass({ params }: { params: GlassParams }) {
  const ref = useRef<HTMLSpanElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useSvgBackdrop();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // offsetWidth/Height ignore transforms, so the spring squish never rebuilds the map
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth, h = el.offsetHeight;
      setSize((s) => (s?.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = size?.w ?? 0, h = size?.h ?? 0;
  const radius = Math.min(params.radius, w / 2, h / 2);
  const { refraction, aberration, blur, saturation, bezel } = params;
  const map = useMemo(() => (svg && w && h ? getDisplacementMap(w, h, radius, bezel) : null), [svg, w, h, radius, bezel]);

  // Chrome caches url() backdrop filters, so give each config its own id to force a refresh.
  const filterId = useMemo(
    () => map && `glass-${uid}-${hash([map.key, refraction, aberration, blur, saturation].join("|"))}`,
    [map, uid, refraction, aberration, blur, saturation],
  );
  const backdrop = filterId ? `url(#${filterId})` : `blur(${params.fallbackBlur}px) saturate(${saturation})`;

  const style = {
    backdropFilter: backdrop,
    WebkitBackdropFilter: backdrop,
    "--tint": params.tint,
    "--tint-a": params.opacity,
    "--specular": params.specular,
  } as React.CSSProperties;

  return (
    <>
      <span ref={ref} className="glass" style={style} aria-hidden="true" />
      {map && (
        <svg className="glass-defs" aria-hidden="true">
          <filter id={filterId!} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred" />
            <feImage href={map.url} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="map" />
            {aberration ? (
              <>
                <feDisplacementMap in="blurred" in2="map" scale={refraction + aberration} xChannelSelector="R" yChannelSelector="G" result="dispR" />
                <feColorMatrix in="dispR" type="matrix" values={CHANNEL.r} result="r" />
                <feDisplacementMap in="blurred" in2="map" scale={refraction} xChannelSelector="R" yChannelSelector="G" result="dispG" />
                <feColorMatrix in="dispG" type="matrix" values={CHANNEL.g} result="g" />
                <feDisplacementMap in="blurred" in2="map" scale={refraction - aberration} xChannelSelector="R" yChannelSelector="G" result="dispB" />
                <feColorMatrix in="dispB" type="matrix" values={CHANNEL.b} result="b" />
                <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
                <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" result="rgb" />
              </>
            ) : (
              // No channel split: one displacement pass instead of three
              <feDisplacementMap in="blurred" in2="map" scale={refraction} xChannelSelector="R" yChannelSelector="G" result="rgb" />
            )}
            <feColorMatrix in="rgb" type="saturate" values={String(saturation)} />
          </filter>
        </svg>
      )}
    </>
  );
});

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
