import type { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Onest, Unbounded, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// Display, body and mono faces. Zen Kaku Gothic New covers Japanese; Caveat is the dog caption.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"] });
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"], weight: ["400", "600"] });
const zen = Zen_Kaku_Gothic_New({ variable: "--font-zen", subsets: ["latin"], weight: ["400", "700", "900"], preload: false });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin", "cyrillic"], weight: "600", preload: false });

export const metadata: Metadata = {
  title: "Maksym Sai Portfolio",
  description: "Maksym Sai, fullstack developer: interactive 3D frontends, backend services and cloud infrastructure.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [unbounded, onest, jetbrains, zen, caveat].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={fonts}>
      <body className="is-loading">{children}</body>
    </html>
  );
}
