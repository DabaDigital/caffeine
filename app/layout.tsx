import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia"],
});
const sans = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/manrope/files/manrope-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2",
      weight: "800",
    },
  ],
  variable: "--font-interface",
  display: "swap",
  fallback: ["Arial"],
});
const script = localFont({
  src: "../node_modules/@fontsource/allura/files/allura-latin-400-normal.woff2",
  variable: "--font-script",
  display: "swap",
  preload: false,
});
const condensed = localFont({
  src: "../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2",
  variable: "--font-condensed",
  weight: "700",
  display: "swap",
  fallback: ["Impact", "Arial Narrow", "sans-serif"],
});
const technical = localFont({
  src: "../node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2",
  variable: "--font-technical",
  weight: "400",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

// Set the real public origin at deployment; never invent a business domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://localhost:3000"),
  ...(siteUrl
    ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } }
    : {}),
  title: "Caffeine | Coffee, Crêpes & Sweet Moments",
  description:
    "Your daily escape in Maarif. Discover Caffeine Coffee & Tea House, specialty coffee, fresh crêpes and sweet moments in Casablanca.",
  openGraph: {
    title: "Caffeine | Coffee, Crêpes & Sweet Moments",
    description:
      "Good coffee. Fresh crêpes. A little moment for yourself. Meet us at Caffeine Maarif.",
    siteName: "Caffeine",
    type: "website",
    locale: "en_US",
    ...(siteUrl
      ? {
          url: "/",
          images: [
            {
              url: "/assets/hero-caffeine.webp",
              width: 1672,
              height: 941,
              alt: "Coffee and a Lotus crêpe at Caffeine",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Caffeine | Sweet Moments",
    description: "Coffee. Crêpes. Good vibes. Discover Caffeine Maarif.",
    ...(siteUrl ? { images: ["/assets/hero-caffeine.webp"] } : {}),
  },
};
export const viewport: Viewport = { themeColor: "#28201c" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${script.variable} ${condensed.variable} ${technical.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
