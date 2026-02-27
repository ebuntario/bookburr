"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { joinSession } from "@/lib/actions/members";
import { PREFERENCE_LEVEL } from "@/lib/constants";
import type { PreferenceLevel } from "@/lib/constants";
import { WizardProgress } from "@/app/(wizard)/sessions/new/_components/wizard-progress";
import { StepDateVotes } from "./step-date-votes";
import { StepLocation } from "./step-location";
import { StepBudget } from "./step-budget";

interface JoinWizardProps {
  session: { id: string; name: string; mode: string; status: string };
  dateOptions: { id: string; date: string }[];
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

const TOTAL_STEPS = 3;

export function JoinWizard({ session, dateOptions }: JoinWizardProps) {
  const router = useRouter();
  const storageKey = `bookburr-join-${session.id}`;

  const [state, setState] = useState<JoinWizardState>(defaultState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setMounted(true);
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // quota exceeded — ignore
    }
  }, [state, mounted, storageKey]);

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
    if (step > 0) {
      history.back();
      setStep((s) => s - 1);
    } else {
      router.push("/home");
    }
  }, [step, router]);

  const updateState = useCallback((patch: Partial<JoinWizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      // All dates get a vote — unvoted dates become "unavailable"
      const votes = dateOptions.map((d) => ({
        dateOptionId: d.id,
        preferenceLevel: state.votes[d.id] || PREFERENCE_LEVEL.unavailable,
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
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
        router.push(`/sessions/${session.id}`);
      } else {
        setError(result.error);
      }
    });
  }, [state, session.id, dateOptions, storageKey, router]);

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
        <WizardProgress current={step} total={TOTAL_STEPS} />
        <div className="w-10" />
      </div>

      {/* Step content */}
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
                : error || "Aduh, gagal join. Coba lagi ya"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
