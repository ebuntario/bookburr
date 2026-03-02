"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { tapScale } from "@/lib/motion-variants";
import { SESSION_STATUS, SESSION_SHAPE } from "@/lib/constants";
import { advanceSessionStatus } from "@/lib/actions/session-status";
import { discoverVenues, retryDiscoverVenues } from "@/lib/actions/venues";
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
  sessionShape?: string;
  memberCount: number;
  venueCount: number;
  dates: DateOption[];
  venues: Venue[];
  hasViableDates: boolean;
}

export function HostControls({
  sessionId,
  sessionName,
  status,
  sessionShape = SESSION_SHAPE.need_both,
  memberCount,
  venueCount,
  dates,
  venues,
  hasViableDates,
}: HostControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveryFailed, setDiscoveryFailed] = useState(false);

  if (status === SESSION_STATUS.completed) return null;

  const handleAdvance = async () => {
    setLoading(true);
    setError(null);
    const result = await advanceSessionStatus(sessionId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      router.refresh();
      // Only trigger venue discovery for shapes that need it
      if (status === SESSION_STATUS.collecting && sessionShape !== SESSION_SHAPE.venue_known) {
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

  const renderCTA = (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant: "gold" | "coral" | "ghost" = "gold",
  ) => {
    const variantClass = {
      gold: "bg-primary text-background",
      coral: "bg-danger text-white",
      ghost: "border border-foreground/20 text-foreground/60",
    }[variant];

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground/50">Lu yang pegang kendali nih</p>
        {error && <p className="text-xs text-danger">{error}</p>}
        <motion.button
          type="button"
          onClick={onPress}
          disabled={loading}
          whileTap={tapScale}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-opacity disabled:opacity-50 ${variantClass}`}
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />{" "}
              {loadingLabel}
            </>
          ) : (
            label
          )}
        </motion.button>
      </div>
    );
  };

  if (status === SESSION_STATUS.collecting) {
    // For date_known, hasViableDates check is irrelevant
    const effectiveHasViableDates = sessionShape === SESSION_SHAPE.date_known ? true : hasViableDates;
    // For venue_known, the button label changes since we skip discovering
    const advanceLabel = sessionShape === SESSION_SHAPE.venue_known
      ? "Mulai Voting!"
      : "Cari Tempat Bukber!";
    return (
      <HostCollectingCTA
        memberCount={memberCount}
        hasViableDates={effectiveHasViableDates}
        onAdvance={handleAdvance}
        renderCTA={renderCTA}
        advanceLabel={advanceLabel}
      />
    );
  }

  // venue_known sessions skip discovering entirely (transition map handles this)
  if (status === SESSION_STATUS.discovering) {
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

  if (status === SESSION_STATUS.voting) {
    return (
      <HostVotingPanel
        sessionId={sessionId}
        sessionName={sessionName}
        dates={dates}
        venues={venues}
        loading={loading}
        error={error}
      />
    );
  }

  if (status === SESSION_STATUS.confirmed) {
    return <HostConfirmedCTA onAdvance={handleAdvance} renderCTA={renderCTA} />;
  }

  return null;
}
