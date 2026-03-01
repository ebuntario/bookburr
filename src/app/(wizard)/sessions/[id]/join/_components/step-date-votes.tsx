"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion-variants";
import { CalendarGrid } from "@/components/calendar-grid";
import { PREFERENCE_LEVEL } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { formatDate } from "@/lib/format-utils";

interface StepDateVotesProps {
  sessionName: string;
  /** Existing date options from host/other members */
  dateOptions: { id: string; date: string }[];
  /** Current votes keyed by dateOptionId */
  votes: Record<string, PreferenceLevel>;
  onChange: (votes: Record<string, PreferenceLevel>) => void;
  /** New dates suggested by this member, keyed by date string */
  newDateVotes: Record<string, PreferenceLevel>;
  onChangeNewDates: (newDates: Record<string, PreferenceLevel>) => void;
  onNext: () => void;
  conflictDates?: Record<string, string[]>;
  /** Calendar bounds */
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  /** Whether member can suggest new dates */
  datesLocked: boolean;
}

const PILL_CONFIG: Record<
  PreferenceLevel,
  { label: string; selected: string }
> = {
  [PREFERENCE_LEVEL.strongly_prefer]: {
    label: "Bisa banget!",
    selected: "bg-primary text-white border-primary",
  },
  [PREFERENCE_LEVEL.can_do]: {
    label: "Bisa",
    selected: "bg-teal text-white border-teal",
  },
  [PREFERENCE_LEVEL.unavailable]: {
    label: "Ga bisa",
    selected: "bg-danger text-white border-danger",
  },
};

const PILL_ORDER: PreferenceLevel[] = [
  PREFERENCE_LEVEL.strongly_prefer,
  PREFERENCE_LEVEL.can_do,
  PREFERENCE_LEVEL.unavailable,
];

/** All dates that have a vote (existing or new) */
function getAllVotedDates(
  dateOptions: { id: string; date: string }[],
  votes: Record<string, PreferenceLevel>,
  newDateVotes: Record<string, PreferenceLevel>,
): Set<string> {
  const result = new Set<string>();
  for (const opt of dateOptions) {
    if (votes[opt.id]) result.add(opt.date);
  }
  for (const date of Object.keys(newDateVotes)) {
    result.add(date);
  }
  return result;
}

/** Lookup map: date string → dateOptionId */
function buildDateToIdMap(
  dateOptions: { id: string; date: string }[],
): Map<string, string> {
  return new Map(dateOptions.map((d) => [d.date, d.id]));
}

/** Check if there's at least one non-unavailable vote across existing + new */
function hasAnyAvailableVote(
  votes: Record<string, PreferenceLevel>,
  newDateVotes: Record<string, PreferenceLevel>,
): boolean {
  const isAvailable = (v: PreferenceLevel) =>
    v === PREFERENCE_LEVEL.strongly_prefer || v === PREFERENCE_LEVEL.can_do;
  return (
    Object.values(votes).some(isAvailable) ||
    Object.values(newDateVotes).some(isAvailable)
  );
}

/** Toggle a vote: if current level matches, remove; otherwise set/update */
function toggleVoteForDate(
  dateStr: string,
  level: PreferenceLevel | null,
  dateToId: Map<string, string>,
  votes: Record<string, PreferenceLevel>,
  newDateVotes: Record<string, PreferenceLevel>,
  onChange: (v: Record<string, PreferenceLevel>) => void,
  onChangeNewDates: (v: Record<string, PreferenceLevel>) => void,
  datesLocked: boolean,
) {
  const optId = dateToId.get(dateStr);

  if (optId) {
    const currentLevel = votes[optId];
    const targetLevel = level ?? PREFERENCE_LEVEL.can_do;
    if (currentLevel === targetLevel) {
      const next = { ...votes };
      delete next[optId];
      onChange(next);
    } else if (currentLevel && level === null) {
      // Calendar tap toggle-off
      const next = { ...votes };
      delete next[optId];
      onChange(next);
    } else {
      onChange({ ...votes, [optId]: targetLevel });
    }
  } else if (!datesLocked) {
    const currentLevel = newDateVotes[dateStr];
    const targetLevel = level ?? PREFERENCE_LEVEL.can_do;
    if (currentLevel === targetLevel) {
      const next = { ...newDateVotes };
      delete next[dateStr];
      onChangeNewDates(next);
    } else if (currentLevel && level === null) {
      const next = { ...newDateVotes };
      delete next[dateStr];
      onChangeNewDates(next);
    } else {
      onChangeNewDates({ ...newDateVotes, [dateStr]: targetLevel });
    }
  }
}

/** Build sorted list of dates that have active votes, for the pill section */
function buildActiveDates(
  dateOptions: { id: string; date: string }[],
  votes: Record<string, PreferenceLevel>,
  newDateVotes: Record<string, PreferenceLevel>,
): { key: string; date: string; isNew: boolean }[] {
  const result: { key: string; date: string; isNew: boolean }[] = [];
  for (const opt of dateOptions) {
    if (votes[opt.id]) {
      result.push({ key: opt.id, date: opt.date, isNew: false });
    }
  }
  for (const date of Object.keys(newDateVotes)) {
    result.push({ key: `new-${date}`, date, isNew: true });
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

function ConflictWarning({ conflicts }: { conflicts: string[] }) {
  if (conflicts.length === 0) return null;
  return (
    <motion.div
      {...fadeUp}
      className="mb-2 rounded-lg border border-danger/20 bg-danger/10 px-2.5 py-1.5"
    >
      {conflicts.map((name) => (
        <p key={name} className="text-xs text-danger">
          Lu udah ada bukber &ldquo;{name}&rdquo; di tanggal ini
        </p>
      ))}
    </motion.div>
  );
}

export function StepDateVotes({
  sessionName,
  dateOptions,
  votes,
  onChange,
  newDateVotes,
  onChangeNewDates,
  onNext,
  conflictDates = {},
  dateRangeStart,
  dateRangeEnd,
  datesLocked,
}: StepDateVotesProps) {
  const dateToId = useMemo(() => buildDateToIdMap(dateOptions), [dateOptions]);
  const existingDateSet = useMemo(
    () => new Set(dateOptions.map((d) => d.date)),
    [dateOptions],
  );

  const hasAvailable = useMemo(
    () => hasAnyAvailableVote(votes, newDateVotes),
    [votes, newDateVotes],
  );

  const selectedDates = useMemo(
    () => getAllVotedDates(dateOptions, votes, newDateVotes),
    [dateOptions, votes, newDateVotes],
  );

  const handleDateTap = (dateStr: string) => {
    toggleVoteForDate(
      dateStr, null, dateToId, votes, newDateVotes,
      onChange, onChangeNewDates, datesLocked,
    );
  };

  const setPreference = (dateStr: string, level: PreferenceLevel) => {
    toggleVoteForDate(
      dateStr, level, dateToId, votes, newDateVotes,
      onChange, onChangeNewDates, datesLocked,
    );
  };

  const handleIkutAja = () => {
    const allVotes: Record<string, PreferenceLevel> = {};
    for (const opt of dateOptions) {
      allVotes[opt.id] = PREFERENCE_LEVEL.can_do;
    }
    onChange(allVotes);
  };

  const activeDates = useMemo(
    () => buildActiveDates(dateOptions, votes, newDateVotes),
    [dateOptions, votes, newDateVotes],
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-foreground/50">Join {sessionName}</p>
        <h2 className="text-2xl font-heading font-semibold">Kapan lu bisa?</h2>
        <p className="text-sm text-foreground/60">
          {datesLocked
            ? "Tap tanggal yang tersedia, trus pilih ketersediaan lu"
            : "Tap tanggal di kalender, trus pilih ketersediaan lu"}
        </p>
      </div>

      {/* Calendar */}
      <CalendarGrid
        selectedDates={selectedDates}
        onDateTap={handleDateTap}
        highlightedDates={existingDateSet}
        tappableDates={datesLocked ? existingDateSet : null}
        rangeStart={dateRangeStart}
        rangeEnd={dateRangeEnd}
        selectedClass="bg-teal/20 text-teal ring-1 ring-teal/40"
        renderCellExtra={(dateStr) => {
          const conflicts = conflictDates[dateStr];
          if (!conflicts || conflicts.length === 0) return null;
          return (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
          );
        }}
      />

      {/* Color legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-foreground/50">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-primary/20 ring-1 ring-primary/30" />
          Host suggest
        </span>
        {!datesLocked && (
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-teal/20 ring-1 ring-teal/40" />
            Lu pilih
          </span>
        )}
      </div>

      {/* "Ikut aja" shortcut */}
      {dateOptions.length > 0 && activeDates.length === 0 && (
        <button
          type="button"
          onClick={handleIkutAja}
          className="rounded-xl border border-teal/30 bg-teal/5 px-4 py-3 text-sm font-medium text-teal transition-colors hover:bg-teal/10"
        >
          Ikut aja semua tanggal
        </button>
      )}

      {/* Active date preference pills */}
      {activeDates.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-medium text-foreground/40">Ketersediaan lu:</p>
          {activeDates.map(({ key, date, isNew }) => {
            const optId = dateToId.get(date);
            const currentPref = optId ? votes[optId] : newDateVotes[date];
            const conflicts = conflictDates[date];

            return (
              <div key={key} className="rounded-xl border border-foreground/10 bg-white px-3 py-2.5">
                {conflicts && conflicts.length > 0 && (
                  <ConflictWarning conflicts={conflicts} />
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{formatDate(date)}</span>
                    {isNew && (
                      <span className="text-xs text-teal">Tanggal baru</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {PILL_ORDER.map((level) => {
                      const config = PILL_CONFIG[level];
                      const isSelected = currentPref === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPreference(date, level)}
                          className={`min-h-[36px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? config.selected
                              : "border-foreground/20 text-foreground/50"
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-auto pt-4">
        <Button
          onPress={onNext}
          isDisabled={!hasAvailable && dateOptions.length > 0}
          size="lg"
          className="w-full bg-danger font-medium text-white disabled:opacity-40"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
