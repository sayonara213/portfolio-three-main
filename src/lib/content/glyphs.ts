import { ICONS } from "./icons";

export type HeroAction = "lang" | "linkedin" | "github" | "contact" | "dog";

export const HERO_ACTIONS: Partial<Record<number, HeroAction>> = { 0: "linkedin", 1: "github", 2: "contact", 7: "dog", 24: "lang" };

export type Glyph = {
  stroke?: string;
  fill?: string;
  scale?: number;
};

export const GLYPHS: Record<HeroAction, Glyph> = {
  lang: {
    stroke: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3zM3 12h18M4.4 7.5h15.2M4.4 16.5h15.2",
  },
  linkedin: {
    stroke: "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zM8 11v6M12 17v-6M12 13.8c0-1.8 1.1-2.9 2.5-2.9s2.4 1 2.4 2.8V17",
    fill: "M8 7.1a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z",
  },
  github: { fill: ICONS.github, scale: 0.82 },
  contact: {
    stroke: "M5.8 5.5h12.4A2.8 2.8 0 0 1 21 8.3v7.4a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 15.7V8.3a2.8 2.8 0 0 1 2.8-2.8zM4 7.2l8 5.8 8-5.8",
  },
  dog: {
    stroke:
      "M8.3 8.6C8.3 6.4 10 5 12 5s3.7 1.4 3.7 3.6v5.6c0 2.8-1.7 4.8-3.7 4.8s-3.7-2-3.7-4.8z" +
      "M9.4 5.5C7.3 4.8 4.9 5.6 4.3 8.2l-.8 4c-.4 2 .9 3.3 2.4 2.8 1.1-.4 1.9-1.6 2.3-3" +
      "M14.6 5.5c2.1-.7 4.5.1 5.1 2.7l.8 4c.4 2-.9 3.3-2.4 2.8-1.1-.4-1.9-1.6-2.3-3" +
      "M12 16.2v.9M10.8 17.4c.5.4.9.4 1.2 0 .3.4.7.4 1.2 0",
    fill: "M10.4 10a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2zM13.6 10a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2zM12 14.05c.75 0 1.3.38 1.3.85s-.55.85-1.3.85-1.3-.38-1.3-.85.55-.85 1.3-.85z",
  },
};
