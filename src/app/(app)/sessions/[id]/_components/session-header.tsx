import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { SessionStatus } from "@/lib/constants";
import { STATUS_CONFIG } from "@/lib/ui-config";
import { ModeIcon } from "@/components/mode-icon";

interface SessionHeaderProps {
  name: string;
  mode: string;
  status: string;
  isHost: boolean;
}

export function SessionHeader({ name, mode, status, isHost }: SessionHeaderProps) {
  const statusConfig =
    STATUS_CONFIG[status as SessionStatus] ?? STATUS_CONFIG.collecting;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/home" className="shrink-0 rounded-lg p-2.5 -ml-2.5 text-foreground/50 transition-colors active:bg-foreground/5">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <ModeIcon mode={mode} className="h-6 w-6 shrink-0 text-foreground/60" />
          <h2 className="text-xl font-heading font-semibold text-foreground leading-tight truncate">
            {name}
          </h2>
        </div>
        {isHost && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
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
