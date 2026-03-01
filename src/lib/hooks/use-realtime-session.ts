"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type SessionRealtimeEvent =
  | "member_joined"
  | "votes_updated"
  | "venue_suggested"
  | "reaction_changed"
  | "status_changed"
  | "venue_voted"
  | "date_suggested"
  | "date_removed"
  | "dates_locked_changed";

interface SessionEventPayload {
  event: SessionRealtimeEvent;
  sessionId: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Subscribes to real-time events on the session channel.
 * Silently no-ops if Supabase is not configured.
 */
export function useRealtimeSession(
  sessionId: string,
  onEvent: (payload: SessionEventPayload) => void,
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel(`session:${sessionId}`);

    channel
      .on("broadcast", { event: "*" }, (msg) => {
        onEventRef.current(msg.payload as SessionEventPayload);
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [sessionId]);
}
