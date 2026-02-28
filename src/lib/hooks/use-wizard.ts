"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

interface UseWizardOptions<T> {
  storageKey: string;
  totalSteps: number;
  defaultState: T;
}

export function useWizard<T extends object>({
  storageKey,
  totalSteps,
  defaultState,
}: UseWizardOptions<T>) {
  const router = useRouter();
  const [state, setState] = useState<T>(defaultState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setMounted(true);
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state on every change (after mount)
  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // quota exceeded — ignore
    }
  }, [state, mounted, storageKey]);

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
    if (step > 0) {
      history.back();
      setStep((s) => s - 1);
    } else {
      router.push("/home");
    }
  }, [step, router]);

  const updateState = useCallback((patch: Partial<T>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    state,
    step,
    direction,
    error,
    mounted,
    isPending,
    totalSteps,
    goNext,
    goBack,
    updateState,
    setError,
    clearStorage,
    startTransition,
  };
}
