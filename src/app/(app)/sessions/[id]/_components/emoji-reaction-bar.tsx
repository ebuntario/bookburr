"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { reactToVenue } from "@/lib/actions/venues";
import { VENUE_EMOJI } from "@/lib/constants";
import { tapScaleUp } from "@/lib/motion-variants";

const EMOJIS = [
  VENUE_EMOJI.fire,
  VENUE_EMOJI.meh,
  VENUE_EMOJI.expensive,
  VENUE_EMOJI.far,
] as const;

interface EmojiReactionBarProps {
  sessionId: string;
  venueId: string;
  reactions: Record<string, { count: number; hasMyReaction: boolean }>;
  canReact: boolean; // false when status is confirmed/completed
}

export function EmojiReactionBar({
  sessionId,
  venueId,
  reactions: initialReactions,
  canReact,
}: EmojiReactionBarProps) {
  const [localReactions, setLocalReactions] = useState(initialReactions);
  const [errorEmoji, setErrorEmoji] = useState<string | null>(null);

  const handleReact = async (emoji: string) => {
    if (!canReact) return;

    const prev = localReactions[emoji];
    const hadReaction = prev?.hasMyReaction ?? false;
    setErrorEmoji(null);

    // Optimistic update
    setLocalReactions((r) => ({
      ...r,
      [emoji]: {
        count: hadReaction
          ? Math.max(0, (r[emoji]?.count ?? 0) - 1)
          : (r[emoji]?.count ?? 0) + 1,
        hasMyReaction: !hadReaction,
      },
    }));

    const result = await reactToVenue({ sessionId, venueId, emoji });
    if (!result.ok) {
      // Revert
      setLocalReactions((r) => ({
        ...r,
        [emoji]: {
          count: prev?.count ?? 0,
          hasMyReaction: prev?.hasMyReaction ?? false,
        },
      }));
      setErrorEmoji(emoji);
      setTimeout(() => setErrorEmoji(null), 1000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {EMOJIS.map((emoji) => {
        const r = localReactions[emoji];
        const count = r?.count ?? 0;
        const mine = r?.hasMyReaction ?? false;

        return (
          <motion.button
            key={emoji}
            type="button"
            onClick={() => handleReact(emoji)}
            disabled={!canReact}
            whileTap={canReact ? tapScaleUp : undefined}
            className={[
              "flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all",
              errorEmoji === emoji
                ? "border-danger/40 bg-danger/10"
                : mine
                  ? "border-primary/40 bg-primary/10 font-medium"
                  : "border-foreground/10 bg-foreground/5",
              !canReact && "cursor-default",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{emoji}</span>
            <AnimatePresence mode="wait">
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-foreground/60"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
