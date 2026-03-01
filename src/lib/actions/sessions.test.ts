/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

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

// Chainable tx mock that resolves for all insert/values/update/set/where/onConflictDoNothing calls
function makeMockTx() {
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const onConflictDoNothing = vi.fn().mockResolvedValue([]);
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  const insert = vi.fn().mockReturnValue({ values });
  return { insert, values, update, set, where, onConflictDoNothing };
}

const validInput = {
  name: "Bukber SMA",
  mode: "personal" as const,
  sessionShape: "need_both" as const,
  seededDates: ["2026-03-15"],
};

afterEach(() => vi.clearAllMocks());

describe("createSession — auth validation", () => {
  it("returns error when not authenticated", async () => {
    mockAuthUnauthenticated();
    const result = await createSession(validInput);
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});

describe("createSession — name validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for name shorter than 2 chars", async () => {
    const result = await createSession({ ...validInput, name: "A" });
    expect(result).toEqual({ ok: false, error: "Nama bukber harus 2-60 karakter" });
  });

  it("returns error for name longer than 60 chars", async () => {
    const result = await createSession({ ...validInput, name: "A".repeat(61) });
    expect(result).toEqual({ ok: false, error: "Nama bukber harus 2-60 karakter" });
  });

  it("accepts name at minimum length (2 chars)", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({ ...validInput, name: "AB" });
    expect(result).toMatchObject({ ok: true });
  });

  it("accepts name at maximum length (60 chars)", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({ ...validInput, name: "A".repeat(60) });
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — mode validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for invalid mode", async () => {
    const invalidMode: any = "invalid";
    const result = await createSession({ ...validInput, mode: invalidMode });
    expect(result).toEqual({ ok: false, error: "Mode nggak valid" });
  });

  it("accepts 'personal' mode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession(validInput);
    expect(result).toMatchObject({ ok: true });
  });

  it("accepts 'work' mode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({ ...validInput, mode: "work" });
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — shape validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error for invalid shape", async () => {
    const result = await createSession({ ...validInput, sessionShape: "invalid" as any });
    expect(result).toEqual({ ok: false, error: "Session shape nggak valid" });
  });

  it("returns error for date_known without confirmedDate", async () => {
    const result = await createSession({
      ...validInput,
      sessionShape: "date_known",
    });
    expect(result).toEqual({ ok: false, error: "Tanggal wajib diisi untuk date_known" });
  });

  it("returns error for venue_known without presetVenueName", async () => {
    const result = await createSession({
      ...validInput,
      sessionShape: "venue_known",
    });
    expect(result).toEqual({ ok: false, error: "Nama venue wajib diisi" });
  });
});

describe("createSession — seeded date validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error when more than 30 seeded dates", async () => {
    const manyDates = Array.from({ length: 31 }, (_, i) => {
      const d = new Date(2026, 2, 1 + i);
      return d.toISOString().split("T")[0];
    });
    const result = await createSession({
      ...validInput,
      seededDates: manyDates,
    });
    expect(result).toEqual({ ok: false, error: "Maksimal 30 tanggal" });
  });

  it("accepts session with no seeded dates (need_both)", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession({
      ...validInput,
      seededDates: [],
    });
    expect(result).toMatchObject({ ok: true });
  });
});

describe("createSession — happy path", () => {
  beforeEach(() => mockAuthUser());

  it("returns ok: true with sessionId and inviteCode", async () => {
    const tx = makeMockTx();
    vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as unknown as any));
    const result = await createSession(validInput);
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
      ...validInput,
      mode: "work",
      officeLocation: "Jl. Sudirman No. 1",
    });
    expect(result).toMatchObject({ ok: true });
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
    const result = await createSession(validInput);
    expect(result).toMatchObject({ ok: true });
    expect(callCount).toBe(2);
  });

  it("throws after 3 consecutive 23505 failures", async () => {
    vi.mocked(db.transaction).mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" })
    );
    await expect(
      createSession(validInput)
    ).rejects.toThrow("duplicate");
  });
});
