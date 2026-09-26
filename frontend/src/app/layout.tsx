import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Inter,
  Playfair_Display,
  Geist,
  Geist_Mono,
  Poppins,
} from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const accent = Playfair_Display({
  subsets: ["latin"],
  style: "italic",
  variable: "--font-accent",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Avyakta",
  description: "Where culture comes alive",
};

import GlobalCursorFx from "@/components/shared/GlobalCursorFx";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${heading.variable} ${bodyFont.variable} ${accent.variable} ${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-warm text-charcoal font-body flex flex-col">
        <GlobalCursorFx />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
