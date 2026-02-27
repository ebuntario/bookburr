import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

interface BroadcastPayload {
  event: string;
  sessionId: string;
  [key: string]: unknown;
}

/**
 * Fire-and-forget broadcast to a session channel.
 * No-ops silently if Supabase is not configured.
 */
export async function broadcastSessionEvent(
  payload: BroadcastPayload,
): Promise<void> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return;

  try {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const channel = supabase.channel(`session:${payload.sessionId}`);
    await channel.send({
      type: "broadcast",
      event: payload.event,
      payload,
    });
    await supabase.removeChannel(channel);
  } catch {
    // Silently ignore — real-time failures should never break mutations
  }
}
