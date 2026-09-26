"use client";

import { useEffect, useState } from "react";
import { formatDomainToUrl } from "@/lib/utils/domainFormatter";

type IndicatorBuzzerProps = {
  domain: string;
  initialStatus: boolean;
  mode?: "domain" | "recruitment";
  direction?: "open" | "close";
  disabled?: boolean;
  onUpdated?: (nextStatus: boolean) => void;
};

export default function IndicatorBuzzer({
  domain,
  initialStatus,
  mode = "domain",
  direction = "open",
  disabled = false,
  onUpdated,
}: IndicatorBuzzerProps) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsActive(initialStatus);
  }, [initialStatus]);

  const nextValue = direction === "close" ? false : true;
  const canToggle = direction === "close" ? isActive : !isActive;

  const handleToggle = async () => {
    if (disabled || !canToggle || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response =
        mode === "recruitment"
          ? await fetch("/api/recruitment/indicator", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain, indicator: nextValue }),
            })
          : await fetch(`/api/indicator/${formatDomainToUrl(domain)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ indicator: nextValue }),
            });

      if (!response.ok) {
        throw new Error("Failed to update indicator");
      }

      setIsActive(nextValue);
      onUpdated?.(nextValue);
    } catch (error) {
      console.error("Error updating indicator:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const locked = disabled || !canToggle;

  return (
    <div className="buzzer">
      <div className="buzzer-text">
        <p className="buzzer-domain">{domain}</p>
        <p className={`buzzer-state ${isActive ? "open" : "closed"}`}>
          <span className="state-dot" aria-hidden />
          {isActive ? "Recruitment open" : "Recruitment closed"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={locked || isSaving}
        className={`buzzer-btn ${isActive ? "open" : "closed"}`}
        aria-label={`${domain} indicator toggle`}
        title={direction === "close" ? "Close recruitment" : "Open recruitment"}
      >
        {isSaving ? "..." : isActive ? "Close" : "Closed"}
      </button>

      <style jsx>{`
        .buzzer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid rgba(146, 121, 27, 0.28);
          background: rgba(146, 121, 27, 0.06);
        }

        .buzzer-text {
          min-width: 0;
        }

        .buzzer-domain {
          margin: 0;
          font-family: var(--font-body), sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--av-olive);
        }

        .buzzer-state {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0 0;
          font-family: var(--font-body), sans-serif;
          font-size: 14px;
          font-weight: 500;
        }

        .buzzer-state.open {
          color: var(--av-emerald);
        }

        .buzzer-state.closed {
          color: var(--av-olive);
        }

        .state-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          background: currentColor;
        }

        .buzzer-state.open .state-dot {
          box-shadow: 0 0 0 3px rgba(27, 94, 59, 0.2);
        }

        .buzzer-btn {
          padding: 10px 22px;
          border-radius: 999px;
          background: transparent;
          font-family: var(--font-body), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background-color 0.25s ease,
            color 0.25s ease,
            box-shadow 0.25s ease;
        }

        /* Live recruitment: the button closes it, so it reads destructive. */
        .buzzer-btn.open {
          border: 1px solid rgba(139, 26, 26, 0.6);
          color: var(--av-crimson);
        }

        .buzzer-btn.open:hover:not(:disabled) {
          background: var(--av-crimson);
          color: var(--av-warm);
          box-shadow: 0 6px 20px rgba(139, 26, 26, 0.3);
        }

        /* Already closed: nothing to do from here, so it reads inert. */
        .buzzer-btn.closed {
          border: 1px solid rgba(115, 121, 85, 0.5);
          color: var(--av-olive);
        }

        .buzzer-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .buzzer-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
