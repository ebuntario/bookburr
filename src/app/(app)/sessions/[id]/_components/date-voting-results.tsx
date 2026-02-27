"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateDateVotes } from "@/lib/actions/date-votes";
import { PREFERENCE_LEVEL } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { DateScoreBadge } from "./date-score-badge";

const PREFERENCE_LEVELS: PreferenceLevel[] = [
  PREFERENCE_LEVEL.strongly_prefer,
  PREFERENCE_LEVEL.can_do,
  PREFERENCE_LEVEL.unavailable,
];

const PILL_CONFIG: Record<
  PreferenceLevel,
  { label: string; selected: string; unselected: string }
> = {
  [PREFERENCE_LEVEL.strongly_prefer]: {
    label: "Bisa banget!",
    selected: "bg-gold text-white border-gold",
    unselected: "border-foreground/20 text-foreground/60",
  },
  [PREFERENCE_LEVEL.can_do]: {
    label: "Bisa",
    selected: "bg-teal text-white border-teal",
    unselected: "border-foreground/20 text-foreground/60",
  },
  [PREFERENCE_LEVEL.unavailable]: {
    label: "Ga bisa",
    selected: "bg-coral text-white border-coral",
    unselected: "border-foreground/20 text-foreground/60",
  },
};

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface DateWithVotes {
  id: string;
  date: string;
  stronglyPrefer: number;
  canDo: number;
  unavailable: number;
  dateScore: number;
  myVote: string | null;
}

interface DateVotingResultsProps {
  sessionId: string;
  memberId: string;
  dates: DateWithVotes[];
  totalMembers: number;
  votedMemberCount: number;
  status: string;
}

export function DateVotingResults({
  sessionId,
  dates: initialDates,
  totalMembers,
  votedMemberCount,
  status,
}: DateVotingResultsProps) {
  const [localVotes, setLocalVotes] = useState<
    Record<string, PreferenceLevel | null>
  >(() =>
    Object.fromEntries(
      initialDates.map((d) => [d.id, d.myVote as PreferenceLevel | null]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successDateId, setSuccessDateId] = useState<string | null>(null);

  const canEdit = status === "collecting" || status === "discovering";

  // Sort: date ASC during collecting/discovering, dateScore DESC otherwise
  const sorted = [...initialDates].sort((a, b) =>
    canEdit ? a.date.localeCompare(b.date) : b.dateScore - a.dateScore,
  );

  const threshold50 =
    totalMembers > 0 && votedMemberCount / totalMembers >= 0.5;

  const handleVote = async (dateId: string, level: PreferenceLevel) => {
    if (!canEdit || submitting) return;

    const prev = localVotes[dateId];
    const next = prev === level ? null : level;

    // Optimistic update
    const newLocalVotes = { ...localVotes, [dateId]: next };
    setLocalVotes(newLocalVotes);
    setError(null);
    setSubmitting(true);

    const votes = Object.entries(newLocalVotes)
      .filter(([, v]) => v !== null)
      .map(([dateOptionId, preferenceLevel]) => ({
        dateOptionId,
        preferenceLevel: preferenceLevel as PreferenceLevel,
      }));

    const result = await updateDateVotes({ sessionId, votes });
    setSubmitting(false);

    if (!result.ok) {
      // Revert on failure
      setLocalVotes((v) => ({ ...v, [dateId]: prev }));
      setError(result.error);
    } else {
      setSuccessDateId(dateId);
      setTimeout(() => setSuccessDateId(null), 300);
    }
  };

  if (initialDates.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/60">Tanggal</h3>
        <p className="text-xs text-foreground/40">
          {votedMemberCount}/{totalMembers} udah vote
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((d, i) => {
          const total = d.stronglyPrefer + d.canDo + d.unavailable;
          const myVote = localVotes[d.id];
          const isSuccess = successDateId === d.id;

          return (
            <div
              key={d.id}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3"
            >
              {/* Date label + best-date badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {formatDate(d.date)}
                </p>
                {threshold50 && i === 0 && <DateScoreBadge />}
              </div>

              {/* Stacked bar */}
              {total > 0 && (
                <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
                  {d.stronglyPrefer > 0 && (
                    <motion.div
                      className="h-full rounded-full bg-gold"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(d.stronglyPrefer / total) * 100}%`,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ minWidth: 4 }}
                    />
                  )}
                  {d.canDo > 0 && (
                    <motion.div
                      className="h-full rounded-full bg-teal"
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.canDo / total) * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ minWidth: 4 }}
                    />
                  )}
                  {d.unavailable > 0 && (
                    <motion.div
                      className="h-full rounded-full bg-coral"
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.unavailable / total) * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ minWidth: 4 }}
                    />
                  )}
                </div>
              )}

              {/* Vote count text */}
              {total > 0 && (
                <p className="text-xs text-foreground/50">
                  <span className="text-gold">{d.stronglyPrefer} bisa banget</span>
                  {" · "}
                  <span className="text-teal">{d.canDo} bisa</span>
                  {" · "}
                  <span className="text-coral">{d.unavailable} gabisa</span>
                </p>
              )}

              {/* Editable vote pills */}
              {canEdit && (
                <div className="flex gap-2">
                  {PREFERENCE_LEVELS.map((level) => {
                    const config = PILL_CONFIG[level];
                    const isSelected = myVote === level;
                    return (
                      <motion.button
                        key={level}
                        type="button"
                        onClick={() => handleVote(d.id, level)}
                        animate={
                          isSuccess && isSelected
                            ? { scale: [1, 1.1, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.2 }}
                        disabled={submitting}
                        className={[
                          "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all disabled:opacity-60",
                          isSelected ? config.selected : config.unselected,
                        ].join(" ")}
                      >
                        {config.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Read-only vote display when locked */}
              {!canEdit && myVote && (
                <p className="text-xs text-foreground/50">
                  Pilihan lu:{" "}
                  <span
                    className={
                      myVote === PREFERENCE_LEVEL.strongly_prefer
                        ? "font-medium text-gold"
                        : myVote === PREFERENCE_LEVEL.can_do
                          ? "font-medium text-teal"
                          : "font-medium text-coral"
                    }
                  >
                    {PILL_CONFIG[myVote as PreferenceLevel]?.label}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
