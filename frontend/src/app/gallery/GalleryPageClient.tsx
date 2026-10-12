"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { GalleryEvent, GalleryImage } from "@/lib/data/gallery";

type GalleryPageClientProps = {
  initialEvents: GalleryEvent[];
};

const PAGE_SIZE = 18;
const ALL = "all";
const GAP = 12;
/** Shape assumed for a photo whose real dimensions have not arrived yet. */
const FALLBACK_RATIO = 1.5;

/** A photo plus the event it belongs to, so the "All" wall can caption itself. */
type Tile = GalleryImage & { eventId: string; eventName: string };

/**
 * FNV-1a over the tail of the photo URL. The "All moments" wall is sorted by
 * this, so the order is a pure function of the data: the same on the server,
 * on the client, and on every later visit. A Math.random() shuffle would
 * reshuffle on every render and break hydration.
 *
 * Keyed on the URL rather than the photo id because the id is positional
 * (`<eventId>-<n>`): uploading one new photo would renumber everything after
 * it and reshuffle the whole event. The URL belongs to the photo itself, so
 * existing photos keep their place when new ones arrive. Only the tail is
 * hashed because a photo may be stored as a base64 data URI, and hashing
 * megabytes per tile on every render would be real work for no benefit.
 */
function shuffleKey(url: string) {
  const sample = url.slice(-96);
  let hash = 2166136261;
  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type Row = {
  items: { tile: Tile; index: number; width: number }[];
  height: number;
};

/**
 * Justified rows, the layout every serious photo wall uses. Photos are taken
 * in order until they overflow the container at the target height, then the
 * row is scaled so it fills the width exactly. Each photo's width is its own
 * aspect ratio times the row height, so widths vary with the real shape of
 * the picture and nothing is ever cropped. A column masonry cannot do this:
 * there every photo is stuck at the column width.
 */
function buildRows(
  tiles: Tile[],
  ratioOf: (tile: Tile) => number,
  containerWidth: number,
  targetHeight: number,
): Row[] {
  const rows: Row[] = [];
  let current: { tile: Tile; index: number; ratio: number }[] = [];
  let ratioSum = 0;

  const close = (isLast: boolean) => {
    if (!current.length) return;
    const available = containerWidth - GAP * (current.length - 1);
    // The last row keeps the target height rather than stretching a lone
    // photo across the whole wall.
    const height = isLast
      ? Math.min(targetHeight, available / ratioSum)
      : available / ratioSum;
    rows.push({
      items: current.map((entry) => ({
        tile: entry.tile,
        index: entry.index,
        width: entry.ratio * height,
      })),
      height,
    });
    current = [];
    ratioSum = 0;
  };

  tiles.forEach((tile, index) => {
    const ratio = ratioOf(tile);
    current.push({ tile, index, ratio });
    ratioSum += ratio;
    const projected = ratioSum * targetHeight + GAP * (current.length - 1);
    if (projected >= containerWidth) close(false);
  });
  close(true);

  return rows;
}

/**
 * Lotus mandala in gold line-work, matching the vocabulary already used on
 * the home and history pages: concentric rings plus petals repeated around
 * the centre. Rotational symmetry means one petal path drawn once and turned,
 * rather than a traced illustration.
 */
const PETAL_RINGS = [
  { count: 12, radius: 196, offset: 0, width: 1.15, nested: true },
  { count: 12, radius: 138, offset: 15, width: 0.9, nested: true },
  { count: 8, radius: 84, offset: 0, width: 0.75, nested: false },
];

/** One lotus petal, tip pointing up from the centre of a 400x400 box. */
function petalPath(radius: number) {
  const tip = 200 - radius;
  const waist = radius * 0.3;
  return [
    `M200 200`,
    `C ${200 - waist} ${200 - radius * 0.45}, ${200 - waist} ${tip + radius * 0.18}, 200 ${tip}`,
    `C ${200 + waist} ${tip + radius * 0.18}, ${200 + waist} ${200 - radius * 0.45}, 200 200`,
    `Z`,
  ].join(" ");
}

function Mandala({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      stroke="#C9A84C"
      aria-hidden
    >
      {PETAL_RINGS.map((ring) =>
        Array.from({ length: ring.count }, (_, petal) => (
          <g
            key={`${ring.radius}-${petal}`}
            transform={`rotate(${ring.offset + (360 / ring.count) * petal} 200 200)`}
          >
            <path d={petalPath(ring.radius)} strokeWidth={ring.width} />
            {ring.nested && (
              <path
                d={petalPath(ring.radius * 0.58)}
                strokeWidth={ring.width * 0.6}
              />
            )}
          </g>
        )),
      )}
      {[188, 150, 112, 74, 40, 18].map((radius, index) => (
        <circle
          key={radius}
          cx="200"
          cy="200"
          r={radius}
          strokeWidth={index % 2 ? 0.5 : 0.8}
          strokeDasharray={index % 3 === 1 ? "3 5" : undefined}
        />
      ))}
    </svg>
  );
}

/** Brand jaali lattice, revealed on hover over a photograph. */
function JaaliOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(201,168,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.12) 1px, transparent 1px)",
        backgroundSize: "14px 14px, 14px 14px",
      }}
      aria-hidden
    />
  );
}

export default function GalleryPageClient({
  initialEvents,
}: GalleryPageClientProps) {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Photo URLs that failed to load. A dead record in the events table would
  // otherwise leave an empty charcoal box sitting in the middle of the wall.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  // Real aspect ratios, read off each image once it decodes. The events table
  // stores URLs but no dimensions, so this is the only place they exist.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  // Starts at a sensible desktop width so the server HTML and the first client
  // render agree; the observer corrects it immediately after mount.
  const [wallWidth, setWallWidth] = useState(1200);
  // Photos that have come into view and developed. Until the observer is
  // actually running, `armed` stays false and every photo renders plain, so
  // the server HTML and a client where this never starts both show the wall
  // rather than 117 invisible boxes.
  // How far down the wall has developed. The wall reads top to bottom, so a
  // high-water mark is enough and is also the safety property: nothing above
  // the furthest photo reached can be left hidden. Tracking a set of ids
  // instead would strand any tile the observer skipped, and it skips plenty
  // when a photo crosses the viewport between two samples during a fast
  // scroll. null means the observer has not reported yet.
  const [revealedThrough, setRevealedThrough] = useState<number | null>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tileNodes = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const element = wallRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWallWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * A hidden tab reports nothing as intersecting, and returning to it does
   * not always produce a fresh report, which would leave the wall blank on
   * arrival. Counting wake-ups rebuilds the observer, and a new observer
   * always reports on everything it is given.
   */
  const [wakeups, setWakeups] = useState(0);
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) setWakeups((count) => count + 1);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /**
   * Develops each photo as it scrolls into view. The observer is rebuilt
   * whenever the rendered set changes, and rebuilding re-evaluates every
   * tile immediately, so a photo can never be left stranded unrevealed the
   * way a one-shot per-element observer can.
   */
  useEffect(() => {
    if (reduce || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        let furthest = -1;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-index"));
          if (Number.isInteger(index)) furthest = Math.max(furthest, index);
        }
        // The first report arms the reveal, which is what puts the photos
        // still below the fold into their waiting state.
        setRevealedThrough((current) =>
          current === null ? furthest : Math.max(current, furthest),
        );
      },
      // Starts just before the photo clears the bottom edge, so it has
      // finished developing by the time it is properly on screen.
      { rootMargin: "0px 0px -4% 0px" },
    );

    for (const node of tileNodes.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [reduce, visibleCount, activeId, wakeups]);

  /** Records a photo's real shape, ignoring anything not decoded yet. */
  const measure = useCallback(
    (id: string, element: HTMLImageElement | null) => {
      if (!element?.complete || !element.naturalHeight) return;
      const ratio = element.naturalWidth / element.naturalHeight;
      setRatios((current) =>
        current[id] === ratio ? current : { ...current, [id]: ratio },
      );
    },
    [],
  );

  const allTiles: Tile[] = useMemo(
    () =>
      initialEvents.flatMap((event) =>
        event.images.map((image) => ({
          ...image,
          eventId: event.id,
          eventName: event.name,
        })),
      ),
    [initialEvents],
  );

  /**
   * Stratified interleave, not a flat shuffle. Each event's photos are first
   * shuffled among themselves, then given a position spread evenly across
   * the whole wall, so events alternate all the way down instead of landing
   * in clumps. A flat shuffle is statistically random but reads badly: five
   * stage shots in a row then five daylight ones is exactly the clumping it
   * was meant to avoid.
   */
  const shuffledTiles = useMemo(() => {
    const byEvent = new Map<string, Tile[]>();
    for (const tile of allTiles) {
      const list = byEvent.get(tile.eventId) ?? [];
      list.push(tile);
      byEvent.set(tile.eventId, list);
    }

    const ranked: { tile: Tile; key: number; position: number }[] = [];
    for (const list of byEvent.values()) {
      const shuffled = list
        .map((tile) => ({ tile, key: shuffleKey(tile.url) }))
        .sort((a, b) => a.key - b.key);
      shuffled.forEach((entry, index) => {
        ranked.push({ ...entry, position: (index + 0.5) / shuffled.length });
      });
    }

    return ranked
      .sort((a, b) => a.position - b.position || a.key - b.key)
      .map((entry) => entry.tile);
  }, [allTiles]);

  const tiles = useMemo(() => {
    const source = activeId === ALL ? shuffledTiles : allTiles;
    return source.filter(
      (tile) =>
        !broken.has(tile.id) && (activeId === ALL || tile.eventId === activeId),
    );
  }, [activeId, allTiles, shuffledTiles, broken]);

  const counts = useMemo(() => {
    const byEvent = new Map<string, number>();
    for (const tile of allTiles) {
      if (broken.has(tile.id)) continue;
      byEvent.set(tile.eventId, (byEvent.get(tile.eventId) ?? 0) + 1);
    }
    return byEvent;
  }, [allTiles, broken]);

  const total = allTiles.length - broken.size;
  const selected = lightboxIndex === null ? null : tiles[lightboxIndex];

  const rows = useMemo(() => {
    const targetHeight = wallWidth < 640 ? 170 : wallWidth < 1100 ? 250 : 330;
    return buildRows(
      tiles.slice(0, visibleCount),
      (tile) => ratios[tile.id] ?? FALLBACK_RATIO,
      wallWidth,
      targetHeight,
    );
  }, [tiles, visibleCount, ratios, wallWidth]);

  const entries = [
    { id: ALL, name: "All moments", count: total },
    ...initialEvents.map((event) => ({
      id: event.id,
      name: event.name,
      count: counts.get(event.id) ?? 0,
    })),
  ];

  function selectEvent(id: string) {
    setActiveId(id);
    setVisibleCount(PAGE_SIZE);
    setLightboxIndex(null);
    // A new wall develops again rather than appearing already finished.
    setRevealedThrough(-1);
  }

  /**
   * The wall extends itself as you reach the foot of it. Re-running on
   * visibleCount matters: reconnecting the observer re-evaluates intersection
   * straight away, so a batch too short to push the sentinel out of view
   * still triggers the next one instead of stalling.
   */
  useEffect(() => {
    if (visibleCount >= tiles.length) return;
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, tiles.length));
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visibleCount, tiles.length]);

  // Keyboard navigation plus a scroll lock, so the page behind the lightbox
  // does not drift while the viewer pages through photographs.
  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function step(delta: number) {
      setLightboxIndex((current) => {
        if (current === null) return current;
        return (current + delta + tiles.length) % tiles.length;
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex, tiles.length]);

  if (!initialEvents.length) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#121110] px-6 py-32 text-[#F5F0E8]">
        <div className="max-w-md rounded-[10px] border border-[#C9A84C]/30 bg-[#1C1A17] p-10 text-center">
          <h1 className="font-heading text-3xl font-semibold text-[#C9A84C]">
            The gallery is being hung
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#F5F0E8]/65">
            Photographs from our events are still being curated. Please check
            back shortly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-[100dvh] overflow-x-clip text-[#F5F0E8]"
      style={{
        // Brand emerald pulled right down so photographs still carry the
        // page, warming to gold at the top where the title sits.
        background:
          "radial-gradient(75% 48% at 24% 0%, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.028) 46%, transparent 72%), linear-gradient(180deg, #0F160A 0%, #0C1209 20%, #0A0D09 52%, #090B08 100%)",
      }}
    >
      {/* Mandala bookends. The ornament frames the opening and the close of
          the archive and is masked away in between, so the wall itself is
          never competing with pattern behind it. Both wrappers clip, so the
          rosettes can hang off the edge without widening the page. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, #000 42%, transparent 97%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 42%, transparent 97%)",
        }}
        aria-hidden
      >
        <Mandala className="absolute -left-[16%] -top-[22%] w-[92vw] opacity-[0.11] md:-top-[26%] md:w-[64vw] md:max-w-[780px]" />
        <Mandala className="absolute -right-[14%] top-[3%] w-[52vw] opacity-[0.07] md:-right-[9%] md:top-[4%] md:w-[34vw] md:max-w-[430px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[560px] overflow-hidden"
        style={{
          maskImage: "linear-gradient(to top, #000 38%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, #000 38%, transparent 95%)",
        }}
        aria-hidden
      >
        <Mandala className="absolute -right-[13%] -bottom-[32%] w-[52vw] max-w-[640px] opacity-[0.09]" />
      </div>

      {/* Grain. Fixed and pointer-events-none so it never repaints with the
          scrolling wall. */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div className="relative z-[2] mx-auto w-full max-w-[1760px] px-5 pb-24 pt-28 lg:px-10 lg:pt-32">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.3em] text-[#C9A84C]">
              Avyakta Archive
            </p>
            <h1 className="mt-4 font-heading text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.95] text-[#F5F0E8]">
              Every frame we kept
            </h1>
          </div>
          <div className="flex items-baseline gap-3 md:pb-3">
            <span className="font-heading text-5xl leading-none text-[#C9A84C]">
              {total}
            </span>
            <span className="font-body text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/50">
              photographs
              <br />
              {initialEvents.length} events
            </span>
          </div>
        </header>

        {/* Typographic filter, not a bar: no panel, no pill chrome, nothing
            sticky. It sits on the header's hairline and leaves the wall the
            full width of the page. */}
        <nav
          aria-label="Filter photographs by event"
          className="-mx-5 mt-8 flex gap-7 overflow-x-auto border-t border-[#C9A84C]/20 px-5 pt-5 lg:-mx-10 lg:gap-10 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {entries.map((entry) => {
            const isActive = entry.id === activeId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => selectEvent(entry.id)}
                aria-pressed={isActive}
                className="group relative shrink-0 whitespace-nowrap pb-3 outline-none"
              >
                <span
                  className={`font-body text-sm transition-colors md:text-base ${
                    isActive
                      ? "text-[#F5F0E8]"
                      : "text-[#F5F0E8]/40 group-hover:text-[#F5F0E8]/80 group-focus-visible:text-[#F5F0E8]"
                  }`}
                >
                  {entry.name}
                </span>
                <span
                  className={`ml-2 font-body text-[11px] tabular-nums transition-colors ${
                    isActive ? "text-[#C9A84C]" : "text-[#F5F0E8]/25"
                  }`}
                >
                  {entry.count}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="filter-underline"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                    className="absolute inset-x-0 -bottom-px h-[2px] bg-[#C9A84C]"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div ref={wallRef} className="mt-7 min-w-0">
          {tiles.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-[#C9A84C]/30 px-6 py-24 text-center font-body text-sm text-[#F5F0E8]/55">
              No photographs have been added to this event yet.
            </p>
          ) : (
            <>
              <div
                key={activeId}
                className="flex flex-col"
                style={{ gap: GAP }}
              >
                {rows.map((row) => (
                  <div
                    key={row.items[0].tile.id}
                    className="flex"
                    style={{ gap: GAP, height: row.height }}
                  >
                    {row.items.map(({ tile, index, width }, inRow) => {
                      const shown =
                        revealedThrough === null ||
                        reduce ||
                        index <= revealedThrough;
                      return (
                        <motion.button
                          key={tile.id}
                          type="button"
                          onClick={() => setLightboxIndex(index)}
                          data-index={index}
                          ref={(node) => {
                            if (node) tileNodes.current.set(tile.id, node);
                            else tileNodes.current.delete(tile.id);
                          }}
                          // Each photo develops as it scrolls into view: out of
                          // focus and slightly oversized, then settling, with
                          // the row sweeping left to right. Held back only once
                          // the observer is confirmed running, so a photo is
                          // never hidden by an effect that never arrives.
                          initial={false}
                          animate={
                            shown
                              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                              : {
                                  opacity: 0,
                                  scale: 1.05,
                                  filter: "blur(12px)",
                                }
                          }
                          // Developing is animated; being held back is not, so
                          // the tiles below the fold settle into their waiting
                          // state on the first frame instead of fading out.
                          transition={
                            shown
                              ? {
                                  duration: 0.7,
                                  delay: inRow * 0.06,
                                  ease: [0.22, 1, 0.36, 1],
                                }
                              : { duration: 0 }
                          }
                          aria-label={`Open ${tile.name}`}
                          style={{ width }}
                          className="group relative h-full shrink-0 overflow-hidden rounded-[10px] bg-[#1C1A17] outline-none ring-1 ring-inset ring-[#F5F0E8]/5 transition-shadow duration-500 hover:ring-[#C9A84C]/55 focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
                        >
                          <img
                            src={tile.url}
                            alt={tile.name}
                            loading={index < 10 ? "eager" : "lazy"}
                            decoding="async"
                            // Measured two ways on purpose. A cached image can
                            // finish decoding before React hydrates and
                            // attaches onLoad, so that event is missed and the
                            // photo would keep the fallback ratio for good:
                            // on reload the whole wall laid out as if every
                            // photo were 3:2. The ref catches those, onLoad
                            // catches the ones still in flight.
                            ref={(node) => {
                              measure(tile.id, node);
                            }}
                            onLoad={(event) =>
                              measure(tile.id, event.currentTarget)
                            }
                            onError={() =>
                              setBroken((current) =>
                                current.has(tile.id)
                                  ? current
                                  : new Set(current).add(tile.id),
                              )
                            }
                            // The box is built from this photo's own ratio, so
                            // cover and contain agree: nothing is cropped.
                            className="h-full w-full object-cover brightness-[0.9] transition duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:brightness-100"
                          />
                          <JaaliOverlay />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-3 pt-10 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <p className="truncate font-body text-[11px] uppercase tracking-[0.16em] text-[#C9A84C]">
                              {tile.eventName}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* The wall loads itself as this comes into range. */}
              <div ref={sentinelRef} aria-hidden className="h-px w-full" />

              <p
                aria-live="polite"
                className="mt-14 flex items-center gap-5 font-body text-[11px] uppercase tracking-[0.22em] text-[#F5F0E8]/35"
              >
                <span className="h-px flex-1 bg-[#F5F0E8]/10" aria-hidden />
                {visibleCount < tiles.length
                  ? `${visibleCount} of ${tiles.length}`
                  : "End of the archive"}
                <span className="h-px flex-1 bg-[#F5F0E8]/10" aria-hidden />
              </p>
            </>
          )}
        </div>
      </div>

      {/* Portal: the page sits in a z-10 wrapper that would keep this below the navbar. */}
      {selected &&
        createPortal(
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#0B0A09]/95 p-4 backdrop-blur-sm md:p-10"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full border border-[#C9A84C]/45 text-lg text-[#F5F0E8] transition hover:bg-[#C9A84C] hover:text-[#1C1C1C] md:right-8 md:top-8"
              aria-label="Close"
            >
              ✕
            </button>

            <motion.figure
              key={selected.id}
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-full flex-col items-center"
            >
              <img
                src={selected.url}
                alt={selected.name}
                className="max-h-[76vh] w-auto max-w-[90vw] rounded-[10px] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
              />
              <figcaption className="mt-5 flex items-center gap-3 font-body text-xs tracking-[0.14em] text-[#F5F0E8]/70">
                <span className="uppercase text-[#C9A84C]">
                  {selected.eventName}
                </span>
                <span className="h-3 w-px bg-[#C9A84C]/35" aria-hidden />
                <span className="tabular-nums">
                  {(lightboxIndex ?? 0) + 1} of {tiles.length}
                </span>
              </figcaption>
            </motion.figure>

            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-3 md:px-8">
              {[
                { label: "Previous", glyph: "‹", delta: -1 },
                { label: "Next", glyph: "›", delta: 1 },
              ].map((control) => (
                <button
                  key={control.label}
                  type="button"
                  aria-label={control.label}
                  onClick={(event) => {
                    event.stopPropagation();
                    setLightboxIndex((current) =>
                      current === null
                        ? current
                        : (current + control.delta + tiles.length) %
                          tiles.length,
                    );
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[#1C1A17]/80 pb-1 text-2xl text-[#F5F0E8] backdrop-blur transition hover:bg-[#C9A84C] hover:text-[#1C1C1C]"
                >
                  {control.glyph}
                </button>
              ))}
            </div>
          </motion.div>,
          document.body,
        )}
    </main>
  );
}
