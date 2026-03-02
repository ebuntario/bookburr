"use client";

import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { voteForVenue } from "@/lib/actions/venues";

interface TerserahButtonProps {
  sessionId: string;
  isTerserah: boolean; // current member's state
}

export function TerserahButton({ sessionId, isTerserah: initialIsTerserah }: TerserahButtonProps) {
  const [isTerserah, setIsTerserah] = useState(initialIsTerserah);
  const [submitting, setSubmitting] = useState(false);

  const handleTerserah = async () => {
    if (submitting) return;
    setSubmitting(true);

    const next = !isTerserah;
    setIsTerserah(next);

    const result = await voteForVenue({
      sessionId,
      isTerserah: next,
      venueId: null,
    });

    setSubmitting(false);
    if (!result.ok) setIsTerserah(!next);
  };

  return (
    <button
      type="button"
      onClick={handleTerserah}
      disabled={submitting}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm transition-all",
        isTerserah
          ? "border-teal/40 bg-teal/10 font-medium text-teal"
          : "border-foreground/15 text-foreground/50",
        submitting && "opacity-60",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isTerserah ? <><CheckIcon className="h-4 w-4 inline" /> Ikut aja dipilih!</> : "Gapunya preferensi? Ikut aja deh"}
    </button>
  );
}
