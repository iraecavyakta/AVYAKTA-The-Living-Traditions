"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GalleryEvent, GalleryImage } from "@/lib/data/gallery";

type GalleryPageClientProps = {
  initialEvents: GalleryEvent[];
};

const PAGE_SIZE = 8;
const SHOWCASE_DURATION_SECONDS = 30;

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

  // Every uploaded image across every event, for the showcase grid at the
  // top of the page.
  const allImages = useMemo(
    () => initialEvents.flatMap((event) => event.images),
    [initialEvents],
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
      {allImages.length > 0 && (
        <section
          className="px-4 pb-8 pt-32 md:px-8 md:pt-28"
          aria-label="All event photographs"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 text-[#F5F0E8]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
                  Avyakta memories
                </p>
                <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
                  A celebration in every frame
                </h1>
              </div>
              <a
                href="#browse-by-event"
                className="rounded-full border border-[#C9A84C]/70 bg-[#1C1C1C]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#F5F0E8] backdrop-blur transition hover:bg-[#1C1C1C]/85"
              >
                Browse by event ↓
              </a>
            </div>
            <div className="relative h-[250px] overflow-hidden rounded-2xl border border-[#C9A84C]/55 bg-[#1C1C1C]/55 shadow-[0_18px_55px_rgba(0,0,0,.3)] sm:h-[320px] lg:h-[420px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#1c1c1c]/65 to-transparent sm:w-16" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#1c1c1c]/65 to-transparent sm:w-16" />
              <motion.div
                className="flex h-full w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  duration: SHOWCASE_DURATION_SECONDS,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    className="flex h-full shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
                  >
                    {allImages.map((image, index) => (
                      <button
                        key={`${copy}-${image.id}`}
                        type="button"
                        onClick={() =>
                          setLightbox({ images: allImages, index })
                        }
                        aria-label={`View ${image.name}`}
                        className="group relative my-3 h-[calc(100%-1.5rem)] w-[190px] shrink-0 overflow-hidden rounded-xl border border-[#F5F0E8]/55 bg-[#EDE3D2] sm:my-4 sm:h-[calc(100%-2rem)] sm:w-[250px]"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading={index < 6 ? "eager" : "lazy"}
                        />
                        <JaaliOverlay />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8 text-left text-xs font-semibold text-white">
                          {image.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>
            <p className="mt-3 text-center text-xs text-[#F5F0E8]/70">
              All event photos · Select a frame to view it larger
            </p>
          </div>
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
