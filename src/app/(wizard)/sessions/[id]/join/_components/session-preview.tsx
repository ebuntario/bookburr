import Image from "next/image";
import Link from "next/link";
import { SESSION_SHAPE, SESSION_STATUS } from "@/lib/constants";
import type { SessionStatus, SessionShape } from "@/lib/constants";
import { STATUS_CONFIG, SHAPE_LABELS } from "@/lib/ui-config";
import { ModeIcon } from "@/components/mode-icon";

interface SessionPreviewProps {
  sessionId: string;
  data: {
    name: string;
    mode: string;
    sessionShape: string | null;
    status: string;
    hostName: string | null;
    memberCount: number;
    earliestDate: string | null;
    latestDate: string | null;
    confirmedDate: string | null;
  };
}

function formatDateRange(
  earliest: string | null,
  latest: string | null,
): string | null {
  if (!earliest || !latest) return null;
  const d1 = new Date(earliest + "T00:00:00");
  const d2 = new Date(latest + "T00:00:00");
  const day1 = d1.toLocaleDateString("id-ID", { day: "numeric" });
  const mon1 = d1.toLocaleDateString("id-ID", { month: "short" });
  const day2 = d2.toLocaleDateString("id-ID", { day: "numeric" });
  const mon2 = d2.toLocaleDateString("id-ID", { month: "short" });
  if (earliest === latest) return `${day1} ${mon1}`;
  return mon1 === mon2
    ? `${day1}–${day2} ${mon1}`
    : `${day1} ${mon1} – ${day2} ${mon2}`;
}

function formatConfirmedDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function SessionPreview({ sessionId, data }: SessionPreviewProps) {
  const statusConfig =
    STATUS_CONFIG[data.status as SessionStatus] ?? STATUS_CONFIG.collecting;
  const isCompleted = data.status === SESSION_STATUS.completed;
  const isConfirmed = data.status === SESSION_STATUS.confirmed;
  const isJoinable = !isCompleted;

  const dateRange = formatDateRange(data.earliestDate, data.latestDate);
  const shape = data.sessionShape as SessionShape | null;
  const showShape = shape && shape !== SESSION_SHAPE.need_both;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/sessions/${sessionId}/join`)}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      {/* Brand mark */}
      <Image
        src="/brand/icon-color.svg"
        alt=""
        width={44}
        height={44}
        className="mb-6"
      />

      {/* Invitation label */}
      <p className="mb-3 text-sm font-medium tracking-wide text-foreground/40 uppercase">
        Kamu diundang ke
      </p>

      {/* Session card */}
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-5">
        {/* Header: mode + name + status */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ModeIcon mode={data.mode} className="h-5 w-5 shrink-0 text-foreground/50" />
            <h1 className="font-heading text-xl font-semibold leading-tight text-foreground">
              {data.name}
            </h1>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-foreground/8" />

        {/* Meta rows */}
        <div className="flex flex-col gap-2.5">
          {/* Host */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-foreground/40">Dibikin sama</span>
            <span className="text-sm font-medium text-foreground/70">
              {data.hostName ?? "Seseorang"}
            </span>
          </div>

          {/* Member count */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-foreground/40">Yang udah join</span>
            <span className="text-sm font-medium text-foreground/70">
              {data.memberCount} orang
            </span>
          </div>

          {/* Date range */}
          {dateRange && (
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-foreground/40">Tanggal</span>
              <span className="text-sm font-medium text-foreground/70">
                {dateRange}
              </span>
            </div>
          )}

          {/* Confirmed date */}
          {isConfirmed && data.confirmedDate && (
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-foreground/40">Fix tanggal</span>
              <span className="text-sm font-medium text-success">
                {formatConfirmedDate(data.confirmedDate)}
              </span>
            </div>
          )}

          {/* Shape label */}
          {showShape && (
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-foreground/40">Tipe</span>
              <span className="text-xs font-medium text-primary/70">
                {SHAPE_LABELS[shape]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA area */}
      <div className="mt-6 w-full max-w-sm">
        {isJoinable && (
          <>
            <Link
              href={loginUrl}
              className="block w-full rounded-xl bg-primary py-3.5 text-center font-medium text-white transition-colors active:bg-primary/90"
            >
              Gabung sekarang
            </Link>
            <p className="mt-3 text-center text-sm text-foreground/40">
              Masuk dulu buat lanjut ya
            </p>
          </>
        )}

        {isCompleted && (
          <div className="rounded-xl border border-foreground/10 bg-surface px-5 py-4 text-center">
            <p className="font-heading text-base font-medium text-foreground/50">
              Bukber ini udah selesai
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
