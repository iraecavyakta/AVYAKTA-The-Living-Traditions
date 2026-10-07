"use client";

import { motion } from "framer-motion";

export default function ContactPageClient() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <main className="min-h-[100vh] bg-[#1C1C1C] text-[#F5F0E8] overflow-hidden relative selection:bg-[#92791B] selection:text-[#1C1C1C]">
      {/* Background Indian Motif Patterns */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='paisley' patternUnits='userSpaceOnUse' width='200' height='200'%3E%3Cpath d='M100,50 Q130,80 115,110 Q130,140 100,160 Q70,140 85,110 Q70,80 100,50 Z' fill='%2392791B'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23paisley)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(146,121,27,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(27,94,59,0.06),transparent_40%)]" />

      <section className="relative px-6 pb-20 pt-40 md:px-16 min-h-screen flex flex-col justify-center items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-center w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-4 opacity-90 mb-6">
            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#C9A84C]" />
            <span className="text-xl text-[#92791B]">✦</span>
            <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[#C9A84C]" />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#F5F0E8] mb-6 drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">
            Let&apos;s Connect
          </h1>
          <p className="text-[#C9A84C]/90 text-lg max-w-xl mx-auto italic font-medium leading-relaxed">
            Whether you want to perform, collaborate, or simply say hello -
            we’re always ready to listen. Dive into the world of Avyakta.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl relative z-10"
        >
          {/* Instagram Card */}
          <motion.a
            href="https://instagram.com/avyakta_ira"
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-white rounded-[24px] p-8 border-2 border-[#C9A84C]/30 shadow-[0_15px_40px_rgba(146,121,27,0.08)] hover:border-[#92791B] hover:shadow-[0_20px_50px_rgba(146,121,27,0.15)] transition-all duration-300"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#C9A84C]/20 to-transparent rounded-full blur-2xl group-hover:bg-[#92791B]/20 transition-colors" />
            <div className="w-14 h-14 bg-[#1C1C1C] rounded-2xl flex items-center justify-center text-[#F5F0E8] mb-6 shadow-inner border border-[#C9A84C]/50 group-hover:bg-gradient-to-br group-hover:from-[#92791B] group-hover:to-[#1C1C1C]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#737955] mb-2">
              Socials
            </p>
            <h3 className="font-serif text-3xl font-bold text-[#1C1C1C] mb-2 group-hover:text-[#92791B] transition-colors">
              Instagram
            </h3>
            <p className="text-[#1C1C1C]/70 font-medium">@avyakta_ira</p>
            <div className="mt-8 flex items-center text-sm font-bold text-[#92791B] uppercase tracking-wider group-hover:translate-x-2 transition-transform">
              Follow us <span>→</span>
            </div>
          </motion.a>

          {/* Email Card */}
          <motion.a
            href="mailto:iraec.avyakta@pes.edu"
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-white rounded-[24px] p-8 border-2 border-[#C9A84C]/30 shadow-[0_15px_40px_rgba(146,121,27,0.08)] hover:border-[#92791B] hover:shadow-[0_20px_50px_rgba(146,121,27,0.15)] transition-all duration-300"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#8B1A1A]/10 to-transparent rounded-full blur-2xl group-hover:bg-[#8B1A1A]/20 transition-colors" />
            <div className="w-14 h-14 bg-[#1C1C1C] rounded-2xl flex items-center justify-center text-[#F5F0E8] mb-6 shadow-inner border border-[#C9A84C]/50 group-hover:bg-gradient-to-br group-hover:from-[#8B1A1A] group-hover:to-[#1C1C1C]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#737955] mb-2">
              Inquiries
            </p>
            <h3 className="font-serif text-3xl font-bold text-[#1C1C1C] mb-2 group-hover:text-[#8B1A1A] transition-colors">
              Email
            </h3>
            <p className="text-[#1C1C1C]/70 font-medium">
              iraec.avyakta@pes.edu
            </p>
            <div className="mt-8 flex items-center text-sm font-bold text-[#8B1A1A] uppercase tracking-wider group-hover:translate-x-2 transition-transform">
              Drop a mail <span>→</span>
            </div>
          </motion.a>

          {/* Heads Card */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden bg-gradient-to-br from-[#1C1C1C] to-[#2A231C] rounded-[24px] p-8 border-2 border-[#C9A84C]/50 shadow-[0_15px_40px_rgba(28,28,28,0.3)] hover:border-[#C9A84C] transition-all duration-300 md:col-span-2 lg:col-span-1"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.15),transparent)] pointer-events-none" />
            <div className="w-14 h-14 bg-[#F5F0E8] rounded-2xl flex items-center justify-center text-[#1C1C1C] mb-6 shadow-[0_4px_12px_rgba(201,168,76,0.4)] border border-[#C9A84C]/80">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-2">
              Leadership
            </p>
            <h3 className="font-serif text-3xl font-bold text-[#F5F0E8] mb-6">
              Club Heads
            </h3>

            <div className="space-y-3">
              {[
                { role: "Club Head", label: "Club Head" },
                { role: "Head of Ops", label: "Head of Ops" },
                { role: "Head of Tech", label: "Head of Tech" },
              ].map(({ role, label }) => (
                <div
                  key={role}
                  className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5"
                >
                  <div>
                    <p className="text-[#F5F0E8] font-medium">{label}</p>
                    <p className="text-xs text-[#C9A84C]/60 italic">
                      Contact via email
                    </p>
                  </div>
                  <a
                    href="mailto:iraec.avyakta@pes.edu"
                    className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#1C1C1C] transition-colors"
                    aria-label={`Email ${label}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
