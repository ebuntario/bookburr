import { OpenRouter } from "@openrouter/sdk";
import { env } from "@/lib/env";

let _client: OpenRouter | null = null;

/** Returns the OpenRouter client, or null if OPENROUTER_API_KEY is not configured. */
export function getAIClient(): OpenRouter | null {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  if (!_client) {
    _client = new OpenRouter({ apiKey });
  }
  return _client;
}
