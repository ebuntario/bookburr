"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadMoreActivity } from "@/lib/actions/activity";
import { ActivityEntry, type ActivityEntryData } from "./activity-entry";

const PAGE_SIZE = 10;

interface ActivityFeedProps {
  sessionId: string;
  initialEntries: ActivityEntryData[];
}

export function ActivityFeed({ sessionId, initialEntries }: ActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntryData[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialEntries.length >= PAGE_SIZE);

  const handleLoadMore = async () => {
    const last = entries[entries.length - 1];
    if (!last) return;
    setLoading(true);
    const older = await loadMoreActivity(sessionId, last.createdAt.toISOString());
    setLoading(false);
    if (older.length < PAGE_SIZE) setHasMore(false);
    if (older.length > 0) {
      setEntries((prev) => [...prev, ...older]);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground/60">
          Aktivitas
        </h3>
        <p className="text-sm text-foreground/40 text-center py-4">
          Belum ada aktivitas nih
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground/60">Aktivitas</h3>

      <div className="flex flex-col divide-y divide-foreground/8 rounded-2xl border border-foreground/10 bg-white overflow-hidden">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ActivityEntry entry={entry} compact />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading}
          className="text-center text-sm text-gold font-medium py-1 disabled:opacity-40"
        >
          {loading ? "Lagi loading..." : "Lihat lebih banyak"}
        </button>
      )}
    </div>
  );
}
