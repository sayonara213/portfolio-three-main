// The 8 x 4 keyboard. One row per category; each key is one technology from the CV.

export type Tech = {
  /** Simple Icons slug, see icons.ts */
  slug: string;
  name: string;
  /** Cap colour in the Stack state */
  color: string;
  /** One line from the CV, shown in the readout panel */
  note: string;
};

export const COLS = 8;
export const ROWS = 4;

export const TECH: Tech[][] = [
  [
    { slug: "javascript", name: "JavaScript", color: "#F7DF1E", note: "Core language across every project" },
    { slug: "typescript", name: "TypeScript", color: "#3178C6", note: "Default for frontend and backend work" },
    { slug: "html5", name: "HTML", color: "#E34F26", note: "Semantic, accessible markup" },
    { slug: "css", name: "CSS", color: "#663399", note: "Responsive layouts and motion" },
    { slug: "opengl", name: "GLSL", color: "#5586A4", note: "Custom shaders for 3D scenes" },
    { slug: "react", name: "React", color: "#61DAFB", note: "Main UI library for 4+ years" },
    { slug: "nextdotjs", name: "Next.js", color: "#F3F3F4", note: "E-commerce build with SEO and a11y focus" },
    { slug: "vuedotjs", name: "Vue.js", color: "#42B883", note: "Vue.js interfaces" },
  ],
  [
    { slug: "react", name: "React Native", color: "#087EA4", note: "iOS and Android app at Codempire" },
    { slug: "threedotjs", name: "Three.js / R3F", color: "#1A1A1D", note: "Interactive 3D frontends with React Three Fiber" },
    { slug: "webgl", name: "WebGL", color: "#990000", note: "Rendering and performance tuning" },
    { slug: "redux", name: "Redux Toolkit", color: "#764ABC", note: "Client state management" },
    { slug: "reactquery", name: "React Query", color: "#FF4154", note: "Server state and caching" },
    { slug: "blender", name: "Blender", color: "#E87D0D", note: "Scripted renders on a RunPod GPU service" },
    { slug: "ethereum", name: "Web3 / NFT", color: "#627EEA", note: "On-chain NFT data and wallet flows" },
    { slug: "awsamplify", name: "AWS Amplify", color: "#FF9900", note: "Frontend hosting and deploys" },
  ],
  [
    { slug: "nodedotjs", name: "Node.js", color: "#5FA04E", note: "APIs and services" },
    { slug: "express", name: "Express.js", color: "#3A3A40", note: "REST API design" },
    { slug: "nestjs", name: "NestJS", color: "#E0234E", note: "Backend services and CMS APIs" },
    { slug: "postgresql", name: "PostgreSQL", color: "#4169E1", note: "Relational data for e-commerce" },
    { slug: "redis", name: "Redis", color: "#FF4438", note: "Caching layer" },
    { slug: "amazonaws", name: "AWS", color: "#232F3E", note: "Payments, assets and cloud services" },
    { slug: "awslambda", name: "AWS Lambda", color: "#FF9900", note: "Serverless functions" },
    { slug: "amazons3", name: "AWS S3", color: "#569A31", note: "Asset storage and delivery" },
  ],
  [
    { slug: "docker", name: "Docker", color: "#2496ED", note: "Containerised services" },
    { slug: "git", name: "Git", color: "#F05032", note: "Version control, often via LazyGit" },
    { slug: "github", name: "GitHub", color: "#F3F3F4", note: "Code hosting and review" },
    { slug: "neovim", name: "Neovim", color: "#57A143", note: "Everyday editor" },
    { slug: "visualstudiocode", name: "VS Code", color: "#007ACC", note: "Editor" },
    { slug: "intellijidea", name: "IntelliJ IDEA", color: "#FE315D", note: "IDE" },
    { slug: "claude", name: "Claude Code", color: "#D97757", note: "Agentic development workflows" },
    { slug: "modelcontextprotocol", name: "MCP", color: "#1A1A1D", note: "Model Context Protocol tooling" },
  ],
];

/** Legends for the letter states; a space is a blank cap. */
export const HERO_ROWS = ["        ", "SOFTWARE", "ENGINEER", "        "];
export const NAME_ROWS = ["        ", " MAKSYM ", "  SAI   ", "        "];

export const TECH_FLAT = TECH.flat();
export const colorOf = (name: string) => TECH_FLAT.find((t) => t.name === name)?.color ?? "#888888";

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
/** Legend/logo colour that reads on a cap of the given colour. */
export const inkFor = (hex: string) => (luminance(hex) > 0.62 ? "#141416" : "#ffffff");
