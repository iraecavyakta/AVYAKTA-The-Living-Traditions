"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BackToHomeButton from "../layout/BackToHomeButton";

const links = [
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/registrations", label: "Registrations" },
  { href: "/dashboard/recruitment", label: "Recruitment" },
  { href: "/dashboard/registrants", label: "Registrants" },
];

export default function AdminDashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return (
    <header className="dashboard-top-bar">
      <div className="topbar-content">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-name">Avyakta</span>
            <span className="brand-sub">Admin</span>
          </div>

          <span className="brand-divider" aria-hidden />

          <nav className="topbar-nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-btn ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="topbar-actions">
          <BackToHomeButton />
          <button type="button" onClick={handleLogout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </div>

      <div className="topbar-rule" aria-hidden />

      <style jsx>{`
        .dashboard-top-bar {
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

        .topbar-nav {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* next/link renders a custom component, so styled-jsx never adds its
           scoping class to the <a>. Scope through the parent with :global(). */
        .topbar-nav :global(.nav-btn) {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-family: var(--font-body), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.6);
          text-decoration: none;
          transition:
            color 0.25s ease,
            border-color 0.25s ease,
            background-color 0.25s ease;
        }

        .topbar-nav :global(.nav-btn:hover) {
          color: var(--av-gold);
          border-color: rgba(201, 168, 76, 0.45);
        }

        .topbar-nav :global(.nav-btn.active) {
          color: var(--av-charcoal);
          background: var(--av-gold);
          border-color: var(--av-gold);
          box-shadow: 0 4px 16px rgba(201, 168, 76, 0.28);
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
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

        /* Gold hairline under the bar */
        .topbar-rule {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(201, 168, 76, 0.55),
            transparent
          );
        }

        @media (max-width: 900px) {
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

          .topbar-nav {
            width: 100%;
          }

          .nav-btn {
            flex: 1;
            min-width: 120px;
            text-align: center;
          }

          .topbar-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-logout {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
