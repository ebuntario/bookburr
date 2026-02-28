import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { requireAuth, mapActionError, lockSessionForUpdate } from "./helpers";

describe("requireAuth", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns userId when session has user.id", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-123" } } as any);
    const userId = await requireAuth();
    expect(userId).toBe("user-123");
  });

  it("throws UNAUTHORIZED when auth() returns null", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue(null as any);
    await expect(requireAuth()).rejects.toThrow("UNAUTHORIZED");
  });

  it("throws UNAUTHORIZED when session has no user id", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);
    await expect(requireAuth()).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("mapActionError", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns mapped error when message is in errorMap", () => {
    const err = new Error("SESSION_NOT_FOUND");
    const result = mapActionError(err, { SESSION_NOT_FOUND: "Session ga ketemu" });
    expect(result).toEqual({ ok: false, error: "Session ga ketemu" });
  });

  it("re-throws and calls logError when message is not in map", () => {
    const err = new Error("SOME_UNKNOWN_ERROR");
    expect(() =>
      mapActionError(err, { SESSION_NOT_FOUND: "Session ga ketemu" })
    ).toThrow("SOME_UNKNOWN_ERROR");
    expect(logError).toHaveBeenCalledWith(
      "mapActionError",
      err,
      expect.objectContaining({ unmapped: "SOME_UNKNOWN_ERROR" })
    );
  });

  it("extracts 'unknown' as message for non-Error thrown values", () => {
    const result = mapActionError("raw string", { unknown: "Something went wrong" });
    expect(result).toEqual({ ok: false, error: "Something went wrong" });
  });

  it("re-throws non-Error values when not in errorMap", () => {
    expect(() => mapActionError("not-in-map", { foo: "bar" })).toThrow();
  });
});

describe("lockSessionForUpdate", () => {
  afterEach(() => vi.clearAllMocks());

  function makeMockTx(rows: unknown[]) {
    return {
      execute: vi.fn().mockResolvedValue({ rows }),
    } as unknown as Parameters<typeof lockSessionForUpdate>[0];
  }

  it("returns session row when host matches", async () => {
    const tx = makeMockTx([{ id: "s1", status: "collecting", host_id: "u1" }]);
    const row = await lockSessionForUpdate(tx, "s1", "u1");
    expect(row).toEqual({ id: "s1", status: "collecting", host_id: "u1" });
  });

  it("throws SESSION_NOT_FOUND when no rows returned", async () => {
    const tx = makeMockTx([]);
    await expect(lockSessionForUpdate(tx, "s1", "u1")).rejects.toThrow("SESSION_NOT_FOUND");
  });

  it("throws NOT_HOST when host_id does not match userId", async () => {
    const tx = makeMockTx([{ id: "s1", status: "collecting", host_id: "other-user" }]);
    await expect(lockSessionForUpdate(tx, "s1", "u1")).rejects.toThrow("NOT_HOST");
  });
});
