"use client";

import { useEffect, useState } from "react";

type RecruitmentCtaToggleProps = {
  variant?: "card" | "compact";
};

export default function RecruitmentCtaToggle({
  variant = "card",
}: RecruitmentCtaToggleProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/recruitment-status")
      .then((response) => response.json())
      .then((data) => setIsOpen(Boolean(data.isOpen)))
      .catch(() => setIsOpen(true));
  }, []);

  const handleToggle = async () => {
    if (isOpen === null || isSaving) {
      return;
    }

    const nextValue = !isOpen;
    setIsSaving(true);

    try {
      const response = await fetch("/api/recruitment-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recruitment status");
      }

      setIsOpen(nextValue);
    } catch (error) {
      console.error("Error updating recruitment CTA status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isOpen === null || isSaving}
        title="Toggle site-wide 'Join Us' / 'Apply Now' buttons on the home page and footer"
        className="btn-cta-toggle"
        style={{
          padding: "10px 22px",
          borderRadius: "999px",
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          // Emerald reads "site buttons live", olive reads "hidden" — both
          // from the Avyakta palette, no new colours.
          color: isOpen ? "var(--av-emerald)" : "var(--av-olive)",
          background: "transparent",
          border: `1px solid ${
            isOpen ? "rgba(27, 94, 59, 0.6)" : "rgba(115, 121, 85, 0.6)"
          }`,
          cursor: isOpen === null || isSaving ? "not-allowed" : "pointer",
          opacity: isOpen === null || isSaving ? 0.6 : 1,
        }}
      >
        {isOpen === null || isSaving
          ? "Loading..."
          : isOpen
            ? "Site Buttons: On"
            : "Site Buttons: Off"}
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Recruitment Buttons (Site-wide)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Controls the &quot;Join Us&quot; / &quot;Apply Now&quot; buttons on
            the home page and footer. When off, visitors clicking them see a
            &quot;We&apos;re not recruiting right now&quot; page instead of the
            application form.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isOpen === null || isSaving}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white transition ${
            isOpen
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          } ${isOpen === null || isSaving ? "cursor-not-allowed opacity-75" : ""}`}
          aria-label="Toggle site-wide recruitment buttons"
        >
          {isOpen === null || isSaving ? "…" : isOpen ? "✓" : "◯"}
        </button>
      </div>
    </section>
  );
}
