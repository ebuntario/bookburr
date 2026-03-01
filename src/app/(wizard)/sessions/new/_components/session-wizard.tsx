"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSession } from "@/lib/actions/sessions";
import { slideVariants, slideTransition } from "@/lib/motion-variants";
import { useWizard } from "@/lib/hooks/use-wizard";
import { StepSessionName } from "./step-session-name";
import { StepSessionMode } from "./step-session-mode";
import { StepOfficeLocation } from "./step-office-location";
import { StepDatePicker } from "./step-date-picker";
import { WizardProgress } from "./wizard-progress";
import { WizardErrorToast } from "@/components/wizard-error-toast";
import type { SessionMode } from "@/lib/constants";

const STORAGE_KEY = "bookburr-new-session";

interface WizardState {
  name: string;
  mode: SessionMode | null;
  officeLocation: string;
  selectedDates: string[];
}

const defaultState: WizardState = {
  name: "",
  mode: null,
  officeLocation: "",
  selectedDates: [],
};

export function SessionWizard() {
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
  } = useWizard<WizardState>({
    storageKey: STORAGE_KEY,
    totalSteps: 3, // base; actual varies by mode
    defaultState,
  });

  const isWorkMode = state.mode === "work";
  const totalSteps = isWorkMode ? 4 : 3;

  // Map logical step → component step
  // Personal: 0=name, 1=mode, 2=dates
  // Work:     0=name, 1=mode, 2=office, 3=dates
  const getStepIndex = useCallback(
    (logicalStep: number) => {
      if (isWorkMode) return logicalStep;
      return logicalStep >= 2 ? logicalStep + 1 : logicalStep;
    },
    [isWorkMode],
  );

  const currentComponent = getStepIndex(step);

  const handleSubmit = useCallback(() => {
    if (!state.name.trim() || !state.mode || state.selectedDates.length === 0)
      return;

    setError(null);
    startTransition(async () => {
      const result = await createSession({
        name: state.name.trim(),
        mode: state.mode!,
        officeLocation:
          state.mode === "work" ? state.officeLocation : undefined,
        candidateDates: state.selectedDates,
      });

      if (result.ok) {
        clearStorage();
        router.push(`/sessions/${result.sessionId}/success`);
      } else {
        setError(result.error);
      }
    });
  }, [state, router, setError, clearStorage, startTransition]);

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
            key={currentComponent}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-1 flex-col"
          >
            {currentComponent === 0 && (
              <StepSessionName
                value={state.name}
                onChange={(name) => updateState({ name })}
                onNext={goNext}
              />
            )}
            {currentComponent === 1 && (
              <StepSessionMode
                value={state.mode}
                onChange={(mode) => updateState({ mode })}
                onNext={goNext}
              />
            )}
            {currentComponent === 2 && (
              <StepOfficeLocation
                value={state.officeLocation}
                onChange={(officeLocation) => updateState({ officeLocation })}
                onNext={goNext}
              />
            )}
            {currentComponent === 3 && (
              <StepDatePicker
                selectedDates={state.selectedDates}
                onChange={(selectedDates) => updateState({ selectedDates })}
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <WizardErrorToast
          error={error}
          fallbackMessage="Aduh, gagal bikin bukber. Coba lagi ya"
        />
      </div>
    </div>
  );
}
