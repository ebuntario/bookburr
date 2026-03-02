/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach, beforeEach, beforeAll, afterAll } from "vitest";

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
import { revalidatePath } from "next/cache";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import { suggestDate, addDateOption, removeDateOption, toggleDatesLocked } from "./date-options";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function mockTx(tx: any) {
  vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx));
}

// Fix time to 2026-03-02 so isNotPast() is deterministic
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-02T12:00:00Z"));
});
afterAll(() => vi.useRealTimers());
afterEach(() => vi.clearAllMocks());

// ── Helpers ────────────────────────────────────────────────────────────────

/** Thenable-with-limit: satisfies both `await .where()` and `await .where().limit(1)` */
function tw(result: any[]) {
  return {
    then(resolve: (v: unknown) => void) { resolve(result); },
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Tx mock for suggestDate (member path).
 * select chain order: requireMember → session → getDateOptionCount
 */
function makeSuggestTx(opts: {
  member?: any[] | null;
  session?: any[] | null;
  dateCount?: number;
}) {
  const seq = [
    opts.member ?? [{ id: "member-1" }],
    opts.session ?? [],
    [{ value: opts.dateCount ?? 0 }],
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

/**
 * Tx mock for host actions (lockSessionForUpdate via tx.execute + subsequent selects).
 * selectSeq: ordered select results after the lock.
 */
function makeHostTx(opts: {
  lockRow?: any | null;
  selectSeq?: any[][];
}) {
  const lockRow = opts.lockRow;
  const seq = opts.selectSeq ?? [];
  let i = 0;

  return {
    execute: vi.fn().mockResolvedValue({ rows: lockRow ? [lockRow] : [] }),
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
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  };
}

const LOCK = { id: "s1", status: "collecting", host_id: "user-1", session_shape: "need_both" };

// ── suggestDate ────────────────────────────────────────────────────────────

describe("suggestDate", () => {
  describe("auth + validation", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });

    it("returns error for invalid date format", async () => {
      mockAuthUser();
      const result = await suggestDate("s1", "not-a-date");
      expect(result).toEqual({ ok: false, error: "Tanggal nggak valid" });
    });

    it("returns error for impossible date (month 13)", async () => {
      mockAuthUser();
      const result = await suggestDate("s1", "2026-13-01");
      expect(result).toEqual({ ok: false, error: "Tanggal nggak valid" });
    });

    it("returns error for past date", async () => {
      mockAuthUser();
      const result = await suggestDate("s1", "2026-03-01");
      expect(result).toEqual({ ok: false, error: "Nggak bisa pilih tanggal yang udah lewat" });
    });

    it("accepts today's date (not past)", async () => {
      mockAuthUser();
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-02");
      expect(result).toEqual({ ok: true });
    });
  });

  describe("session checks", () => {
    beforeEach(() => mockAuthUser());

    it("returns error when user is not a member", async () => {
      const tx = makeSuggestTx({ member: [] });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Lu belum join session ini" });
    });

    it("returns error when session not found", async () => {
      const tx = makeSuggestTx({ session: [] });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Session ga ketemu" });
    });

    it("returns error when session is in voting status", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "voting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Session udah ditutup" });
    });

    it("returns error when session is confirmed", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "confirmed", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Session udah ditutup" });
    });

    it("returns error when dates are locked", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: true, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Tanggal udah dikunci sama host" });
    });

    it("returns error when date before range start", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: "2026-03-10", dateRangeEnd: "2026-03-30" }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-05");
      expect(result).toEqual({ ok: false, error: "Tanggal di luar rentang yang tersedia" });
    });

    it("returns error when date after range end", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: "2026-03-10", dateRangeEnd: "2026-03-20" }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-25");
      expect(result).toEqual({ ok: false, error: "Tanggal di luar rentang yang tersedia" });
    });

    it("returns error when too many dates (45)", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
        dateCount: 45,
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Udah terlalu banyak tanggal di session ini" });
    });
  });

  describe("happy path", () => {
    beforeEach(() => mockAuthUser());

    it("succeeds in collecting status", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: true });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/sessions/s1");
      expect(vi.mocked(broadcastSessionEvent)).toHaveBeenCalledWith({
        event: "date_suggested", sessionId: "s1",
      });
    });

    it("succeeds in discovering status", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "discovering", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      const result = await suggestDate("s1", "2026-03-15");
      expect(result).toEqual({ ok: true });
    });

    it("inserts date option and activity feed entry", async () => {
      const tx = makeSuggestTx({
        session: [{ status: "collecting", datesLocked: false, dateRangeStart: null, dateRangeEnd: null }],
      });
      mockTx(tx);
      await suggestDate("s1", "2026-03-15");
      expect(tx.insert).toHaveBeenCalledTimes(2);
    });
  });
});

// ── addDateOption ──────────────────────────────────────────────────────────

describe("addDateOption", () => {
  describe("auth + validation", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });

    it("returns error for invalid date", async () => {
      mockAuthUser();
      const result = await addDateOption("s1", "nope");
      expect(result).toEqual({ ok: false, error: "Tanggal nggak valid" });
    });

    it("returns error for past date", async () => {
      mockAuthUser();
      const result = await addDateOption("s1", "2026-01-01");
      expect(result).toEqual({ ok: false, error: "Nggak bisa pilih tanggal yang udah lewat" });
    });
  });

  describe("session checks", () => {
    beforeEach(() => mockAuthUser());

    it("returns error when session not found", async () => {
      const tx = makeHostTx({ lockRow: null });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Session ga ketemu" });
    });

    it("returns error when user is not host", async () => {
      mockAuthUser("other-user");
      const tx = makeHostTx({ lockRow: LOCK });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });

    it("returns error when session is in voting status", async () => {
      const tx = makeHostTx({ lockRow: { ...LOCK, status: "voting" } });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Session udah ditutup" });
    });

    it("returns error when date is out of range", async () => {
      // addDateOption select seq: 1st=dateRange, 2nd=count
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ dateRangeStart: "2026-03-10", dateRangeEnd: "2026-03-20" }],
          [{ value: 0 }],
        ],
      });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-25");
      expect(result).toEqual({ ok: false, error: "Tanggal di luar rentang" });
    });

    it("returns error when too many dates", async () => {
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ dateRangeStart: null, dateRangeEnd: null }],
          [{ value: 45 }],
        ],
      });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: false, error: "Udah terlalu banyak tanggal di session ini" });
    });
  });

  describe("happy path", () => {
    beforeEach(() => mockAuthUser());

    it("succeeds and revalidates path", async () => {
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ dateRangeStart: null, dateRangeEnd: null }],
          [{ value: 5 }],
        ],
      });
      mockTx(tx);
      const result = await addDateOption("s1", "2026-03-15");
      expect(result).toEqual({ ok: true });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/sessions/s1");
    });
  });
});

// ── removeDateOption ───────────────────────────────────────────────────────

describe("removeDateOption", () => {
  describe("auth + session checks", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
      const result = await removeDateOption("s1", "d1");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });

    it("returns error when session closed", async () => {
      mockAuthUser();
      const tx = makeHostTx({ lockRow: { ...LOCK, status: "confirmed" } });
      mockTx(tx);
      const result = await removeDateOption("s1", "d1");
      expect(result).toEqual({ ok: false, error: "Session udah ditutup" });
    });
  });

  describe("date validation", () => {
    beforeEach(() => mockAuthUser());

    it("returns error when removing confirmed date", async () => {
      // removeDateOption select seq: 1st=confirmedDateOptionId, 2nd=dateOpt, 3rd=count
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ confirmedDateOptionId: "d1" }],
        ],
      });
      mockTx(tx);
      const result = await removeDateOption("s1", "d1");
      expect(result).toEqual({ ok: false, error: "Ga bisa hapus tanggal yang udah dikonfirmasi" });
    });

    it("returns error when date option not found", async () => {
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ confirmedDateOptionId: null }],
          [], // date not found
        ],
      });
      mockTx(tx);
      const result = await removeDateOption("s1", "d-nonexistent");
      expect(result).toEqual({ ok: false, error: "Tanggal ga ketemu" });
    });

    it("returns error when removing the last date", async () => {
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ confirmedDateOptionId: null }],
          [{ id: "d1", date: "2026-03-15" }],
          [{ value: 1 }],
        ],
      });
      mockTx(tx);
      const result = await removeDateOption("s1", "d1");
      expect(result).toEqual({ ok: false, error: "Ga bisa hapus tanggal terakhir" });
    });
  });

  describe("happy path", () => {
    beforeEach(() => mockAuthUser());

    it("removes date and logs activity", async () => {
      const tx = makeHostTx({
        lockRow: LOCK,
        selectSeq: [
          [{ confirmedDateOptionId: null }],
          [{ id: "d1", date: "2026-03-15" }],
          [{ value: 3 }],
        ],
      });
      mockTx(tx);
      const result = await removeDateOption("s1", "d1");
      expect(result).toEqual({ ok: true });
      expect(tx.delete).toHaveBeenCalled();
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/sessions/s1");
    });
  });
});

// ── toggleDatesLocked ──────────────────────────────────────────────────────

describe("toggleDatesLocked", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
    const result = await toggleDatesLocked("s1");
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns error when session not in collecting", async () => {
    mockAuthUser();
    const tx = makeHostTx({ lockRow: { ...LOCK, status: "discovering" } });
    mockTx(tx);
    const result = await toggleDatesLocked("s1");
    expect(result).toEqual({ ok: false, error: "Session udah ditutup" });
  });

  it("toggles lock from false to true", async () => {
    mockAuthUser();
    // toggleDatesLocked select seq: 1st=datesLocked
    const tx = makeHostTx({ lockRow: LOCK, selectSeq: [[{ datesLocked: false }]] });
    mockTx(tx);
    const result = await toggleDatesLocked("s1");
    expect(result).toEqual({ ok: true });
    expect(tx.update).toHaveBeenCalled();
  });

  it("toggles lock from true to false", async () => {
    mockAuthUser();
    const tx = makeHostTx({ lockRow: LOCK, selectSeq: [[{ datesLocked: true }]] });
    mockTx(tx);
    const result = await toggleDatesLocked("s1");
    expect(result).toEqual({ ok: true });
  });
});
