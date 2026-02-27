import type { SessionStatus, SessionMode } from "@/lib/constants";
import { STATUS_CONFIG, MODE_ICON } from "@/lib/ui-config";

interface SessionHeaderProps {
  name: string;
  mode: string;
  status: string;
  isHost: boolean;
}

export function SessionHeader({ name, mode, status, isHost }: SessionHeaderProps) {
  const statusConfig =
    STATUS_CONFIG[status as SessionStatus] ?? STATUS_CONFIG.collecting;
  const modeIcon = MODE_ICON[mode as SessionMode] ?? "🫂";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{modeIcon}</span>
          <h2 className="text-xl font-bold text-foreground leading-tight truncate">
            {name}
          </h2>
        </div>
        {isHost && (
          <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
            Host
          </span>
        )}
      </div>
      <span
        className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
      >
        {statusConfig.label}
      </span>
    </div>
  );
}
