"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toastSlideUp } from "@/lib/motion-variants";

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
          {...toastSlideUp}
          className="absolute inset-x-6 bottom-6 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm text-danger"
        >
          {error === "unauthorized"
            ? "Lu belum login nih"
            : error || fallbackMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
