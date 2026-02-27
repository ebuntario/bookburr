"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SuggestVenueForm } from "./suggest-venue-form";

interface SuggestVenueFabProps {
  sessionId: string;
}

export function SuggestVenueFab({ sessionId }: SuggestVenueFabProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-coral px-4 py-3 shadow-lg shadow-coral/30 text-sm font-semibold text-white transition-transform active:scale-95"
        aria-label="Suggest tempat"
      >
        <span className="text-base leading-none">+</span>
        <span>Suggest Tempat</span>
      </button>

      {open && (
        <SuggestVenueForm
          sessionId={sessionId}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
