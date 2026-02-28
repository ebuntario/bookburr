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
  return renderCTA("Tandai Selesai", "Lagi proses...", onAdvance, "ghost");
}
