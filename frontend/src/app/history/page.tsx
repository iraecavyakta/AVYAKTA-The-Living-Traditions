import Link from "next/link";

const milestones = [
  {
    year: "2026",
    season: "Founding",
    title: "The First Flame",
    description:
      "Avyakta was born from a shared longing — a group of students at PESU EC who believed the campus needed a space where culture could breathe freely. The inaugural orientation showcase lit the first diya, gathering performers, designers, and storytellers under one roof.",
    symbol: "✦",
    accent: "#C9A84C",
  },
  {
    year: "2026",
    season: "First Event",
    title: "Rangotsav Night",
    description:
      "Our first large-scale cultural evening. Folk music, classical dance, and live percussion filled the open air theatre as students experienced Avyakta's vision for the very first time. The event sold out before the night ended.",
    symbol: "◈",
    accent: "#8B1A1A",
  },
  {
    year: "2027",
    season: "Expansion",
    title: "The Domains Take Shape",
    description:
      "Eight distinct domains crystallised — Design, Event Management, Finance and Ethics, Logistics, Marketing, Media and Visibility, Operations, and Technical. Each found its rhythm and its people. Cross-domain collaborations produced work that none could have done alone.",
    symbol: "❋",
    accent: "#1B5E3B",
  },
  {
    year: "2027",
    season: "Milestone",
    title: "Swar & Stage",
    description:
      "Carnatic vocals met contemporary theatre in a 90-minute shared set built entirely by Avyakta members. Rehearsed for six weeks, it became the most ambitious production in the club's short life and set a new benchmark for what student culture could look like.",
    symbol: "✦",
    accent: "#C9A84C",
  },
  {
    year: "2028",
    season: "Outreach",
    title: "Beyond the Campus",
    description:
      "Avyakta opened its doors wider — curated festivals, mentorship circles, and inter-college collaborations brought new voices into the fold. Alumni began returning as advisors, bridging batches across the years.",
    symbol: "◈",
    accent: "#8B1A1A",
  },
  {
    year: "2028",
    season: "Present",
    title: "The Living Traditions",
    description:
      "Today, Avyakta is more than a club. It is a living memory — a collective that honours India's artistic heritage while writing new chapters with every event, every poster, every performance, every line of code.",
    symbol: "❋",
    accent: "#1B5E3B",
  },
];

const values = [
  {
    title: "Rooted in Tradition",
    body: "Every event draws from India's rich tapestry of classical arts, folk traditions, and living rituals — not as a museum, but as a living practice.",
  },
  {
    title: "Crafted with Care",
    body: "From kolam-inspired posters to handcrafted stage sets, everything Avyakta produces carries the fingerprint of the person who made it.",
  },
  {
    title: "Community First",
    body: "The club exists for its people. Every domain, every event, every role is an opportunity for a student to discover what they are capable of.",
  },
  {
    title: "Always Evolving",
    body: "Tradition is not a cage. Avyakta blends classical sensibility with contemporary tools — digital archives, motion design, and live-streamed events.",
  },
];

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#1C1C1C] text-[#F5F0E8] overflow-x-hidden">
      {/* Decorative top border */}
      <div className="h-1 w-full bg-gradient-to-r from-[#8B1A1A] via-[#C9A84C] to-[#1B5E3B]" />

      {/* Hero */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        {/* Mandala background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <svg
            width="700"
            height="700"
            viewBox="0 0 220 220"
            aria-hidden
            className="animate-spin-slow"
          >
            {[98, 80, 62, 44, 28].map((r, i) => (
              <circle
                key={r}
                cx="110"
                cy="110"
                r={r}
                stroke="#C9A84C"
                fill="none"
                strokeWidth={i === 0 ? "0.8" : "0.5"}
                strokeDasharray={i % 2 === 1 ? "2 4" : undefined}
              />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="110"
                y1="12"
                x2="110"
                y2="208"
                stroke="#C9A84C"
                strokeWidth="0.4"
                transform={`rotate(${angle} 110 110)`}
              />
            ))}
          </svg>
        </div>

        {/* Ambient colour blobs */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(201,168,76,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,26,26,0.14) 0, transparent 40%)",
          }}
        />

        <div className="relative">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A84C]" />
            <span className="text-2xl text-[#C9A84C]">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A84C]" />
          </div>

          <p className="mb-3 text-xs uppercase tracking-[0.36em] text-[#C9A84C]">
            Our Story
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight text-[#F5F0E8] drop-shadow-[0_0_20px_rgba(201,168,76,0.3)] md:text-7xl">
            The History of
            <br />
            <span className="text-[#C9A84C]">Avyakta</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#F5F0E8]/75 md:text-lg">
            A cultural collective woven from tradition, creativity, and the
            belief that every student deserves a stage.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="text-[#C9A84C]/50">◈</span>
            <span className="text-sm italic text-[#C9A84C]/80">
              अव्यक्त — The Unmanifest Becoming Manifest
            </span>
            <span className="text-[#C9A84C]/50">◈</span>
          </div>
        </div>
      </section>

      {/* Kolam divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A84C]/40 mx-8" />
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden
          className="mx-4 shrink-0"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#C9A84C"
            strokeWidth="0.8"
            opacity="0.5"
          />
          <circle
            cx="24"
            cy="24"
            r="12"
            stroke="#C9A84C"
            strokeWidth="0.8"
            opacity="0.5"
          />
          <circle cx="24" cy="24" r="4" fill="#C9A84C" opacity="0.6" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle
              key={a}
              cx={24 + 16 * Math.cos((a * Math.PI) / 180)}
              cy={24 + 16 * Math.sin((a * Math.PI) / 180)}
              r="2"
              fill="#C9A84C"
              opacity="0.4"
            />
          ))}
        </svg>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A84C]/40 mx-8" />
      </div>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.28em] text-[#C9A84C]/70">
          Chronicle
        </p>
        <h2 className="mb-14 text-center font-serif text-3xl text-[#F5F0E8] md:text-4xl">
          Milestones & Memories
        </h2>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/60 via-[#C9A84C]/30 to-transparent md:left-1/2" />

          <div className="space-y-12">
            {milestones.map((m, i) => (
              <div
                key={`${m.year}-${m.title}`}
                className={`relative flex gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-row`}
              >
                {/* Timeline node */}
                <div className="relative z-10 flex-none">
                  <div
                    className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm shadow-[0_0_12px_rgba(201,168,76,0.3)]"
                    style={{
                      borderColor: m.accent,
                      backgroundColor: "#1C1C1C",
                      color: m.accent,
                    }}
                  >
                    {m.symbol}
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 md:max-w-[calc(50%-2rem)]"
                  style={{
                    borderColor: `${m.accent}30`,
                    background:
                      "linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(40,32,20,0.9) 100%)",
                  }}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ background: `${m.accent}22`, color: m.accent }}
                    >
                      {m.season}
                    </span>
                    <span className="text-xs text-[#F5F0E8]/40">{m.year}</span>
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-bold text-[#F5F0E8]">
                    {m.title}
                  </h3>
                  <p className="text-sm leading-7 text-[#F5F0E8]/75">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kolam divider 2 */}
      <div className="relative flex items-center justify-center py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8B1A1A]/40 mx-8" />
        <span className="mx-4 text-2xl text-[#8B1A1A]/60">✦</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#8B1A1A]/40 mx-8" />
      </div>

      {/* Values / What We Stand For */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-8">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.28em] text-[#C9A84C]/70">
          Our Foundation
        </p>
        <h2 className="mb-12 text-center font-serif text-3xl text-[#F5F0E8] md:text-4xl">
          What We Stand For
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-[#C9A84C]/20 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-[#C9A84C]/50 hover:-translate-y-1"
              style={{
                background:
                  "linear-gradient(135deg, rgba(40,32,20,0.9) 0%, rgba(28,28,28,0.95) 100%)",
              }}
            >
              <div className="mb-4 h-px w-10 bg-[#C9A84C]/70" />
              <h3 className="mb-3 font-serif text-lg font-semibold text-[#C9A84C]">
                {v.title}
              </h3>
              <p className="text-sm leading-7 text-[#F5F0E8]/70">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote section */}
      <section className="relative overflow-hidden px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(201,168,76,0.06) 0, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 text-5xl text-[#C9A84C]/30 font-serif">
            &ldquo;
          </div>
          <blockquote className="font-serif text-xl italic leading-9 text-[#F5F0E8]/90 md:text-2xl">
            Culture is not what we perform on stage.
            <br />
            It is what we carry into the room
            <br />
            before the lights come on.
          </blockquote>
          <div className="mt-6 text-sm font-medium tracking-[0.2em] text-[#C9A84C]">
            — Avyakta Collective
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-[#C9A84C]/20 px-6 py-16 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[#C9A84C]/70">
          Be Part of the Story
        </p>
        <h2 className="mb-4 font-serif text-3xl text-[#F5F0E8] md:text-4xl">
          Your Chapter Awaits
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-[#F5F0E8]/65">
          Every year, Avyakta grows because new people bring new energy. Join a
          domain, attend an event, or simply stay curious.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/recruitment"
            className="rounded-full bg-[#92791B] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
          >
            Join Avyakta
          </Link>
          <Link
            href="/events"
            className="rounded-full border border-[#C9A84C]/50 px-8 py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#C9A84C]/10"
          >
            See Our Events
          </Link>
        </div>
      </section>
    </main>
  );
}
