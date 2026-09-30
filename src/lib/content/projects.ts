import type { Lang } from "./i18n";

// Experience section. Entries with `sample: true` are still placeholders: replace title, desc, links, tech and cover.
// `tech` names must match TECH names exactly; they decide which keys stay lit for the project.

export type Project = {
  title: string;
  desc: string;
  /** Translations of `desc`; English falls back to `desc` */
  descI18n?: Partial<Record<Lang, string>>;
  /** Live site; omit when there is no public URL (the button is hidden) */
  live?: string;
  /** Image URL. Placeholders use a generated SVG mock; real ones go in /public/projects. */
  cover?: string;
  /** Accent colours for the placeholder cover */
  accent: [string, string];
  tech: string[];
  sample?: boolean;
};

export const PROJECTS: Project[] = [
  {
    title: "Fast ForWorld",
    desc: "Lamborghini's Web3 platform: a real-time 3D car configurator, on-chain NFT collectibles and a GPU render service that turns configurations into assets.",
    descI18n: {
      uk: "Web3-платформа Lamborghini: 3D-конфігуратор авто в реальному часі, ончейн NFT-колекції та GPU-сервіс рендерингу, що перетворює конфігурації на ресурси.",
      ja: "ランボルギーニのWeb3プラットフォーム。リアルタイム3Dカーコンフィギュレーター、オンチェーンNFTコレクティブル、構成をアセットに変換するGPUレンダリングサービス。",
    },
    live: "https://fastforworld.lamborghini.com",
    cover: "/projects/fast-forworld.webp",
    accent: ["#4fb81c", "#b8b8b8"],
    tech: [
      "TypeScript",
      "React",
      "Three.js / R3F",
      "WebGL",
      "Blender",
      "Web3 / NFT",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
      "AWS S3",
    ],
  },
  {
    title: "This portfolio",
    desc: "A Three.js keyboard that types, flips and lights up my stack, choreographed with GSAP scroll timelines in Next.js.",
    descI18n: {
      uk: "Клавіатура на Three.js, яка друкує, перевертається й підсвічує мій стек; GSAP-таймлайни скролу в Next.js.",
      ja: "入力し、反転し、私のスタックを光らせるThree.js製キーボード。Next.jsでGSAPのスクロールタイムラインを使って演出しています。",
    },
    cover: "/projects/this-portfolio.webp",
    accent: ["#8c6cff", "#4fb8ff"],
    tech: [
      "HTML",
      "CSS",
      "TypeScript",
      "React",
      "Next.js",
      "Three.js / R3F",
      "WebGL",
      "GLSL",
      "Git",
      "GitHub",
      "Claude Code",
    ],
  },
  {
    title: "Girls Practice Wear",
    desc: "Made-to-order dancewear storefront: server-rendered catalogue, cart and checkout on a Node API.",
    descI18n: {
      uk: "Магазин одягу для танців на замовлення: серверний рендеринг каталогу, кошик і оформлення замовлення на Node API.",
      ja: "オーダーメイドのダンスウェアのオンラインストア。サーバーレンダリングのカタログ、カート、決済をNode APIで構築。",
    },
    live: "https://girlspracticewear.com",
    cover: "/projects/girls-practice-wear.webp",
    accent: ["#3b0a14", "#b8b8b8"],
    tech: [
      "HTML",
      "CSS",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Express.js",
      "NestJS",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
      "AWS S3",
      "Git",
    ],
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
