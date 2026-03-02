"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/outline";
import { springs, tapScale, popIn } from "@/lib/motion-variants";
import { SuggestVenueForm } from "./suggest-venue-form";
import { BottomSheet } from "@/components/bottom-sheet";

interface SuggestVenueFabProps {
  sessionId: string;
}

export function SuggestVenueFab({ sessionId }: SuggestVenueFabProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        {...popIn}
        whileTap={tapScale}
        transition={{ ...springs.bouncy, delay: 0.2 }}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-lg shadow-primary/30 text-sm font-medium text-white"
        aria-label="Suggest tempat"
      >
        <PlusIcon className="h-5 w-5" />
        <span>Suggest Tempat</span>
      </motion.button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <SuggestVenueForm
          sessionId={sessionId}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </BottomSheet>
    </>
  );
}
