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

function getActivityMessage(
  type: string,
  actorName: string,
  metadata: unknown,
): { icon: string; text: string } {
  const m = (metadata as Record<string, string>) ?? {};

  switch (type) {
    case "session_created":
      return { icon: "🎉", text: `${actorName} bikin bukber` };
    case "joined":
      return { icon: "👋", text: `${actorName} baru join!` };
    case "voted":
      return { icon: "🗳️", text: `${actorName} udah vote` };
    case "suggested_venue":
      return { icon: "📍", text: `${actorName} nemu ${m.venueName ?? "venue baru"}` };
    case "status_changed":
      return { icon: "🔄", text: `Status berubah: ${m.to ?? ""}` };
    case "milestone":
      return { icon: "🎯", text: m.message ?? "Milestone!" };
    case "confirmed":
      return { icon: "🎉", text: `Bukber confirmed di ${m.venueName ?? "sini"}!` };
    default:
      return { icon: "📝", text: `${actorName} melakukan sesuatu` };
  }
}

interface ActivityEntry {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
}

interface ActivityPreviewProps {
  activities: ActivityEntry[];
}

export function ActivityPreview({ activities }: ActivityPreviewProps) {
  if (activities.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground/60">
        Aktivitas Terkini
      </h3>
      <div className="flex flex-col divide-y divide-foreground/8 rounded-2xl border border-foreground/10 bg-white">
        {activities.map((entry) => {
          const actorName = getDisplayName(entry.actorName, entry.actorEmail);
          const { icon, text } = getActivityMessage(
            entry.type,
            actorName,
            entry.metadata,
          );
          const relTime = formatRelativeTime(entry.createdAt);

          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-4 py-3"
            >
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{text}</p>
                <p className="text-xs text-foreground/40 mt-0.5">{relTime}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
