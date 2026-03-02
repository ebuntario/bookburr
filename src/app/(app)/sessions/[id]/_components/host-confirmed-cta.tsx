"use client";

interface HostConfirmedCTAProps {
  onAdvance: () => void;
  renderCTA: (
    label: string,
    loadingLabel: string,
    onPress: () => void,
    variant?: "gold" | "coral" | "ghost",
  ) => React.ReactNode;
}

export function HostConfirmedCTA({ onAdvance, renderCTA }: HostConfirmedCTAProps) {
  return (
    <div className="flex flex-col gap-1">
      {renderCTA("Tandai Selesai", "Lagi proses...", onAdvance, "ghost")}
      <p className="text-center text-xs text-foreground/40">
        Ini cuma tandain bukber kelar — gak hapus session
      </p>
    </div>
  );
}
