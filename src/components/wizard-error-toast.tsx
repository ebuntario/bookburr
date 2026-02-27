"use client";

import { AnimatePresence, motion } from "framer-motion";

interface WizardErrorToastProps {
  error: string | null;
  fallbackMessage?: string;
}

export function WizardErrorToast({
  error,
  fallbackMessage = "Aduh, ada yang error. Coba lagi ya",
}: WizardErrorToastProps) {
  return (
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
            : error || fallbackMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
