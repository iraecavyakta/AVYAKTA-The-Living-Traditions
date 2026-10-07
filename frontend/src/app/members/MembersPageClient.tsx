"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  type MemberCard,
  currentTeamRank,
  memberSectionOrder,
  sectionsFor,
} from "@/lib/data/memberSections";

type MembersPageClientProps = {
  initialMembers: MemberCard[];
};

/**
 * Kolam lattice: dots joined by looping diamonds, the floor drawing rather
 * than the lotus rosette the gallery uses. Both are gold line-work so the two
 * pages read as one site, but neither borrows the other's ornament.
 */
function Kolam({ className }: { className?: string }) {
  const points = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      {points.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 100 Q 70 70, 100 34 Q 130 70, 100 100 Z"
            strokeWidth="1.1"
          />
          <path
            d="M100 100 Q 82 82, 100 62 Q 118 82, 100 100 Z"
            strokeWidth="0.7"
          />
          <circle cx="100" cy="26" r="2.4" />
        </g>
      ))}
      <circle
        cx="100"
        cy="100"
        r="86"
        strokeWidth="0.6"
        strokeDasharray="2 7"
      />
      <circle cx="100" cy="100" r="52" strokeWidth="0.9" />
      <circle cx="100" cy="100" r="13" strokeWidth="0.7" />
    </svg>
  );
}

/**
 * Torana arch: a half-round crown on straight shoulders, the temple doorway
 * the whole page is built on. 999px clamps to half the width, so the crown
 * stays a true semicircle at every card size.
 */
/** Soft enough that the card settles rather than snapping back. */
const TILT = { stiffness: 170, damping: 20, mass: 0.6 } as const;

const ARCH = "[border-radius:999px_999px_14px_14px]";
const ARCH_RING = "[border-radius:999px_999px_19px_19px]";

/**
 * A cut-out person needs depth, not a traced line: a hard gold stroke around
 * the silhouette reads as a sticker. drop-shadow follows the alpha mask, so
 * a tight contact shadow plus a wide ambient one sits them on the page
 * instead of outlining them on it. The gold stays in the arch behind.
 */
const CUTOUT_EDGE = [
  "drop-shadow(0 2px 3px rgba(28,23,18,0.2))",
  "drop-shadow(0 14px 24px rgba(28,23,18,0.26))",
].join(" ");

/** Softens the crop at the foot of a cut-out so it dissolves into the page. */
const CUTOUT_FADE = {
  maskImage:
    "linear-gradient(to bottom, #000 74%, rgba(0,0,0,0.6) 88%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to bottom, #000 74%, rgba(0,0,0,0.6) 88%, transparent 100%)",
} as const;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** Stand-in for a member with no photograph on file. */
function Monogram({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pb-[8%]">
      <span className="font-heading text-[3.25rem] font-semibold tracking-[0.08em] text-[#92791B]/65 transition-all duration-700 group-hover:scale-105 group-hover:text-[#8B1A1A] md:text-6xl">
        {initialsOf(name)}
      </span>
    </div>
  );
}

function titleCase(tag: string) {
  return tag
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MembersPageClient({
  initialMembers,
}: MembersPageClientProps) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<MemberCard | null>(null);
  const [activeTab, setActiveTab] = useState<string>(memberSectionOrder[0].key);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  /**
   * Which photographs are background-removed PNGs. A URL cannot say whether
   * an image has an alpha channel, so each one is decoded once into a tiny
   * canvas and its top corners sampled: a cut-out person has nothing there,
   * a photograph has backdrop. This is what lets an ordinary photo_url
   * upload get the free-standing treatment with no schema change. If the
   * host serves no CORS header the read throws, and it stays framed.
   */
  const [cutouts, setCutouts] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 32;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    let cancelled = false;
    const pending: HTMLImageElement[] = [];

    for (const member of initialMembers) {
      if (member.cutoutUrl || !member.hasPhoto) continue;
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (cancelled) return;
        try {
          context.clearRect(0, 0, 24, 32);
          context.drawImage(image, 0, 0, 24, 32);
          const { data } = context.getImageData(0, 0, 24, 32);
          const alphaAt = (x: number, y: number) => data[(y * 24 + x) * 4 + 3];
          if (alphaAt(0, 0) < 24 && alphaAt(23, 0) < 24) {
            setCutouts((current) =>
              current[member.id] ? current : { ...current, [member.id]: true },
            );
          }
        } catch {
          // Tainted canvas. Leave the photo framed in its arch.
        }
      };
      image.src = member.photoUrl;
      pending.push(image);
    }

    return () => {
      cancelled = true;
      for (const image of pending) image.onload = null;
    };
  }, [initialMembers]);

  const sections = useMemo(
    () =>
      memberSectionOrder.map((section) => {
        const members = initialMembers.filter((member) =>
          sectionsFor(member.tags).includes(section.key),
        );
        members.sort((a, b) => {
          if (section.key === "current-team") {
            const rankDiff = currentTeamRank(a) - currentTeamRank(b);
            if (rankDiff) return rankDiff;
          }
          if (section.key === "past-teams" && a.year !== b.year) {
            return (b.year ?? 0) - (a.year ?? 0);
          }
          // Everyone holding the same post stands together, so the two
          // Design Heads are neighbours rather than scattered down the grid
          // by first name.
          const byPost = a.designation.localeCompare(b.designation);
          if (byPost) return byPost;
          return a.name.localeCompare(b.name);
        });
        return { ...section, members };
      }),
    [initialMembers],
  );

  const active = sections.find((section) => section.key === activeTab);

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-[#F3EDE2] text-[#1C1C1C]">
      {/* Warm paper, not the gallery's dark wall: the portraits are the dark
          objects on this page, so the page itself stays light. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 82% 4%, rgba(201,168,76,0.22) 0%, transparent 62%), radial-gradient(45% 32% at 8% 24%, rgba(27,94,59,0.10) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <Kolam className="pointer-events-none absolute -right-[14%] -top-[10%] w-[58vw] max-w-[620px] text-[#92791B] opacity-[0.10]" />

      <div className="relative mx-auto w-full max-w-[1500px] px-5 pb-24 pt-28 lg:px-10 lg:pt-32">
        <header className="border-b border-[#92791B]/25 pb-8">
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-[#92791B]">
            The Collective
          </p>
          <h1 className="mt-4 max-w-4xl font-heading text-[clamp(2.5rem,6.5vw,5.75rem)] font-semibold leading-[0.95]">
            The people are the tradition
          </h1>
        </header>

        {/* Segmented control, deliberately not the gallery's underlined
            text row. */}
        <nav
          aria-label="Choose a group"
          className="mt-8 flex max-w-full gap-0 overflow-x-auto rounded-full border border-[#92791B]/30 bg-[#FBF7EF] p-1 sm:inline-flex sm:max-w-fit [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => {
            const isActive = section.key === activeTab;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveTab(section.key)}
                aria-pressed={isActive}
                className="relative shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 font-body text-xs uppercase tracking-[0.12em] transition-colors sm:px-7"
              >
                {isActive && (
                  <motion.span
                    layoutId="group-pill"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                    className="absolute inset-0 rounded-full bg-[#1C1C1C]"
                    aria-hidden
                  />
                )}
                <span
                  className={`relative ${isActive ? "text-[#F5F0E8]" : "text-[#5E5742] hover:text-[#1C1C1C]"}`}
                >
                  {section.title}
                  <span
                    className={`ml-2 tabular-nums ${isActive ? "text-[#C9A84C]" : "text-[#92791B]/60"}`}
                  >
                    {section.members.length}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            {!active || active.members.length === 0 ? (
              <p className="rounded-[18px] border border-dashed border-[#92791B]/40 px-6 py-24 text-center font-body text-sm text-[#5E5742]">
                {activeTab === "current-team"
                  ? "The current team will be introduced here soon."
                  : "We are still adding names to this part of the archive."}
              </p>
            ) : (
              /* Staggered grid: alternate columns drop, so the row reads as a
                 troupe standing at different depths rather than a filing
                 cabinet. */
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-7 lg:grid-cols-3 xl:grid-cols-4">
                {active.members.map((member, index) => (
                  <Fragment key={member.id}>
                    {active.key === "past-teams" &&
                      (index === 0 ||
                        active.members[index - 1].year !== member.year) && (
                        <h2 className="col-span-full mt-4 flex items-center gap-4 font-heading text-2xl font-semibold text-[#8B1A1A]">
                          {member.year ?? "Earlier years"}
                          <span
                            className="h-px flex-1 bg-[#92791B]/25"
                            aria-hidden
                          />
                        </h2>
                      )}
                    <MemberTile
                      member={member}
                      index={index}
                      reduce={Boolean(reduce)}
                      isCutout={Boolean(member.cutoutUrl || cutouts[member.id])}
                      onOpen={() => setSelected(member)}
                    />
                  </Fragment>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {selected &&
        createPortal(
          <MemberDialog
            member={selected}
            reduce={Boolean(reduce)}
            onClose={() => setSelected(null)}
          />,
          document.body,
        )}
    </main>
  );
}

function MemberTile({
  member,
  index,
  reduce,
  isCutout,
  onOpen,
}: {
  member: MemberCard;
  index: number;
  reduce: boolean;
  isCutout: boolean;
  onOpen: () => void;
}) {
  // Pointer position as motion values, never state: these change on every
  // mouse move and putting them through React would re-render the whole
  // card each frame.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), TILT);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-7, 7]), TILT);
  const glowX = useTransform(pointerX, (value) => `${value * 100}%`);
  const glowY = useTransform(pointerY, (value) => `${value * 100}%`);
  const glow = useMotionTemplate`radial-gradient(42% 34% at ${glowX} ${glowY}, rgba(201,168,76,0.4), transparent 72%)`;

  function trackPointer(event: React.MouseEvent<HTMLButtonElement>) {
    if (reduce) return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width);
    pointerY.set((event.clientY - box.top) / box.height);
  }

  function resetPointer() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onMouseMove={trackPointer}
      onMouseLeave={resetPointer}
      // Mount-driven, not whileInView. The page is a few screens tall and
      // every card is rendered up front, so there is nothing to gain from
      // tying visibility to an observer and a lot to lose: a card whose
      // observer never reports would simply never appear.
      initial={reduce ? false : { opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: Math.min(index % 8, 7) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      // relative + hover z so a cut-out breaking past its arch passes over
      // its neighbours rather than under the ones earlier in the grid.
      className="group relative block w-full text-left outline-none hover:z-20 lg:[&:nth-child(even)]:translate-y-10"
    >
      {/* No panel. The person stands in a torana arch drawn straight on the
          page, so the warm paper is the background and nothing can show
          through the portrait. */}
      <motion.div
        style={
          reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }
        }
        className="relative aspect-[3/4] w-full [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2"
      >
        {/* Light following the cursor, instead of a fixed glow. */}
        <motion.div
          style={reduce ? undefined : { backgroundImage: glow }}
          className="absolute inset-[-12%] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />

        {isCutout ? (
          <>
            {/* Arch as open line-work: the person stands in front of it. */}
            <span
              className={`${ARCH} absolute inset-x-[6%] bottom-0 top-[7%] border border-[#92791B]/35 transition-all duration-700 group-hover:inset-x-[3%] group-hover:border-[#92791B]/70`}
            />
            <span
              className={`${ARCH} absolute inset-x-[13%] bottom-0 top-[15%] border border-dashed border-[#92791B]/20 transition-all duration-700 group-hover:inset-x-[10%]`}
            />
            <img
              src={member.cutoutUrl ?? member.photoUrl}
              alt={member.name}
              loading="lazy"
              decoding="async"
              // drop-shadow follows the alpha channel, so stacking it in four
              // directions traces the silhouette: a gold line around the
              // person themselves rather than around their bounding box.
              // The PNG is cropped at the waist, so its own bottom edge is a
              // hard horizontal line. Fading the last fifth lets the figure
              // settle into the paper instead of ending abruptly. Safe here
              // in a way it was not over the niche: nothing sits behind a
              // cut-out but the page and the arch's side strokes, so there
              // is nothing to show through.
              style={{ filter: CUTOUT_EDGE, ...CUTOUT_FADE }}
              className="absolute inset-x-0 bottom-0 mx-auto h-[108%] w-auto max-w-none translate-z-0 object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-3 group-hover:scale-[1.05]"
            />
          </>
        ) : (
          <>
            {/* Arch as a niche: the photograph is cut to its shape. */}
            <span
              className={`${ARCH_RING} absolute -inset-[7px] border border-[#92791B]/30 transition-all duration-700 group-hover:-inset-[12px] group-hover:border-[#92791B]/65`}
            />
            <div
              className={`${ARCH} absolute inset-0 overflow-hidden bg-[#EFE7D9] ring-1 ring-[#1C1C1C]/10`}
            >
              {member.hasPhoto ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  // Warm desaturation rather than flat grey: the photo sits
                  // in the page's ochre family at rest and comes to full
                  // colour on hover.
                  className="h-full w-full object-cover object-top [filter:grayscale(0.55)_sepia(0.3)_contrast(1.04)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-hover:[filter:none]"
                />
              ) : (
                // Kept light. A near-black niche is right behind a
                // photograph, but a gridful of them with no photographs in
                // reads as a wall of slabs.
                <div className="relative h-full w-full bg-[#EBE2D1]">
                  <Kolam className="absolute left-1/2 top-[16%] w-[112%] -translate-x-1/2 text-[#92791B] opacity-[0.3]" />
                  <Monogram name={member.name} />
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Caption sits on the paper, not on a plate over the portrait. */}
      <div className="mt-6 lg:mt-7">
        <p className="truncate font-heading text-xl font-semibold leading-tight transition-colors duration-500 group-hover:text-[#8B1A1A]">
          {member.name}
        </p>
        <p className="mt-1 truncate font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-[#737955]">
          {member.designation}
          {member.year ? ` · ${member.year}` : ""}
        </p>
        <span
          className="mt-3 block h-px w-9 bg-[#92791B]/45 transition-all duration-500 group-hover:w-20 group-hover:bg-[#8B1A1A]"
          aria-hidden
        />
      </div>
    </motion.button>
  );
}

function MemberDialog({
  member,
  reduce,
  onClose,
}: {
  member: MemberCard;
  reduce: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={member.name}
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[#15120E]/88 p-4 backdrop-blur-sm md:p-10"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="relative grid w-full max-w-3xl overflow-hidden rounded-[20px] bg-[#FBF7EF] md:grid-cols-[260px_minmax(0,1fr)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full border border-[#92791B]/40 bg-[#FBF7EF]/90 text-[#1C1C1C] transition hover:bg-[#1C1C1C] hover:text-[#F5F0E8]"
        >
          ✕
        </button>

        <div className="relative flex items-end justify-center p-5 md:p-6">
          <div className="relative aspect-[3/4] w-full">
            <span
              className={`${ARCH_RING} absolute -inset-[6px] border border-[#92791B]/30`}
              aria-hidden
            />
            {member.cutoutUrl ? (
              <>
                <span
                  className={`${ARCH} absolute inset-0 border border-[#92791B]/25`}
                  aria-hidden
                />
                <img
                  src={member.cutoutUrl}
                  alt={member.name}
                  style={{ filter: CUTOUT_EDGE, ...CUTOUT_FADE }}
                  className="absolute inset-x-0 bottom-0 mx-auto h-[106%] w-auto max-w-none object-contain"
                />
              </>
            ) : (
              <div
                className={`${ARCH} absolute inset-0 overflow-hidden bg-[#EBE2D1]`}
              >
                {member.hasPhoto ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <>
                    <Kolam className="absolute left-1/2 top-[16%] w-[112%] -translate-x-1/2 text-[#92791B] opacity-[0.3]" />
                    <Monogram name={member.name} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="font-body text-[10px] uppercase tracking-[0.22em] text-[#92791B]">
            {member.tags.map(titleCase).join(" · ")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold md:text-4xl">
            {member.name}
          </h2>
          <p className="mt-1 font-body text-sm text-[#737955]">
            {member.designation}
            {member.year ? ` · ${member.year}` : ""}
          </p>
          <span className="my-5 block h-px w-12 bg-[#92791B]/40" aria-hidden />
          <p className="font-body text-sm leading-7 text-[#3A352B]">
            {member.bio}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
