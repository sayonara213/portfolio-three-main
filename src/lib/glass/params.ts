export interface GlassParams {
  /** "r,g,b" */
  tint: string;
  opacity: number;
  refraction: number;
  aberration: number;
  bezel: number;
  blur: number;
  saturation: number;
  specular: number;
  radius: number;
  fallbackBlur: number;
}

const BASE: GlassParams = {
  tint: "255,255,255",
  opacity: 0.06,
  refraction: 26,
  aberration: 5,
  bezel: 14,
  blur: 1,
  saturation: 1.6,
  specular: 0.7,
  radius: 999,
  fallbackBlur: 12,
};

export const GLASS = {
  clear: BASE,
  primary: { ...BASE, tint: "243,243,244", opacity: 0.82, specular: 1 },
  dark: { ...BASE, tint: "18,18,20", opacity: 0.55, specular: 0.5 },
  popover: { ...BASE, tint: "21,21,23", opacity: 0.5, specular: 0.55, radius: 12, bezel: 12, refraction: 30, blur: 2 },
  orb: { ...BASE, opacity: 0.03, refraction: 70, aberration: 10, bezel: 40, blur: 0.5, saturation: 1.8, specular: 0.85 },
  panel: { ...BASE, tint: "21,21,23", opacity: 0.6, specular: 0.6, radius: 16, bezel: 20, refraction: 40, aberration: 6, blur: 3 },
  sheet: { ...BASE, tint: "21,21,23", opacity: 0.55, specular: 0.6, radius: 18, bezel: 26, refraction: 48, aberration: 7, blur: 3 },
} satisfies Record<string, GlassParams>;

export type GlassVariant = keyof typeof GLASS;
