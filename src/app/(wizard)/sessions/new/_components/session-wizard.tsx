"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSession } from "@/lib/actions/sessions";
import { SESSION_SHAPE } from "@/lib/constants";
import { slideVariants, slideTransition } from "@/lib/motion-variants";
import { useWizard } from "@/lib/hooks/use-wizard";
import { StepSessionName } from "./step-session-name";
import { StepSessionMode } from "./step-session-mode";
import { StepDateFixed } from "./step-date-fixed";
import { StepVenueFixed } from "./step-venue-fixed";
import { StepConfirmedDate } from "./step-confirmed-date";
import { StepPresetVenue } from "./step-preset-venue";
import { StepDateSeeding } from "./step-date-seeding";
import { StepOfficeLocation } from "./step-office-location";
import { WizardProgress } from "./wizard-progress";
import { WizardErrorToast } from "@/components/wizard-error-toast";
import type { SessionMode, SessionShape } from "@/lib/constants";

const STORAGE_KEY = "bookburr-new-session";

interface WizardState {
  name: string;
  mode: SessionMode | null;
  dateFixed: boolean | null;
  venueFixed: boolean | null;
  confirmedDate: string | null;
  presetVenueName: string;
  presetVenueAddress: string;
  seededDates: string[];
  officeLocation: string;
}

const defaultState: WizardState = {
  name: "",
  mode: null,
  dateFixed: null,
  venueFixed: null,
  confirmedDate: null,
  presetVenueName: "",
  presetVenueAddress: "",
  seededDates: [],
  officeLocation: "",
};

/**
 * Derive session shape from two yes/no answers.
 * dateFixed + venueFixed = date_known (only venue_known if BOTH fixed is impossible — date_known takes precedence)
 * dateFixed + !venueFixed = date_known
 * !dateFixed + venueFixed = venue_known
 * !dateFixed + !venueFixed = need_both
 */
function deriveShape(dateFixed: boolean | null, venueFixed: boolean | null): SessionShape | null {
  if (dateFixed === null || venueFixed === null) return null;
  if (dateFixed && venueFixed) return SESSION_SHAPE.date_known;
  if (dateFixed) return SESSION_SHAPE.date_known;
  if (venueFixed) return SESSION_SHAPE.venue_known;
  return SESSION_SHAPE.need_both;
}

/**
 * Build the step sequence dynamically based on state.
 * Each step is a string key that maps to a component.
 *
 * Base: name → mode → dateFixed → venueFixed
 * Then shape-specific steps, then office (if work), then submit step.
 */
type StepKey =
  | "name"
  | "mode"
  | "dateFixed"
  | "venueFixed"
  | "confirmedDate"
  | "presetVenue"
  | "dateSeeding"
  | "officeLocation";

function buildStepSequence(state: WizardState): StepKey[] {
  const steps: StepKey[] = ["name", "mode", "dateFixed", "venueFixed"];
  const shape = deriveShape(state.dateFixed, state.venueFixed);

  if (shape === SESSION_SHAPE.date_known) {
    steps.push("confirmedDate");
  } else if (shape === SESSION_SHAPE.venue_known) {
    steps.push("presetVenue");
    steps.push("dateSeeding"); // optional date seeding after venue
  } else if (shape === SESSION_SHAPE.need_both) {
    steps.push("dateSeeding"); // optional date seeding
  }

  if (state.mode === "work") {
    steps.push("officeLocation");
  }

  return steps;
}

function validateSessionForm(
  state: WizardState,
  shape: SessionShape | null,
): boolean {
  if (!state.name.trim() || !state.mode || !shape) return false;
  if (shape === SESSION_SHAPE.date_known && !state.confirmedDate) return false;
  if (shape === SESSION_SHAPE.venue_known && !state.presetVenueName.trim()) return false;
  return true;
}

function buildCreateSessionPayload(
  state: WizardState,
  shape: SessionShape,
): Parameters<typeof createSession>[0] {
  return {
    name: state.name.trim(),
    mode: state.mode!,
    sessionShape: shape,
    officeLocation: state.mode === "work" ? state.officeLocation : undefined,
    confirmedDate: shape === SESSION_SHAPE.date_known ? state.confirmedDate! : undefined,
    presetVenueName: shape === SESSION_SHAPE.venue_known ? state.presetVenueName : undefined,
    presetVenueAddress: shape === SESSION_SHAPE.venue_known ? state.presetVenueAddress : undefined,
    seededDates: state.seededDates.length > 0 ? state.seededDates : undefined,
  };
}

export function SessionWizard() {
  const router = useRouter();

  const {
    state,
    step,
    direction,
    error,
    mounted,
    goNext,
    goBack,
    updateState,
    setError,
    clearStorage,
    startTransition,
  } = useWizard<WizardState>({
    storageKey: STORAGE_KEY,
    totalSteps: 8, // max possible, actual varies
    defaultState,
  });

  const stepSequence = useMemo(() => buildStepSequence(state), [state]);
  const totalSteps = stepSequence.length;
  const currentStepKey = stepSequence[step] ?? stepSequence[stepSequence.length - 1];

  // Check if we're on the last step (submit step)
  const isLastStep = step >= totalSteps - 1;

  const handleSubmit = useCallback(() => {
    const shape = deriveShape(state.dateFixed, state.venueFixed);
    if (!validateSessionForm(state, shape)) return;

    setError(null);
    startTransition(async () => {
      const result = await createSession(buildCreateSessionPayload(state, shape!));

      if (result.ok) {
        clearStorage();
        router.push(`/sessions/${result.sessionId}/success`);
      } else {
        setError(result.error);
      }
    });
  }, [state, router, setError, clearStorage, startTransition]);

  // Handle next: if last step, submit; otherwise advance
  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleSubmit();
    } else {
      goNext();
    }
  }, [isLastStep, handleSubmit, goNext]);

  // Skip handler for date seeding (advance past it)
  const handleSkipDateSeeding = useCallback(() => {
    updateState({ seededDates: [] });
    if (isLastStep) {
      handleSubmit();
    } else {
      goNext();
    }
  }, [updateState, isLastStep, handleSubmit, goNext]);

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
            {currentStepKey === "name" && (
              <StepSessionName
                value={state.name}
                onChange={(name) => updateState({ name })}
                onNext={goNext}
              />
            )}
            {currentStepKey === "mode" && (
              <StepSessionMode
                value={state.mode}
                onChange={(mode) => updateState({ mode })}
                onNext={goNext}
              />
            )}
            {currentStepKey === "dateFixed" && (
              <StepDateFixed
                value={state.dateFixed}
                onChange={(dateFixed) => {
                  updateState({ dateFixed });
                }}
                onNext={goNext}
              />
            )}
            {currentStepKey === "venueFixed" && (
              <StepVenueFixed
                value={state.venueFixed}
                onChange={(venueFixed) => {
                  updateState({ venueFixed });
                }}
                onNext={goNext}
              />
            )}
            {currentStepKey === "confirmedDate" && (
              <StepConfirmedDate
                value={state.confirmedDate}
                onChange={(confirmedDate) => updateState({ confirmedDate })}
                onNext={handleNext}
              />
            )}
            {currentStepKey === "presetVenue" && (
              <StepPresetVenue
                venueName={state.presetVenueName}
                venueAddress={state.presetVenueAddress}
                onChangeName={(presetVenueName) => updateState({ presetVenueName })}
                onChangeAddress={(presetVenueAddress) => updateState({ presetVenueAddress })}
                onNext={goNext}
              />
            )}
            {currentStepKey === "dateSeeding" && (
              <StepDateSeeding
                selectedDates={state.seededDates}
                onChange={(seededDates) => updateState({ seededDates })}
                onNext={handleNext}
                onSkip={handleSkipDateSeeding}
              />
            )}
            {currentStepKey === "officeLocation" && (
              <StepOfficeLocation
                value={state.officeLocation}
                onChange={(officeLocation) => updateState({ officeLocation })}
                onNext={handleNext}
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
