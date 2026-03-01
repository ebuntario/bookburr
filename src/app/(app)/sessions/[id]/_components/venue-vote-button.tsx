"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { voteForVenue } from "@/lib/actions/venues";
import { tapScale, successPulse, durations } from "@/lib/motion-variants";

interface VenueVoteButtonProps {
  sessionId: string;
  venueId: string;
  voteCount: number;
  isMyVote: boolean;
}

export function VenueVoteButton({
  sessionId,
  venueId,
  voteCount: initialVoteCount,
  isMyVote: initialIsMyVote,
}: VenueVoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isMyVote, setIsMyVote] = useState(initialIsMyVote);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async () => {
    if (submitting) return;
    setSubmitting(true);

    const wasMyVote = isMyVote;

    // Optimistic update
    setIsMyVote(!wasMyVote);
    setVoteCount((c) => c + (wasMyVote ? -1 : 1));

    const result = await voteForVenue({
      sessionId,
      venueId: wasMyVote ? null : venueId,
      isTerserah: false,
    });

    setSubmitting(false);

    if (!result.ok) {
      // Revert
      setIsMyVote(wasMyVote);
      setVoteCount((c) => c + (wasMyVote ? 1 : -1));
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleVote}
      disabled={submitting}
      whileTap={tapScale}
      animate={isMyVote ? successPulse.animate : { scale: 1 }}
      transition={{ duration: durations.normal }}
      className={[
        "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
        isMyVote
          ? "border-gold bg-gold text-background"
          : "border-foreground/20 text-foreground/60",
        submitting && "opacity-60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{isMyVote ? "✓" : "Vote"}</span>
      {voteCount > 0 && (
        <span
          className={
            isMyVote ? "text-background/80" : "text-foreground/40"
          }
        >
          {voteCount}
        </span>
      )}
    </motion.button>
  );
}
