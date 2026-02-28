"use client";

interface HostCollectingCTAProps {
  memberCount: number;
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
  inviteCopied,
  onInvite,
  onAdvance,
  renderCTA,
}: HostCollectingCTAProps) {
  if (memberCount < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] px-5 py-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground/70">
          🙏 Tunggu minimal 1 orang lagi join dulu ya! Abis itu lu bisa mulai
          cari venue.
        </p>
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 py-2.5 text-sm font-semibold text-foreground"
        >
          {inviteCopied ? "✓ Link tersalin!" : "🔗 Invite Temen"}
        </button>
      </div>
    );
  }
  return renderCTA("Mulai Cari Venue →", "Lagi nyari... 🔍", onAdvance, "gold");
}
