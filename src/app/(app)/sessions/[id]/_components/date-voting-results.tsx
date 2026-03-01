"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateDateVotes } from "@/lib/actions/date-votes";
import { voteBarTransition, successPulse, durations } from "@/lib/motion-variants";
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

// ── VoteBar sub-component ──────────────────────────────────────────────────

function VoteBar({ stronglyPrefer, canDo, unavailable }: { stronglyPrefer: number; canDo: number; unavailable: number }) {
  const total = stronglyPrefer + canDo + unavailable;
  if (total === 0) return null;

  const segments = [
    { value: stronglyPrefer, color: "bg-gold" },
    { value: canDo, color: "bg-teal" },
    { value: unavailable, color: "bg-coral" },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
      {segments.map((seg) => (
        <motion.div
          key={seg.color}
          className={`h-full rounded-full ${seg.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(seg.value / total) * 100}%` }}
          transition={voteBarTransition}
          style={{ minWidth: 4 }}
        />
      ))}
    </div>
  );
}

// ── VotePills sub-component ────────────────────────────────────────────────

function VotePills({
  myVote,
  isSuccess,
  submitting,
  onVote,
}: {
  myVote: PreferenceLevel | null;
  isSuccess: boolean;
  submitting: boolean;
  onVote: (level: PreferenceLevel) => void;
}) {
  return (
    <div className="flex gap-2">
      {PREFERENCE_LEVELS.map((level) => {
        const config = PILL_CONFIG[level];
        const isSelected = myVote === level;
        return (
          <motion.button
            key={level}
            type="button"
            onClick={() => onVote(level)}
            animate={
              isSuccess && isSelected
                ? successPulse.animate
                : { scale: 1 }
            }
            transition={{ duration: durations.fast }}
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
  );
}

// ── ReadOnlyVote sub-component ─────────────────────────────────────────────

function ReadOnlyVote({ myVote }: { myVote: PreferenceLevel }) {
  const colorClass =
    myVote === PREFERENCE_LEVEL.strongly_prefer
      ? "font-medium text-gold"
      : myVote === PREFERENCE_LEVEL.can_do
        ? "font-medium text-teal"
        : "font-medium text-coral";

  return (
    <p className="text-xs text-foreground/50">
      Pilihan lu:{" "}
      <span className={colorClass}>
        {PILL_CONFIG[myVote]?.label}
      </span>
    </p>
  );
}

// ── DateRow sub-component ──────────────────────────────────────────────────

function DateRow({
  date,
  myVote,
  isSuccess,
  isBestDate,
  canEdit,
  submitting,
  onVote,
}: {
  date: DateWithVotes;
  myVote: PreferenceLevel | null;
  isSuccess: boolean;
  isBestDate: boolean;
  canEdit: boolean;
  submitting: boolean;
  onVote: (dateId: string, level: PreferenceLevel) => void;
}) {
  const total = date.stronglyPrefer + date.canDo + date.unavailable;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight">
          {formatDate(date.date)}
        </p>
        {isBestDate && <DateScoreBadge />}
      </div>

      <VoteBar
        stronglyPrefer={date.stronglyPrefer}
        canDo={date.canDo}
        unavailable={date.unavailable}
      />

      {total > 0 && (
        <p className="text-xs text-foreground/50">
          <span className="text-gold">{date.stronglyPrefer} bisa banget</span>
          {" · "}
          <span className="text-teal">{date.canDo} bisa</span>
          {" · "}
          <span className="text-coral">{date.unavailable} gabisa</span>
        </p>
      )}

      {canEdit && (
        <VotePills
          myVote={myVote}
          isSuccess={isSuccess}
          submitting={submitting}
          onVote={(level) => onVote(date.id, level)}
        />
      )}

      {!canEdit && myVote && <ReadOnlyVote myVote={myVote} />}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface DateVotingResultsProps {
  sessionId: string;
  memberId: string;
  dates: DateWithVotes[];
  totalMembers: number;
  votedMemberCount: number;
  status: string;
  topVenueName?: string;
}

export function DateVotingResults({
  sessionId,
  dates: initialDates,
  totalMembers,
  votedMemberCount,
  status,
  topVenueName,
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
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !!sessionStorage.getItem(`bookburr-revisit-dates-${sessionId}`);
    } catch {
      return false;
    }
  });

  const showRevisitBanner = status === "discovering" && !bannerDismissed;

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(`bookburr-revisit-dates-${sessionId}`, "1");
    } catch {
      // ignore
    }
  };

  const canEdit = status === "collecting" || status === "discovering";

  const sorted = [...initialDates].sort((a, b) =>
    canEdit ? a.date.localeCompare(b.date) : b.dateScore - a.dateScore,
  );

  const threshold50 =
    totalMembers > 0 && votedMemberCount / totalMembers >= 0.5;

  const handleVote = async (dateId: string, level: PreferenceLevel) => {
    if (!canEdit || submitting) return;

    const prev = localVotes[dateId];
    const next = prev === level ? null : level;

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

      {showRevisitBanner && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground/70">
              Venue udah ketemu! Cek lagi tanggal lu — siapa tau berubah pikiran
              setelah tau tempatnya.
            </p>
            <button
              type="button"
              onClick={dismissBanner}
              className="shrink-0 text-xs text-foreground/40"
            >
              Tutup
            </button>
          </div>
          {topVenueName && (
            <p className="text-xs text-foreground/50">
              Top venue: {topVenueName}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((d, i) => (
          <DateRow
            key={d.id}
            date={d}
            myVote={localVotes[d.id]}
            isSuccess={successDateId === d.id}
            isBestDate={threshold50 && i === 0}
            canEdit={canEdit}
            submitting={submitting}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
