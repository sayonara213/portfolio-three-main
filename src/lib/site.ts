// Public facts about the site, shared by metadata, robots, sitemap, manifest and JSON-LD.

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL (e.g. https://maksymsai.dev) in the hosting environment;
 * Vercel's production URL is used as a fallback, and localhost otherwise.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const NAME = "Max Sai";
export const NAME_ALT = ["Maksym Sai", "Макс Сай", "Максим Сай", "サイ マックス", "サイ マクシム"];
export const JOB_TITLE = "Fullstack developer";
export const TITLE = "Max Sai - Fullstack Developer Portfolio";
export const DESCRIPTION =
  "Max Sai, fullstack developer: interactive 3D frontends (Three.js, WebGL, React, Next.js), backend services (Node.js, NestJS) and cloud infrastructure (AWS). Explore the portfolio through a 3D keyboard.";
export const SKILLS = [
  "fullstack developer",
  "portfolio",
  "creative developer",
  "Three.js",
  "WebGL",
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "NestJS",
  "AWS",
  "GSAP",
  "3D web",
  "frontend developer",
  "backend developer",
];
export const KEYWORDS = [NAME, ...NAME_ALT, ...SKILLS];
export const GITHUB = "https://github.com/sayonara213";
export const LINKEDIN = "https://linkedin.com/in/maksym-sai";
