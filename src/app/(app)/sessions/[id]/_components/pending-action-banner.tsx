"use client";

import { useState } from "react";

interface PendingActionBannerProps {
  hasVoted: boolean;
  canEdit: boolean;
}

export function PendingActionBanner({ hasVoted, canEdit }: PendingActionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (hasVoted || !canEdit || dismissed) return null;

  return (
    <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm text-foreground/70">
        Belum vote tanggal nih!{" "}
        <a
          href="#date-section"
          onClick={() => setDismissed(true)}
          className="font-medium text-teal underline underline-offset-2"
        >
          Vote sekarang
        </a>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-xs text-foreground/40"
      >
        Tutup
      </button>
    </div>
  );
}
