type LogLevel = "error" | "warn";

interface LogPayload {
  message: string;
  context?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, payload: LogPayload): void {
  const entry = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  });
  if (level === "error") {
    console.error(entry);
  } else {
    console.warn(entry);
  }
}

export function logError(context: string, err: unknown, extra?: Record<string, unknown>): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  log("error", { message, context, stack, ...extra });
}

export function logWarn(context: string, message: string, extra?: Record<string, unknown>): void {
  log("warn", { message, context, ...extra });
}
