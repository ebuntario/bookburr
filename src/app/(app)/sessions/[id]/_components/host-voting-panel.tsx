"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildVotingOpenCard } from "@/lib/share-utils";
import { ConfirmSessionSheet } from "./confirm-session-sheet";
import type { ConfirmableVenue, ConfirmableDateOption } from "./types";

interface HostVotingPanelProps {
  sessionId: string;
  sessionName: string;
  venueCount: number;
  shareUrl: string;
  dates: ConfirmableDateOption[];
  venues: ConfirmableVenue[];
  loading: boolean;
  error: string | null;
}

export function HostVotingPanel({
  sessionId,
  sessionName,
  venueCount,
  shareUrl,
  dates,
  venues,
  loading,
  error,
}: HostVotingPanelProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVotingBanner, setShowVotingBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !sessionStorage.getItem(`bookburr-voting-share-${sessionId}`);
    } catch {
      return true;
    }
  });

  const votingShareUrl = buildVotingOpenCard({
    sessionName,
    venueCount,
    shareUrl,
  });

  const dismissVotingBanner = () => {
    setShowVotingBanner(false);
    try {
      sessionStorage.setItem(`bookburr-voting-share-${sessionId}`, "1");
    } catch {
      // ignore
    }
  };

  return (
    <>
      {showVotingBanner && (
        <div className="rounded-2xl border border-teal/20 bg-teal/5 px-4 py-3 flex items-center gap-3">
          <a
            href={votingShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm font-medium text-foreground"
          >
            Share voting ke grup WhatsApp
          </a>
          <button
            type="button"
            onClick={dismissVotingBanner}
            className="text-xs text-foreground/40"
          >
            Tutup
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground/50">Lu yang pegang kendali nih</p>
        {error && <p className="text-xs text-coral">{error}</p>}
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-50"
        >
          Confirm Venue 🎉
        </button>
      </div>

      {showConfirm && (
        <ConfirmSessionSheet
          sessionId={sessionId}
          sessionName={sessionName}
          dates={dates}
          venues={venues}
          onClose={() => setShowConfirm(false)}
          onConfirmed={() => {
            setShowConfirm(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
