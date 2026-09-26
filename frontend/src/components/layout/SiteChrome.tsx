"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/** Exact routes with no public header or footer at all. */
const NO_CHROME_ROUTES = ["/auth/login"];

/**
 * Route trees that are part of the admin system: the public navbar is fixed
 * and styled for the dark public hero, so it overlaps these pages and its
 * links are unreadable on light backgrounds. They carry their own header.
 */
const NO_CHROME_PREFIXES = ["/dashboard", "/domain"];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideChrome =
    NO_CHROME_ROUTES.includes(pathname) ||
    NO_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && <Footer />}
    </>
  );
}
