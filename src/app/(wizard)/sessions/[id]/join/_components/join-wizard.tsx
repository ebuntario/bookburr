"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { joinSession } from "@/lib/actions/members";
import { PREFERENCE_LEVEL, SESSION_SHAPE } from "@/lib/constants";
import type { PreferenceLevel, SessionShape } from "@/lib/constants";
import { slideVariants, slideTransition, toastSlideUp } from "@/lib/motion-variants";
import { useWizard } from "@/lib/hooks/use-wizard";
import { WizardProgress } from "@/app/(wizard)/sessions/new/_components/wizard-progress";
import { WizardErrorToast } from "@/components/wizard-error-toast";
import { StepDateVotes } from "./step-date-votes";
import { StepLocation } from "./step-location";
import { StepBudget } from "./step-budget";

interface JoinWizardProps {
  session: {
    id: string;
    name: string;
    mode: string;
    status: string;
    sessionShape: SessionShape;
    dateRangeStart: string | null;
    dateRangeEnd: string | null;
    datesLocked: boolean;
  };
  dateOptions: { id: string; date: string }[];
  conflictDates?: Record<string, string[]>;
}

interface JoinWizardState {
  votes: Record<string, PreferenceLevel>;
  newDateVotes: Record<string, PreferenceLevel>;
  referenceLocation: string;
  lat?: number;
  lng?: number;
  budgetCeiling: number | null;
}

const defaultState: JoinWizardState = {
  votes: {},
  newDateVotes: {},
  referenceLocation: "",
  budgetCeiling: null,
};

function UnvotedConfirmModal({
  unvotedCount,
  onCancel,
  onConfirm,
}: {
  unvotedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      {...toastSlideUp}
      className="absolute inset-x-6 bottom-6 flex flex-col gap-3 rounded-xl border border-foreground/10 bg-white p-4 text-center shadow-lg"
    >
      <p className="text-sm text-foreground">
        Lu belum pilih untuk {unvotedCount} tanggal. Gue anggap bisa ya?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-foreground/20 py-2 text-sm font-medium text-foreground/60"
        >
          Mau pilih dulu
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white"
        >
          Yep, lanjut!
        </button>
      </div>
    </motion.div>
  );
}

export function JoinWizard({ session, dateOptions, conflictDates = {} }: JoinWizardProps) {
  const router = useRouter();

  // Build step sequence based on session shape
  const stepKeys = useMemo(() => {
    const keys: ("dates" | "location" | "budget")[] = [];

    // date_known: skip date step (date already decided)
    if (session.sessionShape !== SESSION_SHAPE.date_known) {
      keys.push("dates");
    }

    // venue_known: skip location step (venue already decided, location is irrelevant)
    if (session.sessionShape !== SESSION_SHAPE.venue_known) {
      keys.push("location");
    }

    keys.push("budget");
    return keys;
  }, [session.sessionShape]);

  const totalSteps = stepKeys.length;

  const {
    state,
    step,
    direction,
    error,
    mounted,
    isPending,
    goNext,
    goBack,
    updateState,
    setError,
    clearStorage,
    startTransition,
  } = useWizard<JoinWizardState>({
    storageKey: `bookburr-join-${session.id}`,
    totalSteps,
    defaultState,
  });

  const currentStepKey = stepKeys[step] ?? stepKeys[stepKeys.length - 1];
  const [pendingUnvotedConfirm, setPendingUnvotedConfirm] = useState(false);

  const executeSubmit = useCallback(() => {
    setError(null);
    setPendingUnvotedConfirm(false);
    startTransition(async () => {
      // Build votes for existing date options
      const existingVotes = dateOptions
        .filter((d) => state.votes[d.id])
        .map((d) => ({
          dateOptionId: d.id,
          preferenceLevel: state.votes[d.id] || PREFERENCE_LEVEL.can_do,
        }));

      // For unvoted existing dates, default to can_do
      const unvotedExisting = dateOptions
        .filter((d) => !state.votes[d.id])
        .map((d) => ({
          dateOptionId: d.id,
          preferenceLevel: PREFERENCE_LEVEL.can_do as PreferenceLevel,
        }));

      const allExistingVotes = [...existingVotes, ...unvotedExisting];

      // Build new date suggestions
      const newDates = Object.entries(state.newDateVotes).map(
        ([date, preferenceLevel]) => ({ date, preferenceLevel }),
      );

      const result = await joinSession({
        sessionId: session.id,
        votes: allExistingVotes,
        newDates: newDates.length > 0 ? newDates : undefined,
        referenceLocation: state.referenceLocation || undefined,
        lat: state.lat,
        lng: state.lng,
        budgetCeiling: state.budgetCeiling ?? undefined,
      });

      if (result.ok) {
        clearStorage();
        router.push(`/sessions/${session.id}`);
      } else {
        setError(result.error);
      }
    });
  }, [state, session.id, dateOptions, clearStorage, router, setError, startTransition]);

  const handleSubmit = useCallback(() => {
    // Only check unvoted for non-date_known sessions
    if (session.sessionShape !== SESSION_SHAPE.date_known) {
      const unvotedCount = dateOptions.filter(
        (d) => !state.votes[d.id],
      ).length;
      if (unvotedCount > 0) {
        setPendingUnvotedConfirm(true);
        return;
      }
    }
    executeSubmit();
  }, [dateOptions, state.votes, executeSubmit, session.sessionShape]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-medium text-foreground/60"
        >
          {step === 0 ? "Batal" : "Balik"}
        </button>
        <WizardProgress current={step} total={totalSteps} />
        <div className="w-10" />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-1 flex-col"
          >
            {currentStepKey === "dates" && (
              <StepDateVotes
                sessionName={session.name}
                dateOptions={dateOptions}
                votes={state.votes}
                onChange={(votes) => updateState({ votes })}
                newDateVotes={state.newDateVotes}
                onChangeNewDates={(newDateVotes) => updateState({ newDateVotes })}
                onNext={goNext}
                conflictDates={conflictDates}
                dateRangeStart={session.dateRangeStart}
                dateRangeEnd={session.dateRangeEnd}
                datesLocked={session.datesLocked}
              />
            )}
            {currentStepKey === "location" && (
              <StepLocation
                value={state.referenceLocation}
                lat={state.lat}
                lng={state.lng}
                onChange={(referenceLocation, lat, lng) =>
                  updateState({ referenceLocation, lat, lng })
                }
                onNext={goNext}
              />
            )}
            {currentStepKey === "budget" && (
              <StepBudget
                value={state.budgetCeiling}
                onChange={(budgetCeiling) => updateState({ budgetCeiling })}
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {pendingUnvotedConfirm && (
            <UnvotedConfirmModal
              unvotedCount={dateOptions.filter((d) => !state.votes[d.id]).length}
              onCancel={() => setPendingUnvotedConfirm(false)}
              onConfirm={executeSubmit}
            />
          )}
        </AnimatePresence>

        <WizardErrorToast
          error={error}
          fallbackMessage="Aduh, gagal join. Coba lagi ya"
        />
      </div>
    </div>
  );
}
