"use client";

import Image from "next/image";

type DashboardPageBackgroundProps = {
  /** Statically imported artwork (Admin_Dash_Img / Domain_Dash_Img) */
  src: string;
  /** 0–1 — how strongly the charcoal veil covers the artwork */
  veil?: number;
};

/**
 * Fixed page artwork shared by the admin and domain dashboards. The veil
 * keeps the ornament readable as texture rather than competing with content.
 */
export default function DashboardPageBackground({
  src,
  veil = 0.74,
}: DashboardPageBackgroundProps) {
  return (
    <div className="admin-bg" aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="admin-bg-art"
      />
      <div
        className="admin-bg-veil"
        style={{
          background: `linear-gradient(160deg, rgba(28,28,28,${veil}) 0%, rgba(28,28,28,${Math.min(
            veil + 0.08,
            0.96,
          )}) 55%, rgba(28,28,28,${veil}) 100%)`,
        }}
      />
      <div className="admin-bg-jaali" />

      <style jsx>{`
        .admin-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background-color: var(--av-charcoal);
        }

        .admin-bg :global(.admin-bg-art) {
          object-fit: cover;
          object-position: center;
        }

        .admin-bg-veil {
          position: absolute;
          inset: 0;
        }

        /* Jaali lattice, barely there */
        .admin-bg-jaali {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image:
            repeating-linear-gradient(
              45deg,
              rgba(201, 168, 76, 0.6) 0,
              rgba(201, 168, 76, 0.6) 1px,
              transparent 1px,
              transparent 16px
            ),
            repeating-linear-gradient(
              -45deg,
              rgba(201, 168, 76, 0.6) 0,
              rgba(201, 168, 76, 0.6) 1px,
              transparent 1px,
              transparent 16px
            );
        }
      `}</style>
    </div>
  );
}
