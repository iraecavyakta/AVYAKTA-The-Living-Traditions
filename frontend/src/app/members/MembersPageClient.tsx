"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type MemberCard, memberSectionOrder } from "@/lib/data/memberSections";

type MembersPageClientProps = {
  initialMembers: MemberCard[];
};

function RangoliCorner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const baseClass = "pointer-events-none absolute h-14 w-14 text-[#C9A84C]/60";
  const positionClass = {
    "top-left": "left-2 top-2",
    "top-right": "right-2 top-2 rotate-90",
    "bottom-left": "bottom-2 left-2 -rotate-90",
    "bottom-right": "bottom-2 right-2 rotate-180",
  }[position];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${baseClass} ${positionClass}`}
      aria-hidden
    >
      <path
        d="M50 10 C55 30,70 45,90 50 C70 55,55 70,50 90 C45 70,30 55,10 50 C30 45,45 30,50 10 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  );
}

export default function MembersPageClient({
  initialMembers,
}: MembersPageClientProps) {
  const [selectedMember, setSelectedMember] = useState<MemberCard | null>(null);
  const [activeTab, setActiveTab] = useState<string>(memberSectionOrder[0].key);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedMember) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedMember]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMember(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sections = useMemo(() => {
    return memberSectionOrder.map((section) => {
      const members = initialMembers.filter(
        (member) => member.section === section.key,
      );
      members.sort((a, b) => {
        if (section.key === "current-team") {
          const aHead =
            a.tags.includes("head") || /head|president/i.test(a.designation);
          const bHead =
            b.tags.includes("head") || /head|president/i.test(b.designation);
          if (aHead !== bHead) return aHead ? -1 : 1;
        }
        if (section.key === "past-teams" && a.year !== b.year)
          return (b.year ?? 0) - (a.year ?? 0);
        return a.name.localeCompare(b.name);
      });
      return {
        ...section,
        title:
          section.key === "past-teams"
            ? "The People Who Built Avyakta"
            : section.title,
        members,
      };
    });
  }, [initialMembers]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.06,
        staggerChildren: 0.08,
      },
    },
  };

  const cardItem = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#1C1C1C]">
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-[#C9A84C]/40 bg-[#1C1C1C] px-6 pb-16 pt-32 text-[#F5F0E8] md:px-12 md:pb-20 md:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(201,168,76,0.35), transparent 34%), radial-gradient(circle at 80% 16%, rgba(27,94,59,0.3), transparent 34%), linear-gradient(135deg, #17110B 0%, #2B1610 46%, #14110D 100%)",
          }}
          aria-hidden
        />
        {/* Decorative kolam */}
        <div className="pointer-events-none absolute right-[-60px] top-[-60px] opacity-[0.08]">
          <svg width="280" height="280" viewBox="0 0 220 220" aria-hidden>
            <circle
              cx="110"
              cy="110"
              r="98"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="1"
            />
            <circle
              cx="110"
              cy="110"
              r="72"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="0.75"
            />
            <circle
              cx="110"
              cy="110"
              r="46"
              stroke="#C9A84C"
              fill="none"
              strokeWidth="0.5"
            />
          </svg>
        </div>
        <motion.div
          className="relative mx-auto max-w-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.22em] text-[#C9A84C]">
            Members
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-6xl">
            A Living Tribute to Avyakta
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F0E8]/84 md:text-base">
            Every section below represents people who built, sustained, and
            carried this collective forward.
          </p>
        </motion.div>
      </section>

      {/* Member Sections */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {/* Filter Tabs */}
        <div className="mb-12 flex flex-wrap justify-center gap-3 md:gap-4 relative z-10 w-full max-w-4xl mx-auto">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveTab(section.key)}
              className={`rounded-full border px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wider transition-all duration-300 md:text-xs ${
                activeTab === section.key
                  ? "border-[#92791B] bg-gradient-to-r from-[#8B1A1A] to-[#1C1C1C] text-[#F5F0E8] shadow-[0_8px_20px_rgba(139,26,26,0.3)]"
                  : "border-[#C9A84C]/40 bg-white text-[#737955] hover:border-[#92791B] hover:bg-[#FDFBF7] hover:text-[#1C1C1C] hover:shadow-[0_4px_12px_rgba(146,121,27,0.1)]"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {sections
              .filter((section) => section.key === activeTab)
              .map((section) => (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-8 flex items-center justify-center gap-4 text-center">
                    <span className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#C9A84C]" />
                    <h2 className="font-serif text-3xl font-bold text-[#8B1A1A] md:text-4xl">
                      {section.title}
                    </h2>
                    <span className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#C9A84C]" />
                  </div>

                  {section.members.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-[#C9A84C]/60 bg-white p-12 text-center text-lg italic text-[#737955] shadow-sm">
                      {section.key === "current-team"
                        ? "The current team will be introduced here soon."
                        : "We’re adding names and memories to this part of the archive."}
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 md:gap-6"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                    >
                      {section.members.map((member, index) => (
                        <Fragment key={`member-group-${member.id}`}>
                          {section.key === "past-teams" &&
                            (index === 0 ||
                              section.members[index - 1].year !==
                                member.year) && (
                              <h3 className="col-span-full mt-5 border-b border-[#C9A84C]/40 pb-2 font-serif text-xl font-bold text-[#8B1A1A]">
                                {member.year ?? "Earlier years"}
                              </h3>
                            )}
                          <motion.button
                            type="button"
                            onClick={() => setSelectedMember(member)}
                            variants={cardItem}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative w-full text-left"
                          >
                            <div className="relative overflow-hidden rounded-[20px] bg-white p-2.5 border-2 border-[#C9A84C]/20 shadow-[0_4px_12px_rgba(201,168,76,0.08)] transition-all duration-300 group-hover:border-[#92791B] group-hover:shadow-[0_15px_35px_rgba(146,121,27,0.2)]">
                              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#E8DDCB] relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-20 transition-opacity duration-300" />
                                <img
                                  src={member.photoUrl}
                                  alt={member.name}
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  loading="lazy"
                                />
                              </div>
                              <div className="pt-4 pb-2 px-1 relative z-20">
                                <p className="line-clamp-1 font-serif text-lg font-bold text-[#1C1C1C] group-hover:text-[#8B1A1A] transition-colors">
                                  {member.name}
                                </p>
                                <p className="mt-1 line-clamp-1 text-[11px] font-bold uppercase tracking-widest text-[#737955]">
                                  {member.designation}
                                  {member.year ? ` · ${member.year}` : ""}
                                </p>
                                {member.tags.length > 0 && (
                                  <p className="mt-2 line-clamp-1 text-[10px] font-semibold text-[#8B1A1A]">
                                    {member.tags
                                      .map(
                                        (tag) =>
                                          tag[0].toUpperCase() + tag.slice(1),
                                      )
                                      .join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        </Fragment>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event: React.MouseEvent) => event.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-[#B8860B] bg-[#1C1C1C] p-6 text-[#F5F0E8] shadow-[0_0_40px_6px_rgba(184,134,11,0.2),0_25px_60px_rgba(0,0,0,0.5)] md:p-8"
            >
              {/* Rangoli corner ornaments */}
              <RangoliCorner position="top-left" />
              <RangoliCorner position="top-right" />
              <RangoliCorner position="bottom-left" />
              <RangoliCorner position="bottom-right" />

              {/* Close button – circle icon */}
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C9A84C]/60 bg-[#2A2119] text-[#C9A84C] transition-all duration-200 hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#1C1C1C] hover:shadow-[0_0_12px_rgba(201,168,76,0.4)]"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>

              <div className="relative z-10 grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-7">
                {/* Larger photo */}
                <div className="overflow-hidden rounded-xl border-2 border-[#C9A84C]/40 bg-[#120D0A]">
                  <img
                    src={selectedMember.photoUrl}
                    alt={selectedMember.name}
                    className="aspect-square h-full w-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">
                    {selectedMember.tags
                      .map((tag) => tag[0].toUpperCase() + tag.slice(1))
                      .join(" · ")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold md:text-3xl">
                    {selectedMember.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#C9A84C]/80">
                    {selectedMember.designation}
                    {selectedMember.year ? ` · ${selectedMember.year}` : ""}
                  </p>
                  <div className="my-4 h-[1px] w-12 bg-[#C9A84C]/40" />
                  <p className="text-sm leading-7 text-[#F5F0E8]/88">
                    {selectedMember.bio}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
