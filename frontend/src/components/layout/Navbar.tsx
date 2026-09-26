"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/members", label: "Team" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ticking = useRef(false);

  // The bar no longer hides on the way down - it condenses instead, so the
  // crest and wordmark stay on screen the whole time. A hysteresis gap
  // (shrink past 70, expand again under 30) keeps it from flickering when
  // you hover right on the threshold.
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((current) => (current ? y > 30 : y > 70));
        ticking.current = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on route change. This has to be an effect keyed on
  // pathname - as a bare render-phase check it re-ran on every render, so
  // opening the menu immediately closed it again and it could never stay
  // open at all.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll only for the full-width mobile menu. On desktop the
  // same button opens a small dropdown, and freezing the page there would
  // be jarring (and would strand the bar in its condensed state).
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    document.body.style.overflow = mobileOpen && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const useImageBackground = pathname !== "/gallery";

  return (
    <nav
      className={[
        "fixed left-0 right-0 top-0 z-50 flex flex-col items-center",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] px-4",
        scrolled ? "pt-2 md:pt-3" : "pt-4 md:pt-6",
      ].join(" ")}
    >
      {/* Floating pill. On scroll it condenses: narrower, shorter, links
          folded away behind the menu button, and the wordmark glides over
          to the right-hand end. */}
      <div
        className={[
          "w-full flex items-center rounded-full border",
          "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "max-w-xl h-[58px] px-3 md:px-4 gap-2 border-[#C9A84C]/30 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "max-w-5xl h-[80px] px-6 md:px-10 gap-4 border-[#C9A84C]/20 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md",
          useImageBackground
            ? ""
            : scrolled
              ? "bg-[#1C1C1C]/92"
              : "bg-[#1C1C1C]/78",
        ].join(" ")}
        style={
          useImageBackground
            ? {
                backgroundImage: `linear-gradient(rgba(28,28,28,${scrolled ? 0.75 : 0.6}), rgba(28,28,28,${scrolled ? 0.88 : 0.75})), url(/images/recruitment/recruit-bg-4.png)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {/* Crest - deliberately larger than the pill and pulled up/left so
            it pokes out past the pill's own edge. It shrinks with the bar
            but keeps that overhang. */}
        <Link href="/" className="flex items-center no-underline shrink-0">
          <div
            className={[
              "shrink-0 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]",
              "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled
                ? "-ml-2 -mt-1 h-[66px] w-[66px] md:-ml-6 md:h-[74px] md:w-[74px]"
                : "-ml-6 -mt-1 h-[92px] w-[92px] md:-ml-14 md:h-[108px] md:w-[108px]",
            ].join(" ")}
          >
            <Image
              src="/logo-crest.png"
              alt="Avyakta Logo"
              width={108}
              height={108}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </Link>

        {/* Two flexible spacers straddle the wordmark. Handing the growth
            from the right spacer to the left one slides the wordmark from
            beside the crest over to the right end - flex-grow is a plain
            animatable number, so the move tweens instead of snapping. */}
        <div
          className="transition-[flex-grow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ flexGrow: scrolled ? 1 : 0 }}
          aria-hidden
        />

        <Link
          href="/"
          className="hidden shrink-0 flex-col leading-none no-underline sm:flex"
        >
          <span
            className={[
              "font-heading text-[#C9A84C] tracking-[3px]",
              "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled ? "text-base" : "text-2xl",
            ].join(" ")}
          >
            Avyakta
          </span>
          <span
            className={[
              "font-body uppercase text-[#C9A84C]/50",
              "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled
                ? "mt-0.5 text-[7px] tracking-[2px]"
                : "mt-1 text-[11px] tracking-[3px]",
            ].join(" ")}
          >
            PESU EC · Celebration Club
          </span>
        </Link>

        <div
          className="transition-[flex-grow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ flexGrow: scrolled ? 0 : 1 }}
          aria-hidden
        />

        {/* Desktop links fold away as the bar condenses. */}
        <ul
          className={[
            "hidden md:flex items-center list-none m-0 p-0 overflow-hidden",
            "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled
              ? "max-w-0 gap-0 opacity-0 pointer-events-none"
              : "max-w-[640px] gap-8 opacity-100",
          ].join(" ")}
        >
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "font-body text-[14px] tracking-[2px] uppercase transition-colors duration-300",
                  "relative no-underline whitespace-nowrap",
                  "after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-px after:bg-[#C9A84C]",
                  "after:transition-transform after:duration-300 after:origin-left",
                  pathname === href
                    ? "text-[#C9A84C] after:scale-x-100"
                    : "text-[#F5F0E8]/70 hover:text-[#C9A84C] after:scale-x-0 hover:after:scale-x-100",
                ].join(" ")}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Menu button. Always the way in on mobile; on desktop it takes
            over once the links have folded away, so navigation is never
            left unreachable. */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className={[
            "flex flex-col items-center justify-center gap-[5px] rounded-full border border-[#C9A84C]/30 bg-[#1C1C1C]/40 transition-colors hover:bg-[#C9A84C]/10 shrink-0 ml-2",
            "w-9 h-9",
            scrolled ? "" : "md:hidden",
          ].join(" ")}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className={[
              "block h-[2px] w-4 bg-[#C9A84C] rounded-full transition-all duration-300 origin-center",
              mobileOpen ? "translate-y-[7px] rotate-45" : "",
            ].join(" ")}
          />
          <span
            className={[
              "block h-[2px] w-4 bg-[#C9A84C] rounded-full transition-all duration-300",
              mobileOpen ? "opacity-0 scale-x-0" : "opacity-100",
            ].join(" ")}
          />
          <span
            className={[
              "block h-[2px] w-4 bg-[#C9A84C] rounded-full transition-all duration-300 origin-center",
              mobileOpen ? "-translate-y-[7px] -rotate-45" : "",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Dropdown panel for the menu button - on mobile always, and on
          desktop too once the links have folded into that button. */}
      <div
        className={[
          "w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled ? "max-w-xl" : "max-w-5xl md:hidden",
          "mt-2 rounded-3xl border border-[#C9A84C]/20 bg-[#1C1C1C]/95 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl",
          mobileOpen
            ? "max-h-[420px] opacity-100"
            : "max-h-0 border-transparent opacity-0",
        ].join(" ")}
      >
        <ul className="flex flex-col py-4 px-4 gap-1 list-none m-0">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "block py-3 px-4 rounded-xl font-body text-[13px] tracking-[2.5px] uppercase transition-all duration-200 no-underline",
                  pathname === href
                    ? "text-[#C9A84C] bg-[#C9A84C]/10"
                    : "text-[#F5F0E8]/70 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5",
                ].join(" ")}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
