// Public facts about the site, shared by metadata, robots, sitemap, manifest and JSON-LD.

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL (e.g. https://maksymsai.dev) in the hosting environment;
 * Vercel's production URL is used as a fallback, and localhost otherwise.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const NAME = "Maksym Sai";
export const NAME_ALT = ["Максим Сай", "サイ マクシム"];
export const JOB_TITLE = "Fullstack developer";
export const TITLE = "Maksym Sai — Fullstack Developer Portfolio";
export const DESCRIPTION =
  "Maksym Sai, fullstack developer: interactive 3D frontends (Three.js, WebGL, React, Next.js), backend services (Node.js, NestJS) and cloud infrastructure (AWS). Explore the portfolio through a 3D keyboard.";
export const KEYWORDS = [
  "Maksym Sai", "Максим Сай", "サイ マクシム", "fullstack developer", "portfolio", "creative developer", "Three.js", "WebGL", "React", "Next.js",
  "TypeScript", "Node.js", "NestJS", "AWS", "GSAP", "3D web", "frontend developer", "backend developer",
];
export const GITHUB = "https://github.com/sayonara213";
export const LINKEDIN = "https://linkedin.com/in/maksym-sai";
