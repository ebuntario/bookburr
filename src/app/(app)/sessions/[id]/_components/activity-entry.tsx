import {
  SparklesIcon,
  HandRaisedIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ArrowPathIcon,
  TrophyIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export interface ActivityEntryData {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
}

const ACTIVITY_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; getMessage: (actor: string, m: Record<string, string>) => string }
> = {
  session_created: {
    icon: SparklesIcon,
    getMessage: (actor) => `${actor} bikin bukber`,
  },
  joined: {
    icon: HandRaisedIcon,
    getMessage: (actor) => `${actor} baru join!`,
  },
  voted: {
    icon: CheckBadgeIcon,
    getMessage: (actor) => `${actor} udah vote`,
  },
  suggested_venue: {
    icon: MapPinIcon,
    getMessage: (actor, m) => `${actor} nemu ${m.venueName ?? "venue baru"}`,
  },
  status_changed: {
    icon: ArrowPathIcon,
    getMessage: (_actor, m) => `Status berubah: ${m.to ?? ""}`,
  },
  milestone: {
    icon: TrophyIcon,
    getMessage: (_actor, m) => m.message ?? "Milestone!",
  },
  confirmed: {
    icon: SparklesIcon,
    getMessage: (_actor, m) =>
      `Bukber confirmed di ${m.venueName ?? "sini"}!`,
  },
  date_suggested: {
    icon: CalendarDaysIcon,
    getMessage: (actor, m) => {
      if (m.date) {
        const d = new Date(m.date + "T00:00:00");
        const formatted = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        return `${actor} suggest tanggal ${formatted}`;
      }
      return `${actor} suggest tanggal baru`;
    },
  },
  date_removed: {
    icon: CalendarDaysIcon,
    getMessage: (actor, m) => {
      if (m.date) {
        const d = new Date(m.date + "T00:00:00");
        const formatted = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        return `${actor} hapus tanggal ${formatted}`;
      }
      return `${actor} hapus tanggal`;
    },
  },
  dates_locked_changed: {
    icon: LockClosedIcon,
    getMessage: (actor, m) =>
      m.locked === "true" ? `${actor} kunci tanggal` : `${actor} buka kunci tanggal`,
  },
};

function getDisplayName(name: string | null, email: string | null): string {
  if (name) return name;
  if (email) return email.split("@")[0];
  return "Seseorang";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} hari lalu`;
  if (diffHour > 0) return `${diffHour} jam lalu`;
  if (diffMin > 0) return `${diffMin} menit lalu`;
  return "baru saja";
}

interface ActivityEntryProps {
  entry: ActivityEntryData;
  compact?: boolean;
}

export function ActivityEntry({ entry, compact = false }: ActivityEntryProps) {
  const actor = getDisplayName(entry.actorName, entry.actorEmail);
  const m = (entry.metadata as Record<string, string>) ?? {};
  const config = ACTIVITY_CONFIG[entry.type] ?? {
    icon: DocumentTextIcon,
    getMessage: (a: string) => `${a} melakukan sesuatu`,
  };
  const text = config.getMessage(actor, m);
  const relTime = formatRelativeTime(entry.createdAt);

  return (
    <div
      className={`flex items-start gap-3 ${compact ? "px-4 py-3" : "px-0 py-3"}`}
    >
      {/* Avatar or icon */}
      <div className="shrink-0 mt-0.5">
        {entry.actorImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.actorImage}
            alt={actor}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10">
            <config.icon className="h-3.5 w-3.5 text-foreground/60" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{text}</p>
        <p className="text-xs text-foreground/40 mt-0.5">{relTime}</p>
      </div>
    </div>
  );
}
