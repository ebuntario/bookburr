"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeSession } from "@/lib/hooks/use-realtime-session";
import { toastSlideUp, durations } from "@/lib/motion-variants";
import type { SessionRealtimeEvent } from "@/lib/hooks/use-realtime-session";

const EVENT_MESSAGES: Record<SessionRealtimeEvent, string> = {
  member_joined: "Ada yang baru join! 👋",
  votes_updated: "Ada yang baru vote tanggal 🗳️",
  venue_suggested: "Ada venue baru yang disuggest! 📍",
  reaction_changed: "Ada yang bereaksi ke venue 🔥",
  status_changed: "Status session berubah 🔄",
  venue_voted: "Ada yang vote venue! 🏆",
  date_suggested: "Ada yang suggest tanggal baru 📅",
  date_removed: "Host hapus tanggal 📅",
  dates_locked_changed: "Host ubah kunci tanggal 🔒",
};

interface RealtimeDashboardWrapperProps {
  sessionId: string;
  children: React.ReactNode;
}

export function RealtimeDashboardWrapper({
  sessionId,
  children,
}: RealtimeDashboardWrapperProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEventsRef = useRef<string[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleEvent = useCallback(
    (payload: { event: SessionRealtimeEvent; message?: string }) => {
      const message =
        payload.message ??
        EVENT_MESSAGES[payload.event] ??
        "Ada update baru!";

      pendingEventsRef.current.push(message);

      // Debounce: coalesce events within 3 seconds
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const events = pendingEventsRef.current;
        pendingEventsRef.current = [];

        const toastMsg =
          events.length === 1
            ? events[0]
            : `${events.length} update baru!`;

        showToast(toastMsg);
        router.refresh();
      }, 3000);
    },
    [router, showToast],
  );

  useRealtimeSession(sessionId, handleEvent);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <>
      {children}

      {/* Debounced toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            {...toastSlideUp}
            transition={{ duration: durations.normal }}
            className="fixed bottom-44 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 shadow-lg">
              <p className="text-xs font-medium text-background">{toast}</p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-background/60 text-xs"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
