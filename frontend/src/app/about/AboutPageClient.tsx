"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const activities = [
  {
    icon: "🎨",
    title: "Make something",
    text: "Try rangoli patterns, poster art, or a tiny stage set.",
    color: "#8B1A1A",
  },
  {
    icon: "🥁",
    title: "Find your rhythm",
    text: "Clap a tala, learn a folk step, or bring a song you love.",
    color: "#1B5E3B",
  },
  {
    icon: "🎭",
    title: "Tell a story",
    text: "Turn a family tale, festival memory, or big idea into a performance.",
    color: "#92791B",
  },
];

export default function AboutPageClient() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F5EDD8] text-[#24150E]">
      <section className="relative isolate overflow-hidden bg-[#1A0A06] px-6 pb-20 pt-36 text-center text-[#FFF7E8] md:pb-28 md:pt-44">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 15% 85%, #8B1A1A 0, transparent 32%), radial-gradient(circle at 85% 15%, #92791B 0, transparent 34%), radial-gradient(circle at 55% 75%, #1B5E3B 0, transparent 30%)",
          }}
        />
        <motion.div
          className="relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-[#F4C766]">
            🪔 Come curious. Leave inspired. 🪔
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight md:text-7xl">
            Culture is a <span className="text-[#F4C766]">playground.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#FFF7E8]/80 md:text-xl">
            At Avyakta, traditions are things we make, move, hear, taste, and
            share—not just things we read about.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/events"
              className="rounded-full bg-[#F4C766] px-7 py-3 font-bold text-[#24150E] transition hover:-translate-y-0.5 hover:bg-white"
            >
              See what’s happening →
            </Link>
            <Link
              href="/recruitment"
              className="rounded-full border border-[#F4C766]/60 px-7 py-3 font-bold text-[#FFF7E8] transition hover:bg-white/10"
            >
              Join the fun
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1fr_1fr] md:py-24">
        <div className="self-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8B1A1A]">
            What is Avyakta?
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">
            A club for making memories together.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#24150E]/75">
            We bring students together to explore India’s living traditions
            through music, movement, art, food, stories, and festivals. You
            don’t need experience—just an idea and a little curiosity.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#C9A84C]/50 bg-white/70 p-5 shadow-sm">
              <p className="font-bold text-[#8B1A1A]">A place to try things</p>
              <p className="mt-2 text-sm leading-6 text-[#24150E]/75">
                Join a rehearsal, help shape an event, learn a new art form, or
                bring a tradition from home to share with the campus.
              </p>
            </div>
            <div className="rounded-2xl border border-[#C9A84C]/50 bg-white/70 p-5 shadow-sm">
              <p className="font-bold text-[#1B5E3B]">
                Made by students, for everyone
              </p>
              <p className="mt-2 text-sm leading-6 text-[#24150E]/75">
                Performers, designers, planners, photographers, and curious
                first-timers all have a part to play. No prior experience is
                needed.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-[#1A0A06] shadow-[0_20px_60px_rgba(36,21,14,0.22)]">
          <div className="flex items-center justify-between px-5 py-4 text-[#FFF7E8]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4C766]">
                A little calm from Kerala
              </p>
              <p className="mt-1 text-sm text-white/70">
                Monsoon ambience • plays muted · use the player controls for
                sound or fullscreen
              </p>
            </div>
            <span aria-hidden="true" className="text-2xl">
              🌧️
            </span>
          </div>
          <div className="aspect-video bg-[#24150E]">
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/hX3r9dFTNVA?autoplay=1&mute=1&loop=1&playlist=hX3r9dFTNVA&controls=1&playsinline=1&rel=0"
              title="Indian village monsoon ambience"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#FFF9ED] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-[#1B5E3B]">
            Choose your adventure
          </p>
          <h2 className="mt-3 text-center font-serif text-4xl font-bold md:text-5xl">
            There’s room for your kind of creativity.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {activities.map((activity) => (
              <article
                key={activity.title}
                className="rounded-3xl border border-[#C9A84C]/35 bg-white p-7 shadow-[0_8px_28px_rgba(36,21,14,0.07)] transition hover:-translate-y-1 hover:shadow-[0_14px_38px_rgba(36,21,14,0.12)]"
              >
                <span className="text-4xl" aria-hidden="true">
                  {activity.icon}
                </span>
                <h3
                  className="mt-4 font-serif text-2xl font-bold"
                  style={{ color: activity.color }}
                >
                  {activity.title}
                </h3>
                <p className="mt-2 leading-7 text-[#24150E]/70">
                  {activity.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center md:py-20">
        <p className="text-3xl" aria-hidden="true">
          🪔 ✨ 🎭 ✨ 🌿
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold">
          Come make the next memory.
        </h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-[#24150E]/70">
          Join an event, meet the team, or bring us an idea. The best traditions
          are the ones we keep creating together.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            href="/events"
            className="rounded-full bg-[#8B1A1A] px-6 py-3 font-bold text-white hover:bg-[#641313]"
          >
            Explore events
          </Link>
          <Link
            href="/members"
            className="rounded-full border border-[#92791B] px-6 py-3 font-bold text-[#24150E] hover:bg-white"
          >
            Meet the team
          </Link>
        </div>
      </section>
    </main>
  );
}
