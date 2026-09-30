import type { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Onest, Unbounded, Zen_Kaku_Gothic_New } from "next/font/google";
import Script from "next/script";
import { GA_ID } from "@/lib/analytics";
import { DESCRIPTION, GITHUB, JOB_TITLE, KEYWORDS, LINKEDIN, NAME, NAME_ALT, SITE_URL, SKILLS, TITLE } from "@/lib/site";
import "./globals.css";

// Display, body and mono faces. Zen Kaku Gothic New covers Japanese; Caveat is the dog caption.
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"] });
const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"], weight: ["400", "600"] });
const zen = Zen_Kaku_Gothic_New({ variable: "--font-zen", subsets: ["latin"], weight: ["400", "700", "900"], preload: false });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin", "cyrillic"], weight: "600", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${NAME}` },
  description: DESCRIPTION,
  applicationName: `${NAME} Portfolio`,
  keywords: KEYWORDS,
  authors: [{ name: NAME, url: SITE_URL }],
  creator: NAME,
  publisher: NAME,
  category: "technology",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${NAME} Portfolio`,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["uk_UA", "ja_JP"],
    // the image itself comes from app/opengraph-image.png
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

// Structured data: who this site is about, and the site itself.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: NAME,
      alternateName: NAME_ALT,
      jobTitle: JOB_TITLE,
      description: DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/opengraph-image.png`,
      sameAs: [GITHUB, LINKEDIN],
      knowsAbout: SKILLS.filter((s) => !/developer|portfolio/.test(s)),
      knowsLanguage: ["en", "uk", "ja"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: `${NAME} Portfolio`,
      description: DESCRIPTION,
      inLanguage: ["en", "uk", "ja"],
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profile`,
      url: SITE_URL,
      name: TITLE,
      mainEntity: { "@id": `${SITE_URL}/#person` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [unbounded, onest, jetbrains, zen, caveat].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={fonts}>
      <body className="is-loading">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </body>
      {process.env.NODE_ENV === "production" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}
    </html>
  );
}
