"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { EventItem, EventStatus } from "@/lib/utils/events";

type EventsPageClientProps = {
  initialEvents: EventItem[];
};

const filterOptions: Array<{ key: "all" | EventStatus; label: string }> = [
  { key: "all", label: "All Events" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const statusClasses: Record<EventStatus, string> = {
  upcoming: "bg-[#92791B] text-white",
  past: "bg-[#8B1A1A] text-white",
};

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const gridReveal = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

// The page's ambient background - previously only behind the hero, now
// carried across the whole page.
const PAGE_BACKGROUND =
  "radial-gradient(circle at 15% 20%, rgba(201,168,76,0.32) 0, transparent 36%), radial-gradient(circle at 88% 16%, rgba(139,26,26,0.26) 0, transparent 38%), linear-gradient(140deg, #1A120C 0%, #2B1610 48%, #15120F 100%)";

// Where each event floats in the 3D field: x/y are viewport percentages,
// z is how far back it starts, w is its width. Deliberately uneven so the
// field reads as scattered depth rather than a grid.
const FLOAT_SLOTS = [
  { x: 20, y: 24, z: -260, w: 210 },
  { x: 74, y: 18, z: -900, w: 250 },
  { x: 46, y: 40, z: -1650, w: 190 },
  { x: 88, y: 48, z: -520, w: 215 },
  { x: 10, y: 62, z: -1250, w: 235 },
  { x: 62, y: 70, z: -180, w: 265 },
  { x: 33, y: 80, z: -1950, w: 195 },
  { x: 84, y: 82, z: -1420, w: 225 },
  { x: 52, y: 10, z: -2250, w: 205 },
  { x: 6, y: 34, z: -2050, w: 175 },
  { x: 94, y: 26, z: -1720, w: 195 },
  { x: 26, y: 50, z: -2550, w: 215 },
];

// Perspective depth of the stage. A card sitting at z = PERSPECTIVE would
// be infinitely large (right at the camera), so cards are faded out well
// before that, at EXIT_Z, and TRAVEL is long enough that even the
// furthest-back card completes its pass before the scroll runs out.
const PERSPECTIVE = 1000;
const EXIT_Z = 600;
const TRAVEL = 3400;

function FloatingEventCard({
  event,
  slot,
  progress,
}: {
  event: EventItem;
  slot: (typeof FLOAT_SLOTS)[number];
  progress: MotionValue<number>;
}) {
  // Scrolling drives the card toward the camera. Perspective does the rest:
  // as z grows the card scales up and slides outward from the vanishing
  // point, so it reads as flying past you rather than merely getting bigger.
  const z = useTransform(progress, [0, 1], [slot.z, slot.z + TRAVEL]);
  const exitAt = (EXIT_Z - slot.z) / TRAVEL;
  const opacity = useTransform(
    progress,
    [0, Math.max(0.02, exitAt - 0.12), exitAt],
    [1, 1, 0],
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: slot.w,
        x: "-50%",
        y: "-50%",
        z,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      <Link
        href={`/events/${event.slug}`}
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-[#C9A84C]/35 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      >
        <div
          className="absolute inset-0"
          style={
            event.posterUrl
              ? {
                  backgroundImage: `url(${event.posterUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: event.posterFallback }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12100E] via-[#12100E]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-left text-[#F5F0E8]">
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.11em] ${statusClasses[event.status]}`}
          >
            {event.status}
          </span>
          <h3 className="font-serif text-lg leading-tight">{event.title}</h3>
        </div>
      </Link>
    </motion.div>
  );
}

// Momentum ("inertia") scrolling, the thing that gives sites like
// grainient.supply their weighted, glidey feel. This drives the real
// window scroll position toward a target each frame rather than
// transforming a wrapper element - transform-based smooth scroll would
// silently break every position:sticky and scroll-linked animation on the
// page. Wheel only; trackpad/keyboard/touch stay native.
function useMomentumScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let running = false;

    const maxScroll = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    function tick() {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) {
        frame = requestAnimationFrame(tick);
      }
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      event.preventDefault();
      if (!running) current = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), target + event.deltaY));
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    }

    // Any scroll we didn't drive (anchor jump, scrollbar drag, keyboard)
    // resyncs the target so the next wheel tick doesn't yank the page back.
    function onScroll() {
      if (!running) target = window.scrollY;
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);
}

const heroParticles = [
  { left: "8%", top: "18%", delay: 0.1, duration: 8.2 },
  { left: "24%", top: "70%", delay: 0.8, duration: 7.4 },
  { left: "42%", top: "30%", delay: 1.2, duration: 8.8 },
  { left: "64%", top: "62%", delay: 0.5, duration: 7.9 },
  { left: "80%", top: "24%", delay: 1.6, duration: 8.6 },
  { left: "90%", top: "74%", delay: 0.3, duration: 7.6 },
];

export default function EventsPageClient({
  initialEvents,
}: EventsPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | EventStatus>("all");

  // Whole-page progress, for the top progress bar.
  const { scrollYProgress: pageScrollProgress } = useScroll();

  // The floating field cycles through the available events so the depth
  // reads as a field rather than a handful of stragglers when the club
  // only has a few events published.
  const floatingEvents = useMemo(() => {
    if (initialEvents.length === 0) return [];
    return FLOAT_SLOTS.map(
      (_, index) => initialEvents[index % initialEvents.length],
    );
  }, [initialEvents]);

  const [immersive, setImmersive] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setImmersive(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useMomentumScroll(immersive);

  // Progress through the fly-through stage: 0 when it pins, 1 when it
  // releases. Derived from the section's measured geometry against the
  // page's own scroll position rather than a target-ref measurement, so
  // it stays correct even though the section's height only appears once
  // the immersive branch mounts.
  const flyRef = useRef<HTMLElement | null>(null);
  const { scrollY } = useScroll();
  const [flyBounds, setFlyBounds] = useState({ start: 0, end: 1 });

  useEffect(() => {
    function measure() {
      const node = flyRef.current;
      if (!node) return;
      const start = node.getBoundingClientRect().top + window.scrollY;
      const runway = node.offsetHeight - window.innerHeight;
      setFlyBounds({ start, end: start + Math.max(1, runway) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [immersive, floatingEvents.length]);

  const flyProgress = useTransform(
    scrollY,
    [flyBounds.start, flyBounds.end],
    [0, 1],
    { clamp: true },
  );
  // The title arrives once the field has mostly streamed past.
  const titleOpacity = useTransform(flyProgress, [0.72, 0.88], [0, 1]);
  const titleScale = useTransform(flyProgress, [0.72, 1], [0.92, 1]);
  const hintOpacity = useTransform(flyProgress, [0, 0.08], [1, 0]);

  const visibleEvents = useMemo(() => {
    if (activeFilter === "all") {
      return initialEvents;
    }

    return initialEvents.filter((event) => event.status === activeFilter);
  }, [activeFilter, initialEvents]);

  return (
    <main
      className="min-h-screen text-[#F5F0E8]"
      style={{
        backgroundImage: PAGE_BACKGROUND,
        backgroundAttachment: "scroll",
      }}
    >
      <motion.div
        className="fixed left-0 right-0 top-0 z-[80] h-1 origin-left bg-[linear-gradient(90deg,#8B1A1A,#C9A84C,#1B5E3B)]"
        style={{ scaleX: pageScrollProgress }}
      />

      {/* This wrapper is always mounted so useScroll's target ref always
          resolves - only its height and contents are conditional. */}
      <section
        ref={flyRef}
        className={immersive ? "relative h-[360vh]" : "relative"}
      >
        {immersive ? (
          /* Fly-through stage. The inner frame pins for the length of this
             section while scroll drives the whole field of events toward
             the camera and past you, then the title lands once they've
             cleared. */
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {heroParticles.map((particle, index) => (
                <motion.span
                  key={index}
                  className="absolute h-2.5 w-2.5 rounded-full bg-[#C9A84C]/80"
                  style={{ left: particle.left, top: particle.top }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.35, 1, 0.35],
                    scale: [0.75, 1.15, 0.75],
                  }}
                  transition={{
                    repeat: Infinity,
                    ease: "easeInOut",
                    duration: particle.duration,
                    delay: particle.delay,
                  }}
                />
              ))}
            </div>

            {/* Cards are direct children so the perspective here applies
                to each of them individually. */}
            <div
              className="absolute inset-0"
              style={{ perspective: `${PERSPECTIVE}px` }}
            >
              {floatingEvents.map((event, index) => (
                <FloatingEventCard
                  key={`${event.id}-${index}`}
                  event={event}
                  slot={FLOAT_SLOTS[index]}
                  progress={flyProgress}
                />
              ))}
            </div>

            <motion.div
              style={{ opacity: titleOpacity, scale: titleScale }}
              className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
            >
              <h1 className="font-serif text-5xl leading-tight md:text-7xl">
                Avyakta Event Calendar
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[#F5F0E8]/82 md:text-base">
                Explore upcoming showcases and archived cultural moments curated
                by the Avyakta collective.
              </p>
            </motion.div>

            <motion.p
              style={{ opacity: hintOpacity }}
              className="pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center text-xs uppercase tracking-[0.2em] text-[#C9A84C]/70"
            >
              Scroll to enter ↓
            </motion.p>
          </div>
        ) : (
          /* Reduced-motion / small screens: same content, no 3D, no pin.
             Extra top padding clears the floating navbar. */
          <div className="px-6 pb-16 pt-40">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-serif text-4xl leading-tight md:text-6xl">
                Avyakta Event Calendar
              </h1>
              <p className="mt-5 text-sm leading-8 text-[#F5F0E8]/82">
                Explore upcoming showcases and archived cultural moments curated
                by the Avyakta collective.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={reveal}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.22em] text-[#C9A84C]/70">
            Filter Section
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#C9A84C] md:text-3xl">
            Browse by Status
          </h2>

          <div className="mt-6 flex flex-wrap gap-6">
            {filterOptions.map((filter) => {
              const isActive = filter.key === activeFilter;

              return (
                <motion.button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  whileTap={{ scale: 0.96 }}
                  className={`relative pb-2 text-sm font-semibold uppercase tracking-[0.15em] transition ${
                    isActive
                      ? "text-[#C9A84C]"
                      : "text-[#F5F0E8]/70 hover:text-[#C9A84C]"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`absolute left-0 top-full h-[3px] w-full rounded-full bg-[#C9A84C] transition-transform duration-300 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="mt-10 grid gap-8 sm:grid-cols-2"
          variants={gridReveal}
          initial="hidden"
          animate="show"
          key={activeFilter}
        >
          {visibleEvents.map((event) => (
            <motion.article
              key={event.id}
              variants={reveal}
              whileHover={{ y: -8, scale: 1.012, zIndex: 10 }}
              className="group relative z-0 overflow-hidden rounded-3xl border-2 border-[#C9A84C]/55 bg-[#1C1C1C] transition-shadow duration-300 hover:shadow-[0_28px_60px_rgba(60,32,8,0.28)]"
            >
              <Link href={`/events/${event.slug}`} className="block">
                <div className="relative h-64 w-full md:h-80">
                  <div
                    className="absolute inset-0"
                    style={
                      event.posterUrl
                        ? {
                            backgroundImage: `url(${event.posterUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : { background: event.posterFallback }
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/35 to-transparent" />

                  <div className="absolute left-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] ${statusClasses[event.status]}`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="relative px-6 py-6 text-[#F5F0E8]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-semibold leading-tight md:text-3xl">
                      {event.title}
                    </h3>
                    <span className="shrink-0 rounded-full bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E8]">
                      {event.domain}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#F5F0E8]/82">
                    {event.subtitle}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#C9A84C]">
                    {event.date}
                  </p>

                  <span className="mt-5 inline-block w-fit rounded-full border border-[#C9A84C]/80 bg-black/30 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#F5F0E8]">
                    Read Full Details →
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        {visibleEvents.length === 0 && (
          <div className="mt-10 rounded-2xl border border-[#C9A84C]/45 bg-black/25 p-8 text-center text-[#F5F0E8]/75">
            No events match this filter right now.
          </div>
        )}
      </section>

      <section className="border-t-2 border-[#C9A84C]/35 bg-black/25 px-6 py-16 text-[#F5F0E8] md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={reveal}
          className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#C9A84C]">
              Call To Action
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Want to host or volunteer at an event?
            </h2>
          </div>

          <Link
            href="/registrations"
            className="rounded-full border border-[#C9A84C] bg-[#92791B] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#7A6518]"
          >
            Register Interest
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
