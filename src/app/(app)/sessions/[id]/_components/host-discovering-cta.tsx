"use client";

import { ExclamationTriangleIcon, ArrowPathIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";

interface HostDiscoveringCTAProps {
  discoveryFailed: boolean;
  venueCount: number;
  onRetryDiscovery: () => void;
  onAdvance: () => void;
  renderCTA: (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant?: "gold" | "coral" | "ghost",
  ) => React.ReactNode;
}

export function HostDiscoveringCTA({
  discoveryFailed,
  venueCount,
  onRetryDiscovery,
  onAdvance,
  renderCTA,
}: HostDiscoveringCTAProps) {
  if (discoveryFailed) {
    return (
      <div className="rounded-2xl border border-coral/30 bg-coral/5 px-5 py-5 flex flex-col gap-3">
        <div className="flex gap-2 items-start">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-coral mt-0.5" />
          <p className="text-sm font-medium text-foreground/70">
            Gagal nyari venue otomatis. Coba lagi?
          </p>
        </div>
        <button
          type="button"
          onClick={onRetryDiscovery}
          className="flex items-center justify-center gap-2 rounded-xl border border-coral/30 py-2.5 text-sm font-semibold text-coral"
        >
          <ArrowPathIcon className="h-4 w-4" /> Cari Ulang
        </button>
      </div>
    );
  }

  if (venueCount < 1) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5">
        <div className="flex gap-2 items-start">
          <BuildingStorefrontIcon className="h-5 w-5 shrink-0 text-foreground/50 mt-0.5" />
          <p className="text-sm font-medium text-foreground/70">
            Belum ada venue nih, tambahin dulu ya!
          </p>
        </div>
      </div>
    );
  }

  return renderCTA("Buka Voting →", "Lagi proses... ⏳", onAdvance, "gold");
}
