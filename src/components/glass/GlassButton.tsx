"use client";

import { useCallback, useMemo, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { GLASS, type GlassParams, type GlassVariant } from "@/lib/glass/params";
import { LIQUID, type LiquidMotion } from "@/lib/liquid/motion";
import { useLiquid } from "@/lib/liquid/use-liquid";
import { Glass } from "./Glass";

interface Common {
  variant?: GlassVariant;
  glass?: Partial<GlassParams>;
  motion?: LiquidMotion;
  children: ReactNode;
}
type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; ref?: Ref<HTMLButtonElement> };
type AnchorProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> };

export function GlassButton({ variant = "clear", glass, motion = LIQUID.button, className, style, children, ref, ...rest }: ButtonProps | AnchorProps) {
  const params = useMemo(() => ({ ...GLASS[variant], ...glass }), [variant, glass]);
  const el = useRef<HTMLElement>(null);
  useLiquid(el, motion);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      el.current = node;
      if (typeof ref === "function") ref(node as never);
      else if (ref) (ref as React.RefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  const props = {
    ref: setRef,
    className: `glass-btn glass-btn--${variant}${className ? ` ${className}` : ""}`,
    style: { borderRadius: params.radius, ...style },
  };
  const inner = (
    <>
      <Glass params={params} />
      <span className="glass-label">{children}</span>
    </>
  );

  if (typeof rest.href === "string") {
    return (
      <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} {...props}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} {...props}>
      {inner}
    </button>
  );
}
