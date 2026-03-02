"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateDateVotes } from "@/lib/actions/date-votes";
import { voteBarTransition, successPulse, durations } from "@/lib/motion-variants";
import { PREFERENCE_LEVEL, SESSION_STATUS } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { formatDateNoYear } from "@/lib/format-utils";
import { PREFERENCE_PILL_CONFIG } from "@/lib/ui-config";
import { DateScoreBadge } from "./date-score-badge";

const PREFERENCE_LEVELS: PreferenceLevel[] = [
  PREFERENCE_LEVEL.strongly_prefer,
  PREFERENCE_LEVEL.can_do,
  PREFERENCE_LEVEL.unavailable,
];

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
    { value: stronglyPrefer, color: "bg-primary" },
    { value: canDo, color: "bg-teal" },
    { value: unavailable, color: "bg-danger" },
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
        const config = PREFERENCE_PILL_CONFIG[level];
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
      ? "font-medium text-primary"
      : myVote === PREFERENCE_LEVEL.can_do
        ? "font-medium text-teal"
        : "font-medium text-danger";

  return (
    <p className="text-xs text-foreground/50">
      Pilihan lu:{" "}
      <span className={colorClass}>
        {PREFERENCE_PILL_CONFIG[myVote]?.label}
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
  isProvisionalBest,
  showTallies,
  canEdit,
  submitting,
  onVote,
}: {
  date: DateWithVotes;
  myVote: PreferenceLevel | null;
  isSuccess: boolean;
  isBestDate: boolean;
  isProvisionalBest: boolean;
  showTallies: boolean;
  canEdit: boolean;
  submitting: boolean;
  onVote: (dateId: string, level: PreferenceLevel) => void;
}) {
  const total = date.stronglyPrefer + date.canDo + date.unavailable;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight">
          {formatDateNoYear(date.date)}
        </p>
        {isBestDate && <DateScoreBadge provisional={isProvisionalBest} />}
      </div>

      {showTallies ? (
        <VoteBar
          stronglyPrefer={date.stronglyPrefer}
          canDo={date.canDo}
          unavailable={date.unavailable}
        />
      ) : (
        <div className="h-2 w-full rounded-full bg-foreground/10" />
      )}

      {showTallies && total > 0 && (
        <p className="text-xs text-foreground/50">
          <span className="text-primary">{date.stronglyPrefer} bisa banget</span>
          {" · "}
          <span className="text-teal">{date.canDo} bisa</span>
          {" · "}
          <span className="text-danger">{date.unavailable} gabisa</span>
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function initializeLocalVotes(
  dates: DateWithVotes[],
): Record<string, PreferenceLevel | null> {
  return Object.fromEntries(
    dates.map((d) => [d.id, d.myVote as PreferenceLevel | null]),
  );
}

function buildDateVotePayload(
  localVotes: Record<string, PreferenceLevel | null>,
) {
  return Object.entries(localVotes)
    .filter(([, v]) => v !== null)
    .map(([dateOptionId, preferenceLevel]) => ({
      dateOptionId,
      preferenceLevel: preferenceLevel as PreferenceLevel,
    }));
}

function initBannerDismissed(sessionId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return !!sessionStorage.getItem(`bookburr-revisit-dates-${sessionId}`);
  } catch {
    return false;
  }
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
  >(() => initializeLocalVotes(initialDates));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successDateId, setSuccessDateId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => initBannerDismissed(sessionId),
  );

  const showRevisitBanner =
    status === SESSION_STATUS.discovering && !!topVenueName && !bannerDismissed;

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(`bookburr-revisit-dates-${sessionId}`, "1");
    } catch {
      // ignore
    }
  };

  const canEdit = status === SESSION_STATUS.collecting || status === SESSION_STATUS.discovering;

  const sorted = [...initialDates].sort((a, b) =>
    canEdit ? a.date.localeCompare(b.date) : b.dateScore - a.dateScore,
  );

  const isCollecting = status === SESSION_STATUS.collecting;
  const showTallies = !isCollecting;
  const threshold80 =
    totalMembers > 0 && votedMemberCount / totalMembers >= 0.8;
  const allVoted = votedMemberCount >= totalMembers;

  const handleVote = async (dateId: string, level: PreferenceLevel) => {
    if (!canEdit || submitting) return;

    const prev = localVotes[dateId];
    const next = prev === level ? null : level;

    const newLocalVotes = { ...localVotes, [dateId]: next };
    setLocalVotes(newLocalVotes);
    setError(null);
    setSubmitting(true);

    const result = await updateDateVotes({
      sessionId,
      votes: buildDateVotePayload(newLocalVotes),
    });
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
        <h3 className="text-sm font-heading font-semibold text-foreground/70">Tanggal</h3>
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

      {isCollecting && (
        <p className="text-xs text-foreground/40">
          Hasilnya disembunyiin biar semua bisa jujur — keliatan setelah host confirm
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
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
            isBestDate={!isCollecting && threshold80 && i === 0}
            isProvisionalBest={!allVoted}
            showTallies={showTallies}
            canEdit={canEdit}
            submitting={submitting}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
