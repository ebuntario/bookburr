"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { advanceSessionStatus } from "@/lib/actions/session-status";
import { discoverVenues, retryDiscoverVenues } from "@/lib/actions/venues";
import { copyToClipboard } from "@/lib/share-utils";
import { ConfirmSessionSheet } from "./confirm-session-sheet";

interface Venue {
  id: string;
  name: string;
  compositeScore: number;
}

interface DateOption {
  id: string;
  date: string;
}

interface HostControlsProps {
  sessionId: string;
  status: string;
  memberCount: number;
  venueCount: number;
  shareUrl: string;
  dates: DateOption[];
  venues: Venue[];
}

export function HostControls({
  sessionId,
  status,
  memberCount,
  venueCount,
  shareUrl,
  dates,
  venues,
}: HostControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [discoveryFailed, setDiscoveryFailed] = useState(false);

  if (status === "completed") return null;

  const handleAdvance = async () => {
    setLoading(true);
    setError(null);
    const result = await advanceSessionStatus(sessionId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      router.refresh();
      // Fire venue discovery non-blocking after advancing to "discovering"
      if (status === "collecting") {
        discoverVenues(sessionId).then((r) => {
          if (!r.ok) setDiscoveryFailed(true);
        });
      }
    }
  };

  const handleRetryDiscovery = async () => {
    setDiscoveryFailed(false);
    const result = await retryDiscoverVenues(sessionId);
    if (!result.ok) setDiscoveryFailed(true);
    else router.refresh();
  };

  const handleInvite = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: "Join bukber kita!",
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
      return;
    }
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const renderCTA = (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant: "gold" | "coral" | "ghost" = "gold",
  ) => {
    const variantClass = {
      gold: "bg-gold text-background",
      coral: "bg-coral text-white",
      ghost: "border border-foreground/20 text-foreground/60",
    }[variant];

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground/50">Lu yang pegang kendali nih</p>
        {error && <p className="text-xs text-coral">{error}</p>}
        <button
          type="button"
          onClick={onPress}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-50 ${variantClass}`}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⟳</span>{" "}
              {loadingLabel}
            </>
          ) : (
            label
          )}
        </button>
      </div>
    );
  };

  /* ── Collecting ── */
  if (status === "collecting") {
    if (memberCount < 2) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground/70">
            🙏 Tunggu minimal 1 orang lagi join dulu ya! Abis itu lu bisa mulai
            cari venue.
          </p>
          <button
            type="button"
            onClick={handleInvite}
            className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-2.5 text-sm font-semibold text-foreground"
          >
            {inviteCopied ? "✓ Link tersalin!" : "🔗 Invite Temen"}
          </button>
        </div>
      );
    }
    return renderCTA("Mulai Cari Venue →", "Lagi nyari... 🔍", handleAdvance, "gold");
  }

  /* ── Discovering ── */
  if (status === "discovering") {
    if (discoveryFailed) {
      return (
        <div className="rounded-2xl border border-coral/30 bg-coral/5 px-5 py-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground/70">
            😬 Gagal nyari venue otomatis. Coba lagi?
          </p>
          <button
            type="button"
            onClick={handleRetryDiscovery}
            className="flex items-center justify-center gap-2 rounded-xl border border-coral/30 py-2.5 text-sm font-semibold text-coral"
          >
            🔄 Cari Ulang
          </button>
        </div>
      );
    }
    if (venueCount < 1) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5">
          <p className="text-sm font-medium text-foreground/70">
            🍛 Belum ada venue nih, tambahin dulu ya!
          </p>
        </div>
      );
    }
    return renderCTA("Buka Voting →", "Lagi proses... ⏳", handleAdvance, "gold");
  }

  /* ── Voting ── */
  if (status === "voting") {
    return (
      <>
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

  /* ── Confirmed ── */
  if (status === "confirmed") {
    return renderCTA(
      "Tandai Selesai",
      "Lagi proses...",
      handleAdvance,
      "ghost",
    );
  }

  return null;
}
