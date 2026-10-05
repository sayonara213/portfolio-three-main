"use client";

import { ICONS } from "@/lib/content/icons";
import type { Dict } from "@/lib/content/i18n";
import { TECH, inkFor, type Tech } from "@/lib/content/tech";
import { createStore } from "@/lib/store";

export type ActiveTech = Tech & { r: number };

// Set on every key hover: kept out of Portfolio state so a hover doesn't re-render the whole page
export const activeTech = createStore<ActiveTech | null>(null);

const Logo = ({ slug, fill }: { slug: string; fill: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill={fill} d={ICONS[slug]} />
  </svg>
);

export function StackLegend({ t }: { t: Dict }) {
  const active = activeTech.use();
  return (
    <>
      <ul className="cats">
        {t.cats.map((c, r) => (
          <li key={r} className={active?.r === r ? "is-active" : undefined}>
            <i>
              {TECH[r].slice(0, 4).map((x) => (
                <b key={x.name} style={{ "--c": x.color } as React.CSSProperties} />
              ))}
            </i>
            {c}
            <span>0{r + 1}</span>
          </li>
        ))}
      </ul>
      <div className="readout" aria-live="polite">
        {active ? (
          <>
            <span className="chip" style={{ background: active.color }}>
              <Logo slug={active.slug} fill={inkFor(active.color)} />
            </span>
            <span className="txt">
              <strong>{active.name}</strong>
              <small>{t.notes[active.name] ?? active.note}</small>
            </span>
          </>
        ) : (
          <>
            <span className="chip">?</span>
            <span className="txt">
              <strong>{t.readoutTitle}</strong>
              <small>{t.readoutSub}</small>
            </span>
          </>
        )}
      </div>
    </>
  );
}
