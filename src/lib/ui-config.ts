import type { SessionStatus, PreferenceLevel, SessionShape } from "@/lib/constants";
import { PREFERENCE_LEVEL, SESSION_SHAPE } from "@/lib/constants";

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  collecting: { label: "Lagi Ngumpulin", className: "bg-teal/15 text-teal" },
  discovering: {
    label: "Lagi Nyari Tempat",
    className: "bg-primary/15 text-primary",
  },
  voting: { label: "Lagi Voting", className: "bg-danger/15 text-danger" },
  confirmed: { label: "Udah Fix!", className: "bg-success/15 text-success" },
  completed: {
    label: "Selesai",
    className: "bg-foreground/10 text-foreground/50",
  },
};

export const PREFERENCE_PILL_CONFIG: Record<
  PreferenceLevel,
  { label: string; selected: string; unselected: string }
> = {
  [PREFERENCE_LEVEL.strongly_prefer]: {
    label: "Bisa banget!",
    selected: "bg-primary text-white border-primary",
    unselected: "border-foreground/20 text-foreground/60",
  },
  [PREFERENCE_LEVEL.can_do]: {
    label: "Bisa",
    selected: "bg-teal text-white border-teal",
    unselected: "border-foreground/20 text-foreground/60",
  },
  [PREFERENCE_LEVEL.unavailable]: {
    label: "Gabisa",
    selected: "bg-danger text-white border-danger",
    unselected: "border-foreground/20 text-foreground/60",
  },
};

export const SHAPE_LABELS: Record<SessionShape, string> = {
  [SESSION_SHAPE.need_both]: "Cari semua",
  [SESSION_SHAPE.date_known]: "Tanggal fix",
  [SESSION_SHAPE.venue_known]: "Tempat fix",
};
