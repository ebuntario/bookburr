"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { joinSession } from "@/lib/actions/members";
import { PREFERENCE_LEVEL } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { slideVariants } from "@/lib/motion-variants";
import { useWizard } from "@/lib/hooks/use-wizard";
import { WizardProgress } from "@/app/(wizard)/sessions/new/_components/wizard-progress";
import { WizardErrorToast } from "@/components/wizard-error-toast";
import { StepDateVotes } from "./step-date-votes";
import { StepLocation } from "./step-location";
import { StepBudget } from "./step-budget";

interface JoinWizardProps {
  session: { id: string; name: string; mode: string; status: string };
  dateOptions: { id: string; date: string }[];
  conflictDates?: Record<string, string[]>;
}

interface JoinWizardState {
  votes: Record<string, PreferenceLevel>;
  referenceLocation: string;
  lat?: number;
  lng?: number;
  budgetCeiling: number | null;
}

const defaultState: JoinWizardState = {
  votes: {},
  referenceLocation: "",
  budgetCeiling: null,
};

const TOTAL_STEPS = 3;

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
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
          className="flex-1 rounded-lg bg-gold py-2 text-sm font-semibold text-white"
        >
          Yep, lanjut!
        </button>
      </div>
    </motion.div>
  );
}

export function JoinWizard({ session, dateOptions, conflictDates = {} }: JoinWizardProps) {
  const router = useRouter();

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
    totalSteps: TOTAL_STEPS,
    defaultState,
  });

  const [pendingUnvotedConfirm, setPendingUnvotedConfirm] = useState(false);

  const executeSubmit = useCallback(() => {
    setError(null);
    setPendingUnvotedConfirm(false);
    startTransition(async () => {
      const votes = dateOptions.map((d) => ({
        dateOptionId: d.id,
        preferenceLevel: state.votes[d.id] || PREFERENCE_LEVEL.can_do,
      }));

      const result = await joinSession({
        sessionId: session.id,
        votes,
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
    const unvotedCount = dateOptions.filter((d) => !state.votes[d.id]).length;
    if (unvotedCount > 0) {
      setPendingUnvotedConfirm(true);
      return;
    }
    executeSubmit();
  }, [dateOptions, state.votes, executeSubmit]);

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
        <WizardProgress current={step} total={TOTAL_STEPS} />
        <div className="w-10" />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <StepDateVotes
                sessionName={session.name}
                dateOptions={dateOptions}
                votes={state.votes}
                onChange={(votes) => updateState({ votes })}
                onNext={goNext}
                conflictDates={conflictDates}
              />
            )}
            {step === 1 && (
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
            {step === 2 && (
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
