import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logError, logWarn } from "./logger";

describe("logError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls console.error with JSON payload", () => {
    logError("test-context", new Error("something broke"));
    expect(console.error).toHaveBeenCalledOnce();
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("something broke");
    expect(parsed.context).toBe("test-context");
  });

  it("includes stack trace for Error objects", () => {
    const err = new Error("stack test");
    logError("ctx", err);
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.stack).toBeDefined();
    expect(parsed.stack).toContain("Error: stack test");
  });

  it("stringifies non-Error objects as message", () => {
    logError("ctx", "raw string error");
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.message).toBe("raw string error");
    expect(parsed.stack).toBeUndefined();
  });

  it("includes extra fields when provided", () => {
    logError("ctx", new Error("err"), { userId: "u1", sessionId: "s1" });
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.userId).toBe("u1");
    expect(parsed.sessionId).toBe("s1");
  });

  it("includes timestamp in ISO format", () => {
    logError("ctx", new Error("err"));
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("logWarn", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls console.warn with JSON payload", () => {
    logWarn("warn-context", "something suspicious");
    expect(console.warn).toHaveBeenCalledOnce();
    const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("something suspicious");
    expect(parsed.context).toBe("warn-context");
  });

  it("includes extra fields when provided", () => {
    logWarn("ctx", "slow query", { durationMs: 3000 });
    const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.durationMs).toBe(3000);
  });

  it("includes timestamp", () => {
    logWarn("ctx", "test");
    const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(arg);
    expect(parsed.timestamp).toBeDefined();
  });

  it("does NOT call console.error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    logWarn("ctx", "test warn");
    expect(console.error).not.toHaveBeenCalled();
  });
});
