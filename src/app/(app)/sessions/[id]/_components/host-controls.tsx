"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { advanceSessionStatus } from "@/lib/actions/session-status";
import { discoverVenues, retryDiscoverVenues } from "@/lib/actions/venues";
import { copyToClipboard } from "@/lib/share-utils";
import { HostCollectingCTA } from "./host-collecting-cta";
import { HostDiscoveringCTA } from "./host-discovering-cta";
import { HostVotingPanel } from "./host-voting-panel";
import { HostConfirmedCTA } from "./host-confirmed-cta";

interface Venue {
  id: string;
  name: string;
  compositeScore: number;
  location?: unknown;
  voteCount: number;
}

interface DateOption {
  id: string;
  date: string;
  dateScore: number;
  stronglyPrefer: number;
  canDo: number;
  unavailable: number;
}

interface HostControlsProps {
  sessionId: string;
  sessionName: string;
  status: string;
  memberCount: number;
  venueCount: number;
  shareUrl: string;
  dates: DateOption[];
  venues: Venue[];
  hasViableDates: boolean;
}

export function HostControls({
  sessionId,
  sessionName,
  status,
  memberCount,
  venueCount,
  shareUrl,
  dates,
  venues,
  hasViableDates,
}: HostControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  if (status === "collecting") {
    return (
      <HostCollectingCTA
        memberCount={memberCount}
        hasViableDates={hasViableDates}
        inviteCopied={inviteCopied}
        onInvite={handleInvite}
        onAdvance={handleAdvance}
        renderCTA={renderCTA}
      />
    );
  }

  if (status === "discovering") {
    return (
      <HostDiscoveringCTA
        discoveryFailed={discoveryFailed}
        venueCount={venueCount}
        onRetryDiscovery={handleRetryDiscovery}
        onAdvance={handleAdvance}
        renderCTA={renderCTA}
      />
    );
  }

  if (status === "voting") {
    return (
      <HostVotingPanel
        sessionId={sessionId}
        sessionName={sessionName}
        venueCount={venueCount}
        shareUrl={shareUrl}
        dates={dates}
        venues={venues}
        loading={loading}
        error={error}
      />
    );
  }

  if (status === "confirmed") {
    return <HostConfirmedCTA onAdvance={handleAdvance} renderCTA={renderCTA} />;
  }

  return null;
}
