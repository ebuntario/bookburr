"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion-variants";
import { PREFERENCE_LEVEL } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { formatDate } from "@/lib/format-utils";

interface StepDateVotesProps {
  sessionName: string;
  dateOptions: { id: string; date: string }[];
  votes: Record<string, PreferenceLevel>;
  onChange: (votes: Record<string, PreferenceLevel>) => void;
  onNext: () => void;
  conflictDates?: Record<string, string[]>;
}

const CYCLE: PreferenceLevel[] = [
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
    label: "Ga",
    selected: "bg-coral text-white border-coral",
    unselected: "border-foreground/20 text-foreground/60",
  },
};

function setVote(
  votes: Record<string, PreferenceLevel>,
  dateId: string,
  level: PreferenceLevel,
  onChange: (v: Record<string, PreferenceLevel>) => void,
) {
  // Toggle off if already selected
  if (votes[dateId] === level) {
    const next = { ...votes };
    delete next[dateId];
    onChange(next);
  } else {
    onChange({ ...votes, [dateId]: level });
  }
}

export function StepDateVotes({
  sessionName,
  dateOptions,
  votes,
  onChange,
  onNext,
  conflictDates = {},
}: StepDateVotesProps) {
  const hasAvailable = Object.values(votes).some(
    (v) =>
      v === PREFERENCE_LEVEL.strongly_prefer || v === PREFERENCE_LEVEL.can_do,
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-foreground/50">Join {sessionName}</p>
        <h2 className="text-2xl font-bold">Kapan lu bisa?</h2>
        <p className="text-sm text-foreground/60">
          Pilih buat setiap tanggal yang ada
        </p>
      </div>

      {dateOptions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-foreground/40">
            Host belum nambahin tanggal nih
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          {dateOptions.map((opt) => {
            const conflicts = conflictDates[opt.date];
            return (
            <div
              key={opt.id}
              className="rounded-2xl border border-foreground/10 bg-white px-4 py-3"
            >
              {conflicts && conflicts.length > 0 && (
                <motion.div
                  {...fadeUp}
                  className="mb-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2"
                >
                  {conflicts.map((name) => (
                    <p key={name} className="text-xs text-coral">
                      Heads up bestie, lu udah ada bukber &ldquo;{name}&rdquo; di tanggal ini
                    </p>
                  ))}
                </motion.div>
              )}
              <p className="mb-3 font-medium">{formatDate(opt.date)}</p>
              <div className="flex gap-2">
                {CYCLE.map((level) => {
                  const config = PILL_CONFIG[level];
                  const isSelected = votes[opt.id] === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setVote(votes, opt.id, level, onChange)
                      }
                      className={[
                        "min-h-[44px] flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition-all",
                        isSelected ? config.selected : config.unselected,
                      ].join(" ")}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      )}

      <Button
        onPress={onNext}
        isDisabled={!hasAvailable && dateOptions.length > 0}
        size="lg"
        className="w-full bg-coral font-semibold text-white disabled:opacity-40"
      >
        Lanjut
      </Button>
    </div>
  );
}
