"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import type { SessionStatus, SessionMode } from "@/lib/constants";
import { STATUS_CONFIG, MODE_ICON } from "@/lib/ui-config";

interface SessionCardProps {
  id: string;
  name: string;
  mode: string;
  status: string;
  memberCount: number;
  createdAt: string;
}

export function SessionCard({
  id,
  name,
  mode,
  status,
  memberCount,
  createdAt,
}: SessionCardProps) {
  const statusConfig =
    STATUS_CONFIG[status as SessionStatus] ?? STATUS_CONFIG.collecting;
  const modeIcon = MODE_ICON[mode as SessionMode] ?? "🫂";

  return (
    <Link href={`/sessions/${id}`}>
      <Card className="rounded-2xl border border-foreground/10 bg-white p-0 transition-shadow hover:shadow-md">
        <Card.Header className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{modeIcon}</span>
            <h3 className="font-semibold text-foreground">{name}</h3>
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
          <span className="text-sm text-foreground/50">
            {new Date(createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </Card.Content>
      </Card>
    </Link>
  );
}
