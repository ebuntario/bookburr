import type { SessionStatus, SessionMode } from "@/lib/constants";

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  collecting: { label: "Lagi Ngumpulin", className: "bg-teal/15 text-teal" },
  discovering: {
    label: "Lagi Nyari Resto",
    className: "bg-gold/15 text-gold",
  },
  voting: { label: "Lagi Voting", className: "bg-coral/15 text-coral" },
  confirmed: { label: "Udah Fix!", className: "bg-green/15 text-green" },
  completed: {
    label: "Selesai",
    className: "bg-foreground/10 text-foreground/50",
  },
};

export const MODE_ICON: Record<SessionMode, string> = {
  personal: "🫂",
  work: "💼",
};
