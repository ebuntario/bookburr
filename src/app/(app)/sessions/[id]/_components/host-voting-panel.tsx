"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ConfirmSessionSheet } from "./confirm-session-sheet";
import type { ConfirmableVenue, ConfirmableDateOption } from "./types";

interface HostVotingPanelProps {
  sessionId: string;
  sessionName: string;
  dates: ConfirmableDateOption[];
  venues: ConfirmableVenue[];
  loading: boolean;
  error: string | null;
}

export function HostVotingPanel({
  sessionId,
  sessionName,
  dates,
  venues,
  loading,
  error,
}: HostVotingPanelProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground/50">Lu yang pegang kendali nih</p>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-white transition-opacity active:opacity-70 disabled:opacity-50"
        >
          <CheckCircleIcon className="h-5 w-5" /> Fix Bukber!
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
