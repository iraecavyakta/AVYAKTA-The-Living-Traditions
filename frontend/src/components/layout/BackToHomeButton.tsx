"use client";

import { useState } from "react";

/** Signs the user out, then goes to the public home page. */
export default function BackToHomeButton({
  className = "",
}: {
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Full load so no signed-in page state survives.
      window.location.assign("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#C9A84C]/50 bg-[#1C1C1C]/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#F5F0E8] backdrop-blur-md transition hover:border-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#1C1C1C] disabled:opacity-60 ${className}`}
    >
      {busy ? "Signing out..." : "← Back to Home"}
    </button>
  );
}
