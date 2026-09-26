"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Form pages get a focused, distraction-free layout: no site nav/footer,
// just a way back home.
const CHROMELESS_ROUTES = [
  "/recruitment",
  "/recruitment-closed",
  "/registrations",
];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );

  if (isChromeless) {
    return (
      <>
        <Link
          href="/"
          className="fixed left-6 top-6 z-50 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/50 bg-[#1C1C1C]/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#F5F0E8] backdrop-blur-md transition hover:bg-[#1C1C1C] hover:border-[#C9A84C]"
        >
          ← Back to Home
        </Link>
        {children}
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* Curtain-reveal footer: this wrapper sits above the footer (higher
          z-index, opaque background) and scrolls normally, so its trailing
          edge slides up and off like a curtain, progressively exposing the
          footer beneath - which stays pinned to the bottom of the viewport
          via position: sticky once it's reached. */}
      <div className="relative z-10 bg-warm">{children}</div>
      <div className="sticky bottom-0 z-0">
        <Footer useImageBackground={pathname !== "/gallery"} />
      </div>
    </>
  );
}
