"use client";

import { useState } from "react";
import { ActivityEntry, type ActivityEntryData } from "./activity-entry";
import { ActivityFeed } from "./activity-feed";

interface ActivityPreviewProps {
  sessionId: string;
  activities: ActivityEntryData[];
}

export function ActivityPreview({ sessionId, activities }: ActivityPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground/60">
          Aktivitas Terkini
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-foreground/10 bg-white px-5 py-6 text-center">
          <span className="text-xl">✨</span>
          <p className="text-sm text-foreground/40">
            Baru mulai nih! Aktivitas bakal muncul di sini
          </p>
        </div>
      </div>
    );
  }

  if (expanded) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground/60">
            Aktivitas Terkini
          </h3>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-foreground/40"
          >
            Tutup
          </button>
        </div>
        <ActivityFeed sessionId={sessionId} initialEntries={activities} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground/60">
          Aktivitas Terkini
        </h3>
        {activities.length >= 5 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-medium text-primary"
          >
            Lihat semua
          </button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-foreground/8 rounded-2xl border border-foreground/10 bg-white">
        {activities.slice(0, 5).map((entry) => (
          <ActivityEntry key={entry.id} entry={entry} compact />
        ))}
      </div>
    </div>
  );
}
