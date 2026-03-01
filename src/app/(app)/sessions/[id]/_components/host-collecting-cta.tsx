"use client";

import { HandRaisedIcon, LinkIcon, CheckIcon } from "@heroicons/react/24/outline";

interface HostCollectingCTAProps {
  memberCount: number;
  hasViableDates: boolean;
  inviteCopied: boolean;
  onInvite: () => void;
  onAdvance: () => void;
  renderCTA: (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant?: "gold" | "coral" | "ghost",
  ) => React.ReactNode;
}

export function HostCollectingCTA({
  memberCount,
  hasViableDates,
  inviteCopied,
  onInvite,
  onAdvance,
  renderCTA,
}: HostCollectingCTAProps) {
  if (memberCount < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5 flex flex-col gap-3">
        <div className="flex gap-2 items-start">
          <HandRaisedIcon className="h-5 w-5 shrink-0 text-foreground/50 mt-0.5" />
          <p className="text-sm font-medium text-foreground/70">
            Tunggu minimal 1 orang lagi join dulu ya! Abis itu lu bisa mulai
            cari venue.
          </p>
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-2.5 text-sm font-semibold text-foreground"
        >
          {inviteCopied ? <><CheckIcon className="h-4 w-4 inline" /> Link tersalin!</> : <><LinkIcon className="h-4 w-4 inline" /> Invite Temen</>}
        </button>
      </div>
    );
  }

  if (!hasViableDates) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground/70">
          Belum ada tanggal yang orang bisa — share ke yang lain dulu.
        </p>
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-2.5 text-sm font-semibold text-foreground"
        >
          {inviteCopied ? <><CheckIcon className="h-4 w-4 inline" /> Link tersalin!</> : <><LinkIcon className="h-4 w-4 inline" /> Invite Temen</>}
        </button>
      </div>
    );
  }

  return renderCTA("Mulai Cari Venue →", "Lagi nyari... 🔍", onAdvance, "gold");
}
