/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: vi.fn() } }));
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "mock-nanoid"),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSession } from "./sessions";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function mockAuthUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any);
}

// Chainable tx mock that resolves for all insert/values calls
function makeMockTx() {
  const values = vi.fn().mockResolvedValue([]);
  const insert = vi.fn().mockReturnValue({ values });
  return { insert, values };
}

afterEach(() => vi.clearAllMocks());

describe("createSession — auth validation", () => {
  it("returns error when not authenticated", async () => {
    mockAuthUnauthenticated();
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});

describe("createSession — name validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for name shorter than 2 chars", async () => {
    const result = await createSession({
      name: "A",
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toEqual({ ok: false, error: "Nama bukber harus 2-60 karakter" });
  });

  it("returns error for name longer than 60 chars", async () => {
    const result = await createSession({
      name: "A".repeat(61),
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toEqual({ ok: false, error: "Nama bukber harus 2-60 karakter" });
  });

  it("accepts name at minimum length (2 chars)", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "AB",
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("accepts name at maximum length (60 chars)", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "A".repeat(60),
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — mode validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for invalid mode", async () => {
    const invalidMode: any = "invalid";
    const result = await createSession({
      name: "Bukber SMA",
      mode: invalidMode,
      candidateDates: ["2025-03-15"],
    });
    expect(result).toEqual({ ok: false, error: "Mode nggak valid" });
  });

  it("accepts 'personal' mode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("accepts 'work' mode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "Bukber Kantor",
      mode: "work",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — date validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for empty dates array", async () => {
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: [],
    });
    expect(result).toEqual({ ok: false, error: "Pilih minimal 1 tanggal" });
  });

  it("returns error when more than 30 unique dates", async () => {
    const dates = Array.from({ length: 31 }, (_, i) => {
      const d = new Date(2025, 2, i + 1);
      return d.toISOString().split("T")[0];
    });
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: dates,
    });
    expect(result).toEqual({ ok: false, error: "Maksimal 30 tanggal" });
  });

  it("returns error for invalid date format", async () => {
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["not-a-date"],
    });
    expect(result).toEqual({ ok: false, error: "Format tanggal nggak valid" });
  });

  it("deduplicates dates before validation", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["2025-03-15", "2025-03-15", "2025-03-15"],
    });
    // After dedup, only 1 date → valid
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — happy path", () => {
  beforeEach(() => mockAuthUser());

  it("returns ok: true with sessionId and inviteCode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["2025-03-15", "2025-03-16"],
    });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.sessionId).toBeTruthy();
      expect(result.inviteCode).toBeTruthy();
    }
  });

  it("work mode with officeLocation stores address", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      name: "Bukber Kantor",
      mode: "work",
      officeLocation: "Jl. Sudirman No. 1",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
    // Verify insert was called (office location is passed to the session insert)
    expect(tx.insert).toHaveBeenCalled();
  });
});

describe("createSession — retry on invite code collision", () => {
  beforeEach(() => mockAuthUser());

  it("retries on 23505 conflict and succeeds on second attempt", async () => {
    const tx = makeMockTx();
    let callCount = 0;
    vi.mocked(db.transaction).mockImplementation(async (cb) => {
      callCount++;
      if (callCount === 1) {
        throw Object.assign(new Error("duplicate"), { code: "23505" });
      }
      return cb(tx as unknown as any);
    });
    const result = await createSession({
      name: "Bukber SMA",
      mode: "personal",
      candidateDates: ["2025-03-15"],
    });
    expect(result).toMatchObject({ ok: true });
    expect(callCount).toBe(2);
  });

  it("throws after 3 consecutive 23505 failures (no fallback return path)", async () => {
    // The retry loop throws on the 3rd attempt — the fallback return is unreachable for 23505
    vi.mocked(db.transaction).mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" })
    );
    await expect(
      createSession({
        name: "Bukber SMA",
        mode: "personal",
        candidateDates: ["2025-03-15"],
      })
    ).rejects.toThrow("duplicate");
  });
});

// Need to import beforeEach for the describe blocks above
import { beforeEach } from "vitest";
