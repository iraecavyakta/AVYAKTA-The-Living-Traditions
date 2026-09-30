"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type DomainTopBarProps = {
  /** Display name of the domain, e.g. "Event Management". */
  domainName: string;
  /** When set, shows a back link pointing at this href. */
  backHref?: string;
  backLabel?: string;
};

/**
 * Slim charcoal bar for the domain-head pages, matching AdminDashboardNav.
 * The recruit detail page has no other way back, so the link lives here.
 */
export default function DomainTopBar({
  domainName,
  backHref,
  backLabel = "Back to dashboard",
}: DomainTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <header className="domain-top-bar">
      <div className="topbar-content">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-name">Avyakta</span>
            <span className="brand-sub">{domainName}</span>
          </div>

          {backHref && (
            <>
              <span className="brand-divider" aria-hidden />
              <Link href={backHref} className="back-link">
                {backLabel}
              </Link>
            </>
          )}
        </div>

        <button type="button" onClick={handleLogout} className="btn-logout">
          Sign Out
        </button>
      </div>

      <div className="topbar-rule" aria-hidden />

      <style jsx>{`
        .domain-top-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(28, 28, 28, 0.96);
          border-bottom: 1px solid rgba(146, 121, 27, 0.55);
        }

        .topbar-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 24px;
          min-width: 0;
        }

        .brand {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
          white-space: nowrap;
        }

        .brand-name {
          font-family: var(--font-heading), serif;
          font-size: 24px;
          letter-spacing: 3px;
          color: var(--av-gold);
        }

        .brand-sub {
          font-family: var(--font-body), sans-serif;
          font-size: 9px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.4);
          margin-top: 2px;
        }

        .brand-divider {
          width: 1px;
          height: 32px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(201, 168, 76, 0.5),
            transparent
          );
        }

        /* next/link renders a custom component, so styled-jsx never adds its
           scoping class to the anchor. Scope through the parent instead. */
        .topbar-left :global(.back-link) {
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid rgba(201, 168, 76, 0.45);
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.75);
          text-decoration: none;
          white-space: nowrap;
          transition:
            color 0.25s ease,
            background-color 0.25s ease;
        }

        .topbar-left :global(.back-link:hover) {
          background: var(--av-gold);
          color: var(--av-charcoal);
        }

        .btn-logout {
          padding: 9px 20px;
          border-radius: 999px;
          background: transparent;
          border: 1px solid rgba(139, 26, 26, 0.7);
          color: rgba(245, 240, 232, 0.85);
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition:
            background-color 0.25s ease,
            color 0.25s ease;
        }

        .btn-logout:hover {
          background: var(--av-crimson);
          color: var(--av-warm);
        }

        .topbar-rule {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(201, 168, 76, 0.55),
            transparent
          );
        }

        @media (max-width: 768px) {
          .topbar-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px;
          }

          .topbar-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .brand-divider {
            display: none;
          }

          .btn-logout {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
