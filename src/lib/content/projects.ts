// Experience section. These four are placeholders: replace title, desc, links, tech and cover.
// `tech` names must match TECH names exactly; they decide which keys stay lit for the project.

export type Project = {
  title: string;
  desc: string;
  live: string;
  gh?: string;
  /** Image URL. Placeholders use a generated SVG mock; real ones go in /public/projects. */
  cover?: string;
  /** Accent colours for the placeholder cover */
  accent: [string, string];
  tech: string[];
  sample?: boolean;
};

export const PROJECTS: Project[] = [
  {
    title: "Nebula Garage",
    desc: "3D car configurator with real-time paint, rims and studio lighting presets.",
    live: "https://example.com",
    gh: "https://github.com/sayonara213",
    accent: ["#ff5d6c", "#8c6cff"],
    tech: ["TypeScript", "React", "Next.js", "GLSL", "Three.js / R3F", "WebGL", "Blender", "AWS S3"],
    sample: true,
  },
  {
    title: "Chainlens",
    desc: "API and dashboard that normalises on-chain NFT data for a marketplace.",
    live: "https://example.com",
    accent: ["#627EEA", "#5ee08a"],
    tech: ["TypeScript", "React", "React Query", "Web3 / NFT", "Node.js", "NestJS", "PostgreSQL", "Redis", "AWS", "AWS Lambda"],
    sample: true,
  },
  {
    title: "Stitch & Co",
    desc: "Accessible fashion storefront with server rendering, search and checkout.",
    live: "https://example.com",
    gh: "https://github.com/sayonara213",
    accent: ["#ffa94d", "#ff6ad5"],
    tech: ["HTML", "CSS", "TypeScript", "React", "Next.js", "NestJS", "PostgreSQL", "Docker", "AWS S3"],
    sample: true,
  },
  {
    title: "Pocket CMS",
    desc: "Content dashboard with a companion iOS and Android app.",
    live: "https://example.com",
    gh: "https://github.com/sayonara213",
    accent: ["#4fb8ff", "#42B883"],
    tech: ["JavaScript", "TypeScript", "React", "React Native", "Redux Toolkit", "Node.js", "Express.js", "Git", "GitHub"],
    sample: true,
  },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Placeholder cover: a browser-window mock in the project's two accent colours. */
export function placeholderCover(p: Project, i: number) {
  const [c1, c2] = p.accent;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="640" height="400" fill="#151517"/>
  <rect x="28" y="28" width="584" height="372" rx="14" fill="url(#g)"/>
  <rect x="28" y="28" width="584" height="34" rx="14" fill="#0b0b0c" opacity=".55"/>
  <circle cx="52" cy="45" r="5" fill="#fff" opacity=".6"/><circle cx="70" cy="45" r="5" fill="#fff" opacity=".4"/><circle cx="88" cy="45" r="5" fill="#fff" opacity=".25"/>
  <text x="60" y="160" font-family="system-ui,sans-serif" font-weight="800" font-size="46" fill="#0b0b0c">${esc(p.title)}</text>
  <rect x="60" y="186" width="230" height="10" rx="5" fill="#0b0b0c" opacity=".35"/>
  <rect x="60" y="206" width="180" height="10" rx="5" fill="#0b0b0c" opacity=".25"/>
  <rect x="60" y="246" width="110" height="34" rx="17" fill="#0b0b0c" opacity=".8"/>
  <rect x="360" y="130" width="220" height="220" rx="18" fill="#fff" opacity=".18"/>
  <circle cx="470" cy="240" r="${56 + i * 8}" fill="#fff" opacity=".22"/>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
