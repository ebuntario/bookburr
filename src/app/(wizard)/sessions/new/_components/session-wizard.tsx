"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSession } from "@/lib/actions/sessions";
import { StepSessionName } from "./step-session-name";
import { StepSessionMode } from "./step-session-mode";
import { StepOfficeLocation } from "./step-office-location";
import { StepDatePicker } from "./step-date-picker";
import { WizardProgress } from "./wizard-progress";
import type { SessionMode } from "@/lib/constants";

const STORAGE_KEY = "bookburr-new-session";

interface WizardState {
  name: string;
  mode: SessionMode | null;
  officeLocation: string;
  selectedDates: string[]; // "YYYY-MM-DD"
}

const defaultState: WizardState = {
  name: "",
  mode: null,
  officeLocation: "",
  selectedDates: [],
};

function loadState(): WizardState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function saveState(state: WizardState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — ignore
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function SessionWizard() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(defaultState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // Persist state on every change (after mount)
  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  const isWorkMode = state.mode === "work";
  const totalSteps = isWorkMode ? 4 : 3;

  // Map logical step → component step
  // Personal: 0=name, 1=mode, 2=dates
  // Work:     0=name, 1=mode, 2=office, 3=dates
  const getStepIndex = useCallback(
    (logicalStep: number) => {
      if (isWorkMode) return logicalStep;
      // Personal: skip office step (logical 2 → dates)
      return logicalStep >= 2 ? logicalStep + 1 : logicalStep;
    },
    [isWorkMode],
  );

  const currentComponent = getStepIndex(step);

  // Browser history integration
  useEffect(() => {
    if (!mounted) return;

    const handlePopState = () => {
      if (step > 0) {
        setDirection(-1);
        setStep((s) => s - 1);
      } else {
        router.push("/home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step, mounted, router]);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => {
      const next = s + 1;
      history.pushState({ wizardStep: next }, "");
      return next;
    });
    setError(null);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => {
      if (s > 0) {
        history.back();
        return s - 1;
      }
      router.push("/home");
      return s;
    });
  }, [router]);

  const updateState = useCallback(
    (patch: Partial<WizardState>) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

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
        clearState();
        router.push(`/sessions/${result.sessionId}/success`);
      } else {
        setError(result.error);
      }
    });
  }, [state, router]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-medium text-foreground/60"
        >
          {step === 0 ? "Batal" : "Balik"}
        </button>
        <WizardProgress current={step} total={totalSteps} />
        <div className="w-10" /> {/* spacer */}
      </div>

      {/* Step content */}
      <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentComponent}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
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

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-6 bottom-6 rounded-xl bg-coral/10 px-4 py-3 text-center text-sm text-coral"
            >
              {error === "unauthorized"
                ? "Lu belum login nih"
                : error || "Aduh, gagal bikin bukber. Coba lagi ya"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
