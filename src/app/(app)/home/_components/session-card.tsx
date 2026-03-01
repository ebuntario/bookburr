"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import type { SessionStatus } from "@/lib/constants";
import { STATUS_CONFIG } from "@/lib/ui-config";
import { ModeIcon } from "@/components/mode-icon";

interface SessionCardProps {
  id: string;
  name: string;
  mode: string;
  sessionShape?: string;
  status: string;
  memberCount: number;
  createdAt: string;
  earliestDate?: string | null;
  latestDate?: string | null;
}

function formatDateRange(earliest: string | null | undefined, latest: string | null | undefined): string | null {
  if (!earliest || !latest) return null;
  const d1 = new Date(earliest + "T00:00:00");
  const d2 = new Date(latest + "T00:00:00");
  const day1 = d1.toLocaleDateString("id-ID", { day: "numeric" });
  const mon1 = d1.toLocaleDateString("id-ID", { month: "short" });
  const day2 = d2.toLocaleDateString("id-ID", { day: "numeric" });
  const mon2 = d2.toLocaleDateString("id-ID", { month: "short" });
  if (earliest === latest) return `${day1} ${mon1}`;
  return mon1 === mon2 ? `${day1}–${day2} ${mon1}` : `${day1} ${mon1}–${day2} ${mon2}`;
}

const SHAPE_LABELS: Record<string, string> = {
  need_both: "Cari semua",
  date_known: "Tanggal fix",
  venue_known: "Tempat fix",
};

export function SessionCard({
  id,
  name,
  mode,
  sessionShape,
  status,
  memberCount,
  createdAt,
  earliestDate,
  latestDate,
}: SessionCardProps) {
  const statusConfig =
    STATUS_CONFIG[status as SessionStatus] ?? STATUS_CONFIG.collecting;
  const dateRange = formatDateRange(earliestDate, latestDate);
  const dateDisplay = dateRange ?? new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  return (
    <Link href={`/sessions/${id}`}>
      <Card className="rounded-2xl border border-foreground/10 bg-white p-0 transition-shadow hover:shadow-md">
        <Card.Header className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <ModeIcon mode={mode} className="h-5 w-5 text-foreground/60" />
            <h3 className="font-heading font-medium text-foreground">{name}</h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </Card.Header>
        <Card.Content className="flex items-center gap-4 px-5 pb-4">
          <span className="text-sm text-foreground/50">
            {memberCount} orang
          </span>
          <span className="text-foreground/20">·</span>
          <span className="text-sm text-foreground/50">{dateDisplay}</span>
          {sessionShape && sessionShape !== "need_both" && (
            <>
              <span className="text-foreground/20">·</span>
              <span className="text-xs text-primary/70">
                {SHAPE_LABELS[sessionShape]}
              </span>
            </>
          )}
        </Card.Content>
      </Card>
    </Link>
  );
}
