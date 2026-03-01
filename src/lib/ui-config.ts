import type { SessionStatus } from "@/lib/constants";

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  collecting: { label: "Lagi Ngumpulin", className: "bg-teal/15 text-teal" },
  discovering: {
    label: "Lagi Nyari Resto",
    className: "bg-primary/15 text-primary",
  },
  voting: { label: "Lagi Voting", className: "bg-danger/15 text-danger" },
  confirmed: { label: "Udah Fix!", className: "bg-success/15 text-success" },
  completed: {
    label: "Selesai",
    className: "bg-foreground/10 text-foreground/50",
  },
};
