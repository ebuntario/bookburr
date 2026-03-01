"use client";

import { HandRaisedIcon } from "@heroicons/react/24/outline";

interface HostCollectingCTAProps {
  memberCount: number;
  hasViableDates: boolean;
  onAdvance: () => void;
  renderCTA: (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant?: "gold" | "coral" | "ghost",
  ) => React.ReactNode;
  advanceLabel?: string;
}

export function HostCollectingCTA({
  memberCount,
  hasViableDates,
  onAdvance,
  renderCTA,
  advanceLabel,
}: HostCollectingCTAProps) {
  if (memberCount < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5 flex gap-2 items-start">
        <HandRaisedIcon className="h-5 w-5 shrink-0 text-foreground/50 mt-0.5" />
        <p className="text-sm font-medium text-foreground/70">
          Tunggu minimal 1 orang lagi join dulu ya! Share link-nya pake tombol di bawah.
        </p>
      </div>
    );
  }

  if (!hasViableDates) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5">
        <p className="text-sm font-medium text-foreground/70">
          Belum ada tanggal yang orang bisa — share ke yang lain dulu pake tombol di bawah.
        </p>
      </div>
    );
  }

  return renderCTA(advanceLabel ?? "Mulai Cari Venue →", "Lagi proses...", onAdvance, "gold");
}
