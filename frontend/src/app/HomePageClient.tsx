"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

type HomeEventCard = {
  id: string;
  slug: string;
  name: string;
  date: string;
  description: string;
  venue?: string;
  highlights: string[];
};

type HomeGalleryEvent = {
  id: string;
  name: string;
  year: string;
  coverUrl: string | null;
  imageCount: number;
};

type HomePageClientProps = {
  initialEvents: HomeEventCard[];
  galleryEvents: HomeGalleryEvent[];
  isRecruitmentOpen: boolean;
};

const domains = [
  {
    name: "Event Management",
    detail: "Thematic ideation, structure, and execution",
    icon: "🎪",
  },
  {
    name: "Finance and Ethics",
    detail: "Budgets, sponsorships, fair practice, and club wellbeing",
    icon: "💰",
  },
  {
    name: "Logistics",
    detail: "Venues, materials, setup, and event-day coordination",
    icon: "📦",
  },
  {
    name: "Operations",
    detail: "Planning, schedules, team flow, and smooth execution",
    icon: "⚙️",
  },
  {
    name: "Media & Visibility",
    detail: "Photography, reels, and digital narrative",
    icon: "📸",
  },
  { name: "Marketing", detail: "Engagement, promotion, and outreach", icon: "📣" },
  {
    name: "Tech & Systems",
    detail: "Digital workflows, forms, and archives",
    icon: "💻",
  },
  {
    name: "Design",
    detail: "Posters, visual identity, and branding",
    icon: "🎨",
  },
];

const storiesParticles = [
  { left: "8%", top: "18%", delay: 0.1, duration: 8.2 },
  { left: "24%", top: "70%", delay: 0.8, duration: 7.4 },
  { left: "42%", top: "30%", delay: 1.2, duration: 8.8 },
  { left: "64%", top: "62%", delay: 0.5, duration: 7.9 },
  { left: "80%", top: "24%", delay: 1.6, duration: 8.6 },
  { left: "90%", top: "74%", delay: 0.3, duration: 7.6 },
];

// Rangoli-inspired SVG section divider
function RangoliDivider({ color = "#C9A84C" }: { color?: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div
        className="h-px flex-1"
        style={{ background: `linear-gradient(to right, transparent, ${color}60)` }}
      />
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden className="shrink-0">
        <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="0.8" opacity="0.5" />
        <circle cx="18" cy="18" r="7" stroke={color} strokeWidth="0.8" opacity="0.5" />
        <circle cx="18" cy="18" r="3" fill={color} opacity="0.7" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle
            key={a}
            cx={18 + 11 * Math.cos((a * Math.PI) / 180)}
            cy={18 + 11 * Math.sin((a * Math.PI) / 180)}
            r="1.5"
            fill={color}
            opacity="0.4"
          />
        ))}
      </svg>
      <div
        className="h-px flex-1"
        style={{ background: `linear-gradient(to left, transparent, ${color}60)` }}
      />
    </div>
  );
}

function EventStoriesSection({ events, galleryEvents }: { events: HomeEventCard[]; galleryEvents: HomeGalleryEvent[] }) {
  const eventsRef = useRef<HTMLDivElement | null>(null);
  const [activeEvent, setActiveEvent] = useState(0);

  useEffect(() => {
    const node = eventsRef.current;
    if (!node) return;
    const update = () => {
      const slides = Array.from(node.querySelectorAll<HTMLElement>("[data-event-slide]"));
      const nodeRect = node.getBoundingClientRect();
      const center = nodeRect.left + node.clientWidth / 2;
      const closest = slides.reduce((best, slide, index) => {
        const distance = Math.abs(slide.getBoundingClientRect().left + slide.offsetWidth / 2 - center);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      setActiveEvent(closest.index);
    };
    node.addEventListener("scroll", update, { passive: true });
    return () => node.removeEventListener("scroll", update);
  }, [events.length]);

  function scrollToSlide(node: HTMLDivElement | null, index: number, selector: string) {
    const slide = node?.querySelectorAll<HTMLElement>(selector)[index];
    if (node && slide) {
      const left = node.scrollLeft + slide.getBoundingClientRect().left - node.getBoundingClientRect().left;
      node.scrollTo({ left, behavior: "smooth" });
    }
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[#1A0A06] px-5 py-20 text-[#FFF7E8] md:px-10 md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, #C9A84C 0 1px, transparent 2px), radial-gradient(circle at 80% 70%, #8B1A1A 0 2px, transparent 3px)", backgroundSize: "38px 38px, 61px 61px" }} />
        <div className="relative mx-auto max-w-6xl">
          <RangoliDivider />
          <div className="mt-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F4C766]">✦ Campus celebrations ✦</p>
            <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">One club. Many ways to celebrate.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">Real Avyakta events, made together on campus. Swipe, scroll, or tap a marker to explore each story.</p>
          </div>

          <div ref={eventsRef} className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5 [scrollbar-color:#C9A84C_transparent]">
            {events.map((event, index) => {
              const cover = galleryEvents.find((item) => item.id === event.id)?.coverUrl;
              return (
                <article key={event.id} data-event-slide className="grid h-[690px] w-[min(88vw,960px)] flex-none snap-center grid-rows-[280px_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-[#D5B466]/60 bg-[#FFF9ED] text-[#24150E] shadow-[0_22px_60px_rgba(0,0,0,0.4)] md:h-[470px] md:grid-cols-[1.05fr_0.95fr] md:grid-rows-1">
                  <Link href={`/events/${event.slug}`} aria-label={`See details for ${event.name}`} className="group relative flex min-h-0 items-center justify-center overflow-hidden bg-[#2B1610]">
                    {cover ? <img src={cover} alt={`${event.name} event`} className="h-full w-full object-contain p-3 transition duration-500 group-hover:opacity-90 md:p-5" loading={index === 0 ? "eager" : "lazy"} /> : <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(201,168,76,.45),transparent_25%),linear-gradient(145deg,#8B1A1A,#2B1610_55%,#1B5E3B)]"><span className="font-serif text-8xl text-[#F4C766]/70">✦</span></div>}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#170A07]/75 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 rounded-full border border-white/40 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">Avyakta · {event.date}</span>
                  </Link>
                  <div className="flex min-h-0 flex-col justify-center overflow-hidden p-5 md:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B1A1A]">A campus celebration</p>
                    <h3 className="mt-3 line-clamp-2 font-serif text-3xl font-bold leading-tight text-[#24150E] md:text-4xl">{event.name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#24150E]/75">{event.description}</p>
                    {event.highlights.length > 0 && <ul className="mt-3 flex max-h-14 flex-wrap gap-2 overflow-hidden">{event.highlights.slice(0, 3).map((highlight) => <li key={highlight} className="line-clamp-1 rounded-full border border-[#C9A84C]/45 bg-[#F5EDD8] px-3 py-1 text-xs font-medium">{highlight}</li>)}</ul>}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#C9A84C]/35 pt-3 text-xs font-semibold uppercase tracking-wider text-[#6E5940]">
                      <span>◷ {event.date}</span>{event.venue && <span>⌖ {event.venue}</span>}
                    </div>
                    <Link href={`/events/${event.slug}`} className="mt-4 inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#8B1A1A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#641313]">Explore event <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              );
            })}
            <div data-event-slide className="flex h-[690px] w-[min(78vw,380px)] flex-none snap-center flex-col items-center justify-center rounded-[28px] border border-dashed border-[#F4C766]/60 bg-[#2B1610]/80 px-8 text-center md:h-[470px]">
              <span className="text-5xl" aria-hidden="true">🪔</span><p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#F4C766]">The next story is in the making</p><h3 className="mt-3 font-serif text-3xl font-bold">More coming soon</h3><p className="mt-3 text-sm leading-6 text-white/70">We’re planning the next campus celebration. Check back for the next date.</p><Link href="/events" className="mt-6 rounded-full border border-[#F4C766]/60 px-5 py-2.5 text-sm font-semibold text-[#FFF7E8] hover:bg-white/10">All events →</Link>
            </div>
          </div>
          {events.length > 0 && <div className="mt-3 flex items-center justify-center gap-2" aria-label="Choose an event card">{Array.from({ length: events.length + 1 }, (_, index) => <button key={index} type="button" onClick={() => scrollToSlide(eventsRef.current, index, "[data-event-slide]")} aria-label={index === events.length ? "More events coming soon" : `Show event ${index + 1}`} className={`h-2.5 rounded-full transition-all ${activeEvent === index ? "w-8 bg-[#F4C766]" : "w-2.5 bg-white/35 hover:bg-white/70"}`} />)}</div>}
        </div>
      </section>

      <section className="overflow-hidden bg-[#F5EDD8] px-5 py-20 text-[#24150E] md:px-10 md:py-24">
        <div className="mx-auto max-w-6xl">
          <RangoliDivider color="#1B5E3B" />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#1B5E3B]">✦ The Avyakta album ✦</p><h2 className="mt-3 font-serif text-4xl font-bold text-[#24150E] md:text-5xl">Moments worth keeping.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#24150E]/70">Each album begins with a favourite frame. Open a celebration to see the photographs collected so far.</p></div>
            <Link href="/gallery" className="rounded-full border border-[#1B5E3B]/50 px-5 py-2.5 text-sm font-bold text-[#1B5E3B] transition hover:bg-[#1B5E3B] hover:text-white">Browse all albums →</Link>
          </div>
          <div className="mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5 [scrollbar-color:#1B5E3B_transparent]">
            {galleryEvents.map((event, index) => <Link key={event.id} href={`/gallery#event-${event.id}`} className="group relative h-[360px] w-[min(82vw,420px)] flex-none snap-start overflow-hidden rounded-[28px] border-2 border-[#C9A84C]/55 bg-[#1A0A06] shadow-[0_18px_45px_rgba(36,21,14,.2)]">{event.coverUrl ? <img src={event.coverUrl} alt={`${event.name} album cover`} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading={index === 0 ? "eager" : "lazy"} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(201,168,76,.48),transparent_26%),linear-gradient(145deg,#8B1A1A,#2B1610_58%,#1B5E3B)]" />}<div className="absolute inset-0 bg-gradient-to-t from-[#140906] via-[#140906]/25 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F4C766]">{event.year} · {event.imageCount} {event.imageCount === 1 ? "photo" : "photos"}</p><h3 className="mt-2 font-serif text-3xl font-bold">{event.name}</h3><p className="mt-3 inline-flex rounded-full border border-white/40 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur">{event.imageCount ? "Open album →" : "Photos coming soon"}</p></div></Link>)}
            <div className="flex h-[360px] w-[min(74vw,340px)] flex-none snap-start flex-col items-center justify-center rounded-[28px] border border-dashed border-[#92791B]/60 bg-[#FFF9ED] px-8 text-center"><span className="text-4xl" aria-hidden="true">🌼</span><p className="mt-4 text-xs font-bold uppercase tracking-[.22em] text-[#8B1A1A]">More memories soon</p><h3 className="mt-2 font-serif text-2xl font-bold">The album is growing</h3><p className="mt-3 text-sm leading-6 text-[#24150E]/70">New photographs will appear here after each celebration.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePageClient({
  initialEvents,
  galleryEvents,
  isRecruitmentOpen,
}: HomePageClientProps) {
  const [events] = useState<HomeEventCard[]>(initialEvents);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const recruitmentHref = isRecruitmentOpen ? "/recruitment" : "/recruitment-closed";
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94]);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnnouncement(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 34 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { delayChildren: 0.08, staggerChildren: 0.16 },
    },
  };

  const revealItem = {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const sectionTransition = {
    duration: 0.9,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <main
      className="overflow-x-hidden text-[#1C1C1C]"
      style={{
        background:
          "linear-gradient(160deg, #c4bba5 0%, #d1ccbd 25%, #cac4b1 55%, #d4d0c5 80%, #d4c9ad 100%)",
      }}
    >
      <motion.div
        className="fixed left-0 right-0 top-0 z-[80] h-1 origin-left bg-[linear-gradient(90deg,#8B1A1A,#C9A84C,#1B5E3B)]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative flex min-h-[95vh] items-center justify-center overflow-hidden px-6 py-24">
        {/* Deep background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, #1A0A06 0%, #2B1610 30%, #0F1A0A 60%, #1C1C1C 100%)",
          }}
          aria-hidden
        />

        {/* Saffron/turmeric glow blobs */}
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, rgba(201,168,76,0.38) 0, transparent 40%), radial-gradient(circle at 85% 18%, rgba(139,26,26,0.28) 0, transparent 42%), radial-gradient(circle at 50% 85%, rgba(27,94,59,0.22) 0, transparent 45%)",
          }}
          aria-hidden
        />

        {/* Fine paisley overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='paisley' patternUnits='userSpaceOnUse' width='200' height='200'%3E%3Cpath d='M100,50 Q130,80 115,110 Q130,140 100,160 Q70,140 85,110 Q70,80 100,50 Z' fill='%23C9A84C'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23paisley)'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />

        {/* Spinning mandala */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <svg width="700" height="700" viewBox="0 0 220 220" className="animate-spin-slow" aria-hidden>
            {[98, 80, 62, 44, 28].map((r, i) => (
              <circle key={r} cx="110" cy="110" r={r} stroke="#C9A84C" fill="none" strokeWidth={i === 0 ? "0.8" : "0.5"} strokeDasharray={i % 2 === 1 ? "2 4" : undefined} />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line key={angle} x1="110" y1="12" x2="110" y2="208" stroke="#C9A84C" strokeWidth="0.4" transform={`rotate(${angle} 110 110)`} />
            ))}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
              <circle key={`petal-${a}`} cx={110 + 80 * Math.cos((a * Math.PI) / 180)} cy={110 + 80 * Math.sin((a * Math.PI) / 180)} r="3" fill="#C9A84C" opacity="0.5" />
            ))}
          </svg>
        </div>

        {/* Floating diya glow orbs */}
        <motion.div
          className="pointer-events-none absolute -left-14 top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.35) 0%, transparent 70%)" }}
          animate={{ y: [0, -24, 0], x: [0, 18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-10 bottom-20 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(27,94,59,0.3) 0%, transparent 70%)" }}
          animate={{ y: [0, 26, 0], x: [0, -16, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,26,26,0.25) 0%, transparent 70%)" }}
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Top + bottom gold trim lines */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-8 border-b border-[#C9A84C]/40 bg-[linear-gradient(90deg,rgba(201,168,76,0.1)_0,rgba(245,240,232,0.15)_50%,rgba(201,168,76,0.1)_100%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 border-t border-[#C9A84C]/40 bg-[linear-gradient(90deg,rgba(201,168,76,0.1)_0,rgba(245,240,232,0.15)_50%,rgba(201,168,76,0.1)_100%)]" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-4xl rounded-[2rem] border-2 border-[#C9A84C]/50 bg-[#1C1C1C]/80 px-6 py-10 text-center text-white shadow-[0_0_0_8px_rgba(201,168,76,0.12),0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-md md:px-12 md:py-14"
          style={{
            y: heroY,
            scale: heroScale,
          }}
        >
          {/* Corner ornaments */}
          {(["tl","tr","bl","br"] as const).map((pos) => (
            <span
              key={pos}
              className="pointer-events-none absolute h-8 w-8"
              style={{
                top: pos.includes("t") ? 12 : "auto",
                bottom: pos.includes("b") ? 12 : "auto",
                left: pos.includes("l") ? 12 : "auto",
                right: pos.includes("r") ? 12 : "auto",
                borderTop: pos.includes("t") ? "2px solid rgba(201,168,76,0.7)" : undefined,
                borderBottom: pos.includes("b") ? "2px solid rgba(201,168,76,0.7)" : undefined,
                borderLeft: pos.includes("l") ? "2px solid rgba(201,168,76,0.7)" : undefined,
                borderRight: pos.includes("r") ? "2px solid rgba(201,168,76,0.7)" : undefined,
                borderRadius: pos === "tl" ? "8px 0 0 0" : pos === "tr" ? "0 8px 0 0" : pos === "bl" ? "0 0 0 8px" : "0 0 8px 0",
              }}
              aria-hidden
            />
          ))}

          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-[#C9A84C]">
            ✦ The Living Traditions ✦
          </p>
          <h1 className="font-serif text-5xl leading-none text-[#C9A84C] md:text-8xl drop-shadow-[0_0_30px_rgba(201,168,76,0.5)]">
            Avyakta
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#C9A84C]/60">
            अव्यक्त
          </p>
          <p className="mt-6 text-lg italic text-[#F5F0E8] md:text-2xl">
            Where culture breathes through creativity
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-[#F5F0E8]/80 md:text-base">
            A cultural multi-domain collective where performance, craft, design,
            and technology converge to produce unforgettable campus experiences.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/about"
              className="inline-block rounded-full border border-[#92791B] bg-[#92791B] px-8 py-3 font-semibold text-[#F5F0E8] transition hover:scale-[1.03] hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
            >
              Know More
            </Link>
            <Link
              href={recruitmentHref}
              className="inline-block rounded-full border border-[#C9A84C]/50 px-8 py-3 text-[#F5F0E8] transition hover:scale-[1.03] hover:bg-[#C9A84C]/15"
            >
              Join Avyakta
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ TICKER ═══════════════ */}
      <section className="border-y-2 border-[#C9A84C]/50 bg-[#1C1C1C] py-3 text-[#F5F0E8]">
        <motion.div
          className="flex w-max items-center gap-10 pr-10 text-sm uppercase tracking-[0.2em]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-10">
              <span className="text-[#C9A84C]">🪔</span>
              <span>Tradition</span>
              <span className="text-[#C9A84C]">◈</span>
              <span>Performance</span>
              <span className="text-[#C9A84C]">✦</span>
              <span>Community</span>
              <span className="text-[#C9A84C]">◈</span>
              <span>Craft</span>
              <span className="text-[#C9A84C]">✦</span>
              <span>Expression</span>
              <span className="text-[#C9A84C]">🎭</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════ ANNOUNCEMENT ═══════════════ */}
      {showAnnouncement && isRecruitmentOpen && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-50 w-[92%] rounded-2xl border-2 border-[#C9A84C]/60 bg-[#1B5E3B] p-4 text-white shadow-2xl sm:w-[380px]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#C9A84C]">🪔 Announcement</p>
          <h3 className="mt-1 text-lg font-semibold">Recruitments Open</h3>
          <p className="mt-1 text-sm text-white/85">
            Applications are live for all domains this semester.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Link href="/recruitment" className="rounded-md bg-[#C9A84C] px-3 py-2 text-sm font-bold text-[#1C1C1C]">
              Apply Now
            </Link>
            <button
              type="button"
              aria-label="Close announcement"
              onClick={() => setShowAnnouncement(false)}
              className="rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section className="px-6 py-24 md:px-16">
        <RangoliDivider />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          transition={sectionTransition}
          className="mx-auto mt-8 max-w-5xl rounded-[2rem] border-2 border-[#C9A84C]/50 px-6 py-12 text-center shadow-[0_20px_60px_rgba(40,22,6,0.18)] md:px-10"
          style={{
            background: "radial-gradient(circle, rgba(226, 221, 211, 0.92) 10%, rgba(197, 186, 160, 0.97) 100%)",
          }}

        >
          {/* Rangoli corner accents */}
          <div className="pointer-events-none absolute -left-2 -top-2 h-12 w-12 rounded-tl-[2rem] border-l-4 border-t-4 border-[#C9A84C]/60" />
          <div className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 rounded-tr-[2rem] border-r-4 border-t-4 border-[#C9A84C]/60" />

          <p className="text-xs uppercase tracking-[0.28em] text-[#737955]">✦ About Section ✦</p>
          <h2 className="mb-4 mt-3 font-serif text-3xl text-[#92791B] md:text-4xl">
            About Avyakta
          </h2>
          <p className="mx-auto max-w-3xl leading-8 text-[#1C1C1C]/85">
            Founded in 2026, Avyakta is a cultural collective that blends
            tradition with modern creativity. It creates spaces for expression,
            collaboration, and immersive cultural experiences — rooted in the
            living traditions of India.
          </p>
          <motion.div
            className="mt-8 grid gap-4 text-left md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.3 }}
          >
            {[
              { title: "🎭 Perform", body: "Dance, music, theatre, and stage expression across classical and folk traditions.", color: "#8B1A1A" },
              { title: "🎨 Create", body: "Design, visuals, and storytelling inspired by India's visual heritage.", color: "#1B5E3B" },
              { title: "⚡ Lead", body: "Plan, manage, and deliver cultural experiences that leave a mark.", color: "#92791B" },
            ].map(({ title, body, color }) => (
              <motion.article
                key={title}
                variants={revealItem}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-2xl border p-5 shadow-sm"
                style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}08 0%, rgba(255,249,239,0.9) 100%)` }}
              >
                <h3 className="font-semibold" style={{ color }}>{title}</h3>
                <p className="mt-2 text-sm text-[#1C1C1C]/80">{body}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ EVENTS ═══════════════ */}
      <EventStoriesSection events={events} galleryEvents={galleryEvents} />

      {/* ═══════════════ DOMAINS ═══════════════ */}
      <section
        className="px-6 py-24 md:px-16"
        style={{
          background: "linear-gradient(160deg, #1A0A06 0%, #2B1610 40%, #0F1A0A 100%)",
        }}
      >
        <RangoliDivider />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          transition={sectionTransition}
          className="mx-auto mt-8 max-w-6xl"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/70">✦ Domains Section ✦</p>
          <h2 className="mb-10 mt-3 font-serif text-3xl text-[#F5F0E8] md:text-4xl">
            Explore Our Domains
          </h2>
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.25 }}
          >
            {domains.map((domain) => (
              <motion.div
                key={domain.name}
                variants={revealItem}
                whileHover={{ y: -8, scale: 1.03 }}
              >
                <Link
                  href={recruitmentHref}
                  className="block rounded-2xl border-2 border-[#C9A84C]/30 p-5 text-center transition hover:border-[#C9A84C]/70 hover:shadow-[0_12px_30px_rgba(201,168,76,0.2)]"
                  style={{ background: "linear-gradient(135deg, rgba(40,28,12,0.9) 0%, rgba(28,28,28,0.95) 100%)" }}
                >
                  <div className="mb-2 text-2xl">{domain.icon}</div>
                  <h3 className="text-sm font-semibold text-[#F5F0E8]">{domain.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#F5F0E8]/60">{domain.detail}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="px-6 pb-28 pt-4 text-center md:px-16">
        <RangoliDivider />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          transition={sectionTransition}
          className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border-2 border-[#C9A84C]/50 px-8 py-12 shadow-[0_20px_60px_rgba(73,44,8,0.2)]"
          style={{ background: "linear-gradient(135deg, #FFF9EF 0%, #FFEFD0 100%)" }}
        >
          {/* Decorative mandala bg */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <svg width="400" height="400" viewBox="0 0 220 220" aria-hidden>
              <circle cx="110" cy="110" r="98" stroke="#C9A84C" fill="none" strokeWidth="1" />
              <circle cx="110" cy="110" r="72" stroke="#C9A84C" fill="none" strokeWidth="0.6" />
              <circle cx="110" cy="110" r="46" stroke="#C9A84C" fill="none" strokeWidth="0.4" />
            </svg>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B1A1A] via-[#C9A84C] to-[#1B5E3B]" />

          <p className="relative text-xs uppercase tracking-[0.28em] text-[#737955]">
            🪔 Recruitment Section 🪔
          </p>
          <h2 className="relative mb-4 mt-3 font-serif text-3xl text-[#92791B] md:text-4xl">
            Become a Part of Avyakta
          </h2>
          <p className="relative mx-auto max-w-xl text-[#1C1C1C]/80">
            If you are ready to perform, design, document, or organize, we would
            love to see you in the next cohort.
          </p>

          <Link
            href={recruitmentHref}
            className="relative mt-8 inline-block rounded-full bg-gradient-to-r from-[#8B1A1A] to-[#92791B] px-8 py-3 font-semibold text-white shadow-[0_8px_24px_rgba(139,26,26,0.3)] transition hover:shadow-[0_12px_32px_rgba(201,168,76,0.4)] hover:scale-[1.03]"
          >
            {isRecruitmentOpen ? "🪔 Join Now" : "Recruitment Closed"}
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
