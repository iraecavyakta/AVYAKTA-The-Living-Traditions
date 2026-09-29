"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import CursorSplashOverlay from "@/components/shared/CursorSplashOverlay";
import { useCursorSplash } from "@/hooks/useCursorSplash";
import type { EventItem } from "@/lib/utils/events";
import type { GalleryImage } from "@/lib/data/gallery";

type EventManager = {
  id: string;
  name: string;
  domain: string;
  designation: string;
};

type EventDetailClientProps = {
  event: EventItem;
  galleryImages: GalleryImage[];
  eventManagers: EventManager[];
};

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const heroParticles = [
  { left: "12%", top: "20%", delay: 0.1, duration: 8.4 },
  { left: "28%", top: "68%", delay: 0.7, duration: 7.8 },
  { left: "48%", top: "30%", delay: 1.2, duration: 8.9 },
  { left: "70%", top: "60%", delay: 0.5, duration: 7.6 },
  { left: "86%", top: "26%", delay: 1.4, duration: 8.5 },
];

export default function EventDetailClient({
  event,
  galleryImages,
  eventManagers,
}: EventDetailClientProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const longDescription = event.description.length > 480;

  // Whole-page progress, for the top progress bar.
  const { scrollYProgress: pageScrollProgress } = useScroll();

  // Scoped to just the hero section, so the parallax maps to actually
  // scrolling past the hero instead of an arbitrary slice of the whole
  // page's scroll distance (which made it feel laggy/disconnected,
  // especially on longer event pages).
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, 110]);
  const heroScale = useTransform(heroScrollProgress, [0, 1], [1, 0.95]);
  const cursorFx = useCursorSplash();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F0E8] text-[#1C1C1C]">
      <CursorSplashOverlay {...cursorFx} />

      <motion.div
        className="fixed left-0 right-0 top-0 z-[80] h-1 origin-left bg-[linear-gradient(90deg,#8B1A1A,#C9A84C,#1B5E3B)]"
        style={{ scaleX: pageScrollProgress }}
      />

      <section
        ref={heroRef}
        className="relative overflow-hidden border-b-2 border-[#C9A84C]/40 bg-[#1C1C1C] px-6 py-16 text-[#F5F0E8] md:px-16"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(201,168,76,0.3) 0, transparent 38%), radial-gradient(circle at 85% 22%, rgba(139,26,26,0.28) 0, transparent 42%), linear-gradient(140deg, #1A120C 0%, #2B1610 48%, #15120F 100%)",
          }}
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {heroParticles.map((particle, index) => (
            <motion.span
              key={index}
              className="absolute h-2.5 w-2.5 rounded-full bg-[#C9A84C]/80"
              style={{ left: particle.left, top: particle.top }}
              animate={{
                y: [0, -22, 0],
                opacity: [0.35, 1, 0.35],
                scale: [0.75, 1.14, 0.75],
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

        <motion.div
          initial="hidden"
          animate="show"
          variants={reveal}
          style={{ y: heroY, scale: heroScale }}
          className="relative mx-auto mt-8 grid w-full max-w-6xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center"
        >
          <div>
            <h1 className="font-serif text-5xl font-bold leading-tight md:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-[#F5F0E8] to-[#C9A84C]">
              {event.title}
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#F5F0E8]/90 md:text-lg">
              {event.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.15em]">
              <span className="rounded-full bg-gradient-to-r from-[#8B1A1A] to-[#601010] shadow-[0_0_15px_rgba(139,26,26,0.6)] px-5 py-2.5 text-white">
                {event.status}
              </span>
              <span className="rounded-full border-2 border-[#C9A84C]/60 bg-black/40 px-5 py-2.5 text-[#F5F0E8] backdrop-blur-sm">
                {event.domain}
              </span>
            </div>

            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              className="mt-10 max-w-fit rounded-2xl border-l-4 border-l-[#C9A84C] bg-gradient-to-r from-black/60 to-transparent p-5 backdrop-blur-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">
                Event Date
              </p>
              <p className="mt-2 text-lg text-[#F5F0E8]">{event.date}</p>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-3xl border-4 border-[#C9A84C]/30 bg-[#120B09] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {event.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.posterUrl}
                alt={event.title}
                className="h-full w-full object-contain p-3 transition-opacity duration-500 group-hover:opacity-90 md:p-5"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: event.posterFallback }}
              >
                <span className="text-6xl opacity-30">✦</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
            <div className="absolute bottom-6 left-6 right-6 border-l-2 border-[#C9A84C] pl-4">
              <p className="font-serif text-2xl text-white">{event.title}</p>
              <p className="mt-1 text-sm text-[#C9A84C]">Avyakta Exclusive</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12 md:px-16">
        <motion.article
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.28 }}
          variants={reveal}
          whileHover={{ y: -6 }}
          className="rounded-2xl border border-[#C9A84C]/40 bg-white p-6 shadow-[0_18px_40px_rgba(40,22,6,0.12)] md:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B1A1A]">
            The story so far
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#92791B]">
            About this event
          </h2>
          <p
            className={`mt-4 whitespace-pre-line text-sm leading-7 text-[#1C1C1C]/80 md:text-base ${longDescription && !descriptionExpanded ? "line-clamp-5" : ""}`}
          >
            {event.description}
          </p>
          {longDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              className="mt-4 rounded-full border border-[#92791B]/45 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#765F16] transition hover:bg-[#F5F0E8]"
            >
              {descriptionExpanded ? "Show less" : "Read full description"}
            </button>
          )}
        </motion.article>

        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.28 }}
            variants={reveal}
            whileHover={{ y: -6 }}
            className="rounded-2xl border border-[#C9A84C]/40 bg-white p-6 shadow-[0_18px_40px_rgba(40,22,6,0.12)]"
          >
            <h2 className="text-2xl font-semibold text-[#92791B]">
              Event Venue & Contact
            </h2>
            <div className="mt-4 space-y-4">
              <motion.div
                whileHover={{ scale: 1.015 }}
                className="flex flex-col gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#F9F5EE] px-5 py-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B1A1A]">
                  Venue Location
                </p>
                <p className="text-base text-[#1C1C1C]/90 font-medium">
                  {event.venue || "Venue will be announced shortly."}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.015 }}
                className="flex flex-col gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#F9F5EE] px-5 py-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B1A1A]">
                  Current Event Management & Operations Heads
                </p>
                {eventManagers.length ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {eventManagers.map((manager) => (
                      <span
                        key={manager.id}
                        className="rounded-full border border-[#C9A84C]/35 bg-white px-3 py-2 text-sm text-[#1C1C1C]/85"
                      >
                        <span className="font-semibold">{manager.name}</span>
                        <span className="ml-2 text-xs text-[#737955]">
                          {manager.domain} Head
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#1C1C1C]/70">
                    Current team contacts will be listed here shortly.
                  </p>
                )}
                <Link
                  href="/contact"
                  className="mt-2 w-fit text-xs font-bold uppercase tracking-wider text-[#8B1A1A] hover:underline"
                >
                  Contact Avyakta →
                </Link>
              </motion.div>
            </div>
          </motion.article>

          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.28 }}
            variants={reveal}
            className="rounded-2xl border border-[#C9A84C]/40 bg-white p-6 shadow-[0_18px_40px_rgba(40,22,6,0.12)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B1A1A]">
              The highlights
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#92791B]">
              What made it special
            </h2>
            {event.highlights.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#1C1C1C]/86">
                {event.highlights.map((point, index) => (
                  <li
                    key={`${index}-${point}`}
                    className="flex gap-3 rounded-xl border border-[#C9A84C]/25 bg-[#F9F5EE] px-4 py-3"
                  >
                    <span className="text-[#8B1A1A]" aria-hidden="true">
                      ✦
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-[#C9A84C]/25 bg-[#F9F5EE] px-4 py-3 text-sm leading-7 text-[#1C1C1C]/72">
                Event highlights will be added soon.
              </p>
            )}
          </motion.article>
        </div>

        <motion.article
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.16 }}
          variants={reveal}
          className="rounded-2xl border border-[#C9A84C]/40 bg-white p-6 shadow-[0_18px_40px_rgba(40,22,6,0.12)] md:p-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B1A1A]">
                From the album
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#92791B]">
                Event Gallery
              </h2>
            </div>
            {galleryImages.length > 0 && (
              <Link
                href={`/gallery#event-${event.id}`}
                className="rounded-full border border-[#92791B]/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#765F16] transition hover:bg-[#F5F0E8]"
              >
                View full gallery →
              </Link>
            )}
          </div>
          {galleryImages.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {galleryImages.map((image) => (
                <Link
                  key={image.id}
                  href={`/gallery#event-${event.id}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-[#C9A84C]/35 bg-[#1C1C1C]"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-contain p-2 transition duration-500 group-hover:opacity-90"
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-[#C9A84C]/45 bg-[#F9F5EE] px-4 py-6 text-sm text-[#1C1C1C]/70">
              Photos from this celebration will appear here as they are added.
            </p>
          )}
        </motion.article>
      </section>

      <section className="border-t-2 border-[#C9A84C]/35 bg-[#1C1C1C] px-6 py-12 text-[#F5F0E8] md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={reveal}
          className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <p className="text-sm text-[#F5F0E8]/86">
            Explore more events or register your interest.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-full border border-[#C9A84C]/70 px-5 py-2 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#C9A84C]/10"
            >
              Back to Events
            </Link>
            <Link
              href="/registrations"
              className="rounded-full border border-[#C9A84C] bg-[#92791B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#7A6518]"
            >
              Register Interest
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
