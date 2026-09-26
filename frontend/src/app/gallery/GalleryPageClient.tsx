"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { GalleryEvent, GalleryImage } from "@/lib/data/gallery";

type GalleryPageClientProps = {
  initialEvents: GalleryEvent[];
};

const PAGE_SIZE = 8;
const TOP_GRID_SIZE = 32;

// Cycled to give the top showcase grid a mixed-rectangle collage look
// instead of a uniform grid.
const TILE_PATTERN = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
];

type LightboxState = {
  images: GalleryImage[];
  index: number;
};

const sectionReveal = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// Shared pin-and-pan mechanics for a horizontal image wall: a tall spacer
// holds a sticky viewport in place while the track inside slides left by
// exactly however far its content overflows the viewport - measured, not
// guessed, so the pan neither overshoots nor stops short.
function useHorizontalPan(itemCount: number, enabled: boolean) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [maxPanPx, setMaxPanPx] = useState(0);
  const [runwayPx, setRunwayPx] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setMaxPanPx(0);
      setRunwayPx(0);
      return;
    }

    function measure() {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      const pan = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setMaxPanPx(pan);
      // Scroll runway roughly matches the pan distance (~1 scroll px per
      // pan px) plus one viewport height to settle into, so the pace feels
      // consistent regardless of how many images are in the wall.
      setRunwayPx(pan + viewport.clientHeight);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled, itemCount]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxPanPx]);

  return { sectionRef, viewportRef, trackRef, x, runwayPx, scrollYProgress };
}

function JaaliOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(28,28,28,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,28,0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(12,8,5,0.58) 0%, rgba(12,8,5,0.78) 100%)",
        backgroundSize: "12px 12px, 12px 12px, cover",
      }}
      aria-hidden
    />
  );
}

export default function GalleryPageClient({
  initialEvents,
}: GalleryPageClientProps) {
  const [activeEventId, setActiveEventId] = useState(
    initialEvents[0]?.id ?? "",
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [isWideEnoughToPan, setIsWideEnoughToPan] = useState(false);

  // Every uploaded image across every event, for the showcase grid at the
  // top of the page.
  const allImages = useMemo(
    () => initialEvents.flatMap((event) => event.images),
    [initialEvents],
  );
  const topGridImages = useMemo(
    () => allImages.slice(0, TOP_GRID_SIZE),
    [allImages],
  );

  // The horizontal pan only makes sense once there's a wall wider than the
  // viewport to pan across - on narrow screens it just cut images off the
  // edge with no way to reach them, so it's desktop/tablet only.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsWideEnoughToPan(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const topWall = useHorizontalPan(topGridImages.length, isWideEnoughToPan);
  // The wall fades out over the last stretch of its own pin instead of
  // cutting straight to the next section - a soft dissolve rather than a
  // hard scroll-snap handoff.
  const topWallOpacity = useTransform(
    topWall.scrollYProgress,
    [0, 0.82, 1],
    [1, 1, 0],
  );

  function activateEvent(eventId: string) {
    setActiveEventId(eventId);
    setVisibleCount(PAGE_SIZE);
    setLightbox(null);
  }

  const activeEvent = useMemo(
    () =>
      initialEvents.find((event) => event.id === activeEventId) ??
      initialEvents[0],
    [activeEventId, initialEvents],
  );

  const visibleImages = useMemo(
    () => (activeEvent ? activeEvent.images.slice(0, visibleCount) : []),
    [activeEvent, visibleCount],
  );

  // The wall grows as the gallery does: two rows for a small collection,
  // adding rows only once there are enough images to justify them, so it
  // never starts out needlessly tall.
  const wallRows = Math.min(
    4,
    Math.max(2, Math.ceil(topGridImages.length / 10)),
  );

  useEffect(() => {
    if (!lightbox) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightbox(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setLightbox((current) => {
          if (!current) return current;
          return {
            ...current,
            index: (current.index + 1) % current.images.length,
          };
        });
      }

      if (event.key === "ArrowLeft") {
        setLightbox((current) => {
          if (!current) return current;
          return {
            ...current,
            index:
              current.index === 0
                ? current.images.length - 1
                : current.index - 1,
          };
        });
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lightbox]);

  if (!activeEvent) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] px-6 py-20 text-[#1C1C1C]">
        <p className="mx-auto max-w-3xl rounded-xl border border-[#C9A84C]/50 bg-white p-8 text-center">
          Gallery is being curated. Please check back soon.
        </p>
      </main>
    );
  }

  const canLoadMore = visibleCount < activeEvent.images.length;
  const selectedImage = lightbox ? lightbox.images[lightbox.index] : null;

  return (
    <main
      className="min-h-screen text-[#1C1C1C]"
      style={{
        backgroundImage: "url(/images/recruitment/recruit-bg-4.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {topGridImages.length > 0 && (
        // Tall spacer + sticky inner stage: the wall stays pinned in place
        // while you scroll through this section, so the pan reads as pure
        // horizontal motion instead of diagonal (vertical page-scroll and
        // horizontal transform happening at once). Taller than before by
        // adding more rows (4 instead of 2), not by stretching each tile -
        // every tile stays the same size, there's just more of them stacked
        // vertically before the pan flows sideways.
        <section
          ref={topWall.sectionRef}
          className="relative w-full"
          style={
            isWideEnoughToPan
              ? { height: `${topWall.runwayPx || 1}px` }
              : undefined
          }
        >
          <motion.div
            ref={topWall.viewportRef}
            className={`w-full overflow-hidden pt-20 ${isWideEnoughToPan ? "sticky top-0 h-screen flex flex-col justify-center" : ""}`}
            style={{
              opacity: isWideEnoughToPan ? topWallOpacity : 1,
              // Scoped to this box (not the whole page) so it stays static
              // while the section is pinned instead of visibly scrolling
              // underneath the frozen foreground - no backgroundAttachment:
              // "fixed" needed (that forces a repaint every scroll frame).
              backgroundImage: "url(/images/recruitment/recruit-bg-4.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <motion.div
              ref={topWall.trackRef}
              className="grid w-full grid-cols-3 grid-flow-row-dense auto-rows-[110px] gap-3 sm:grid-cols-4 sm:auto-rows-[140px] sm:gap-4 md:w-fit md:grid-cols-none md:grid-flow-col-dense md:auto-cols-[160px]"
              style={{
                x: topWall.x,
                ...(isWideEnoughToPan
                  ? { gridTemplateRows: `repeat(${wallRows}, 160px)` }
                  : null),
              }}
            >
              {topGridImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setLightbox({ images: allImages, index })}
                  className={`group relative block overflow-hidden rounded-md border border-[#F5F0E8]/60 bg-[#EDE3D2] ${TILE_PATTERN[index % TILE_PATTERN.length]}`}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <JaaliOverlay />
                </button>
              ))}
            </motion.div>

            <div
              className={`flex justify-center py-6 ${isWideEnoughToPan ? "absolute inset-x-0 bottom-0" : ""}`}
            >
              <a
                href="#browse-by-event"
                className="rounded-full bg-[#1C1C1C]/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#F5F0E8] backdrop-blur-sm transition hover:bg-[#1C1C1C]/85"
              >
                Browse by Event ↓
              </a>
            </div>
          </motion.div>
        </section>
      )}

      <motion.section
        id="browse-by-event"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={sectionReveal}
        className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[290px_minmax(0,1fr)] md:px-8"
      >
        <aside className="rounded-2xl border border-[#C9A84C]/40 bg-white p-3 shadow-[0_10px_24px_rgba(20,14,10,0.08)]">
          <p className="px-2 pb-2 pt-1 text-xs uppercase tracking-[0.16em] text-[#737955]">
            Events
          </p>
          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {initialEvents.map((event) => {
              const isActive = event.id === activeEvent.id;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => activateEvent(event.id)}
                  className={`group w-full rounded-xl border border-transparent bg-[#F8F3E9] p-2 text-left transition hover:border-[#C9A84C]/45 ${
                    isActive ? "border-[#C9A84C] bg-[#FFF8E7]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-lg">
                      <img
                        src={event.thumbnail}
                        alt={event.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div
                      className={`min-w-0 border-l-4 pl-3 ${isActive ? "border-[#92791B]" : "border-transparent"}`}
                    >
                      <p className="truncate text-sm font-semibold text-[#1C1C1C]">
                        {event.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.08em] text-[#737955]">
                        {event.year}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-[#C9A84C]/40 bg-white p-4 shadow-[0_10px_24px_rgba(20,14,10,0.08)] md:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#92791B] md:text-3xl">
                {activeEvent.name}
              </h2>
              <p className="text-sm text-[#737955]">
                {activeEvent.images.length} images
              </p>
            </div>
          </div>

          {/* Static masonry - this section deliberately does not pin or
              pan; only the wall at the top of the page does. */}
          <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
            {visibleImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setLightbox({ images: activeEvent.images, index })
                }
                className="group relative mb-4 block w-full overflow-hidden rounded-xl border border-[#C9A84C]/40 bg-[#EDE3D2]"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <JaaliOverlay />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/82 to-transparent px-3 pb-3 pt-10 text-left text-xs text-[#F5F0E8] transition-transform duration-300 group-hover:translate-y-0">
                  {image.name}
                </div>
              </button>
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-6 flex justify-center pb-2 pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="rounded-full border border-[#92791B] bg-[#92791B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#7D6918]"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {selectedImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-3 md:p-8">
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 h-10 w-10 rounded-full border border-[#C9A84C] bg-[#1C1C1C] text-[#F5F0E8] transition hover:bg-[#2D2119]"
            aria-label="Close"
          >
            X
          </button>

          <button
            type="button"
            onClick={() =>
              setLightbox((current) => {
                if (!current) return current;
                return {
                  ...current,
                  index:
                    current.index === 0
                      ? current.images.length - 1
                      : current.index - 1,
                };
              })
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-[#C9A84C]/70 bg-[#1C1C1C]/90 px-4 py-2 text-[#F5F0E8]"
            aria-label="Previous"
          >
            ←
          </button>

          <figure className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-xl border border-[#C9A84C]/60 bg-[#121212]">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-h-[82vh] w-auto max-w-[95vw] object-contain"
            />
            <figcaption className="border-t border-[#C9A84C]/40 bg-[#1A1A1A] px-4 py-3 text-sm text-[#F5F0E8]/88">
              {selectedImage.name}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={() =>
              setLightbox((current) => {
                if (!current) return current;
                return {
                  ...current,
                  index: (current.index + 1) % current.images.length,
                };
              })
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[#C9A84C]/70 bg-[#1C1C1C]/90 px-4 py-2 text-[#F5F0E8]"
            aria-label="Next"
          >
            →
          </button>
        </div>
      )}
    </main>
  );
}
