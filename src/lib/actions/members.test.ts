/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: vi.fn() } }));
vi.mock("nanoid", () => {
  let c = 0;
  return { nanoid: vi.fn(() => `mock-id-${++c}`) };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/broadcast", () => ({
  broadcastSessionEvent: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinSession } from "./members";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function mockTx(tx: any) {
  vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx));
}

/** Thenable-with-limit */
function tw(result: any[]) {
  return {
    then(resolve: (v: unknown) => void) { resolve(result); },
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Tx mock for joinSession.
 * Select chain order: session → validateDateOptions → (optional: insertedDates query)
 */
function makeJoinTx(opts: {
  session?: any[] | null;
  validDates?: any[];
  insertedDates?: any[];
}) {
  const seq = [
    opts.session ?? [],
    opts.validDates ?? [],
    opts.insertedDates ?? [],
  ];
  let i = 0;

  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => tw(seq[i++] ?? [])),
      }),
    })),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      }),
    }),
  };
}

afterEach(() => vi.clearAllMocks());

const validInput = {
  sessionId: "s1",
  votes: [{ dateOptionId: "d1", preferenceLevel: "can_do" as const }],
};

// ── Input validation (runs before auth) ────────────────────────────────────

describe("joinSession — input validation", () => {
  it("returns error for missing sessionId", async () => {
    const result = await joinSession({ ...validInput, sessionId: "" });
    expect(result).toEqual({ ok: false, error: "Session ID nggak valid" });
  });

  it("returns error for invalid preference level in votes", async () => {
    const result = await joinSession({
      ...validInput,
      votes: [{ dateOptionId: "d1", preferenceLevel: "invalid" as any }],
    });
    expect(result).toEqual({ ok: false, error: "Preference level nggak valid" });
  });

  it("returns error for too many new dates", async () => {
    const newDates = Array.from({ length: 11 }, (_, i) => ({
      date: `2026-03-${String(i + 5).padStart(2, "0")}`,
      preferenceLevel: "can_do" as const,
    }));
    const result = await joinSession({ ...validInput, newDates });
    expect(result).toEqual({ ok: false, error: "Maksimal 10 tanggal baru per join" });
  });

  it("returns error for invalid date format in newDates", async () => {
    const result = await joinSession({
      ...validInput,
      newDates: [{ date: "not-valid", preferenceLevel: "can_do" }],
    });
    expect(result).toEqual({ ok: false, error: "Format tanggal nggak valid" });
  });

  it("returns error for invalid preference in newDates", async () => {
    const result = await joinSession({
      ...validInput,
      newDates: [{ date: "2026-03-15", preferenceLevel: "bad" as any }],
    });
    expect(result).toEqual({ ok: false, error: "Preference level nggak valid" });
  });

  it("returns error for non-integer budget", async () => {
    const result = await joinSession({ ...validInput, budgetCeiling: 99.5 });
    expect(result).toEqual({ ok: false, error: "Budget nggak valid" });
  });

  it("returns error for budget <= 0", async () => {
    const result = await joinSession({ ...validInput, budgetCeiling: 0 });
    expect(result).toEqual({ ok: false, error: "Budget nggak valid" });
  });

  it("returns error for budget exceeding max (10M)", async () => {
    const result = await joinSession({ ...validInput, budgetCeiling: 10_000_001 });
    expect(result).toEqual({ ok: false, error: "Budget nggak valid" });
  });

  it("passes validation for valid budget", async () => {
    mockAuthUser();
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await joinSession({ ...validInput, budgetCeiling: 500_000 });
    expect(result).toMatchObject({ ok: true });
  });
});

// ── Auth ────────────────────────────────────────────────────────────────────

describe("joinSession — auth", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});

// ── Session checks ─────────────────────────────────────────────────────────

describe("joinSession — session checks", () => {
  beforeEach(() => mockAuthUser());

  it("returns error when session not found", async () => {
    const tx = makeJoinTx({ session: [] });
    mockTx(tx);
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: false, error: "Bukber nggak ditemukan" });
  });

  it("returns error when session is closed (voting)", async () => {
    const tx = makeJoinTx({
      session: [{ status: "voting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
    });
    mockTx(tx);
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: false, error: "Bukber udah ditutup, nggak bisa join lagi" });
  });

  it("returns error when dates locked and trying to suggest new dates", async () => {
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: true, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await joinSession({
      ...validInput,
      newDates: [{ date: "2026-03-20", preferenceLevel: "can_do" }],
    });
    expect(result).toEqual({ ok: false, error: "Tanggal udah dikunci, nggak bisa suggest tanggal baru" });
  });

  it("returns error when date options are invalid", async () => {
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [], // none found
    });
    mockTx(tx);
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: false, error: "Data tanggal nggak valid" });
  });
});

// ── Happy path ─────────────────────────────────────────────────────────────

describe("joinSession — happy path", () => {
  beforeEach(() => mockAuthUser());

  it("succeeds with valid votes", async () => {
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: true, sessionId: "s1" });
  });

  it("succeeds with no votes", async () => {
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
    });
    mockTx(tx);
    const result = await joinSession({ sessionId: "s1", votes: [] });
    expect(result).toEqual({ ok: true, sessionId: "s1" });
  });

  it("succeeds with referenceLocation", async () => {
    const tx = makeJoinTx({
      session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await joinSession({
      ...validInput,
      referenceLocation: "Jakarta Selatan",
      lat: -6.26,
      lng: 106.81,
    });
    expect(result).toEqual({ ok: true, sessionId: "s1" });
  });

  it("succeeds in discovering status", async () => {
    const tx = makeJoinTx({
      session: [{ status: "discovering", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      validDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await joinSession(validInput);
    expect(result).toEqual({ ok: true, sessionId: "s1" });
  });
});

// ── New dates during join ───────────────────────────────────────────────────

describe("joinSession — new dates during join", () => {
  beforeEach(() => mockAuthUser());

  it("inserts new dates and builds votes from them", async () => {
    // This tx needs extra selects for: session, validateDateOptions (skipped for 0 existing votes),
    // then inserted dates query after insert
    const seq = [
      // 1st: session lookup
      [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      // 2nd: validateDateOptions (0 existing votes, so 0 uniqueVoteIds → skipped)
      // 3rd: insertedDates query
      [{ id: "new-d1", date: "2026-03-20" }],
    ];
    let i = 0;

    const tx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => tw(seq[i++] ?? [])),
        }),
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    mockTx(tx);

    const result = await joinSession({
      sessionId: "s1",
      votes: [],
      newDates: [{ date: "2026-03-20", preferenceLevel: "strongly_prefer" }],
    });
    expect(result).toEqual({ ok: true, sessionId: "s1" });
    // insert is called for: new date options, member, date votes (from new dates), activity
    expect(tx.insert).toHaveBeenCalled();
  });
});

// ── PG 23505 idempotent join ───────────────────────────────────────────────

describe("joinSession — duplicate key (PG 23505)", () => {
  it("treats duplicate member insert as success (idempotent join)", async () => {
    mockAuthUser();
    vi.mocked(db.transaction).mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" }),
    );
    const result = await joinSession(validInput);
    // Deliberate design: 23505 means the user already joined, which is fine
    expect(result).toEqual({ ok: true, sessionId: "s1" });
  });

  it("re-throws non-23505 errors via mapActionError", async () => {
    mockAuthUser();
    vi.mocked(db.transaction).mockRejectedValue(new Error("SOMETHING_ELSE"));
    // Non-mapped error should be rethrown
    await expect(joinSession(validInput)).rejects.toThrow("SOMETHING_ELSE");
  });
});
