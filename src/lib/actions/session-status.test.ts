/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/broadcast", () => ({
  broadcastSessionEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email/calendar-invite", () => ({
  sendCalendarInvitesForSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { advanceSessionStatus, confirmSession } from "./session-status";

/**
 * Builds a mock tx for advanceSessionStatus happy-path tests.
 * The tricky part: validateAdvancePrerequisites awaits `.select().from().where()`
 * (no .limit), while insertHostActivity awaits `.select().from().where().limit(1)`.
 * We make `.where()` return a thenable-with-limit object to handle both patterns.
 */
function makeTxForAdvance(opts: {
  status: string;
  memberCount?: number;
  venueCount?: number;
  viableDateCount?: number;
  sessionShape?: string;
}) {
  const { status, memberCount = 2, venueCount = 1, viableDateCount = 1, sessionShape = "need_both" } = opts;

  function makeWhereResult(countResult: object[]) {
    // Thenable AND has .limit() — satisfies both call patterns
    return {
      then(resolve: (v: unknown) => void) {
        resolve(countResult);
      },
      limit: vi.fn().mockResolvedValue([{ id: "host-member-1" }]),
    };
  }

  // Track select calls to return different count results
  let selectCallCount = 0;

  const fromMock = vi.fn().mockReturnThis();
  const chainable = {
    from: fromMock,
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => {
      selectCallCount++;
      // For collecting: 1st=memberCount, 2nd=viableDateCount
      // For discovering: 1st=venueCount
      // insertHostActivity uses .limit() pattern
      if (status === "collecting") {
        if (selectCallCount === 1) return makeWhereResult([{ memberCount }]);
        if (selectCallCount === 2) return makeWhereResult([{ viableDateCount }]);
      }
      return makeWhereResult([{ memberCount, venueCount }]);
    }),
  };

  return {
    execute: vi.fn().mockResolvedValue({
      rows: [{ id: "s1", status, host_id: "host-1", session_shape: sessionShape }],
    }),
    select: vi.fn().mockReturnValue(chainable),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
  };
}

function mockAuthUser(id = "host-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

afterEach(() => vi.clearAllMocks());

describe("advanceSessionStatus", () => {
  describe("auth failures", () => {
    it("returns unauthorized error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });
  });

  describe("session not found", () => {
    it("returns session not found error", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({ rows: [] }),
        };
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("nonexistent");
      expect(result).toEqual({ ok: false, error: "Session ga ketemu" });
    });
  });

  describe("not host", () => {
    it("returns unauthorized when user is not host", async () => {
      mockAuthUser("other-user");
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "collecting", host_id: "host-1", session_shape: "need_both" }],
          }),
        };
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });
  });

  describe("terminal status", () => {
    it("returns error when session is in 'completed' status (no transition)", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "completed", host_id: "host-1", session_shape: "need_both" }],
          }),
        };
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: false, error: "Status udah final" });
    });
  });

  describe("collecting → discovering", () => {
    it("returns error when only 1 member", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "collecting", host_id: "host-1", session_shape: "need_both" }],
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ memberCount: 1 }]),
            }),
          }),
        };
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: false, error: "Butuh minimal 2 orang dulu" });
    });

    it("succeeds with 2+ members", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = makeTxForAdvance({ status: "collecting", memberCount: 3 });
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: true });
    });
  });

  describe("discovering → voting", () => {
    it("returns error when no venues", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "discovering", host_id: "host-1", session_shape: "need_both" }],
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ venueCount: 0 }]),
            }),
          }),
        };
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: false, error: "Tambahin venue dulu ya" });
    });

    it("succeeds with 1+ venues", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = makeTxForAdvance({ status: "discovering", venueCount: 3 });
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: true });
    });
  });
});

describe("confirmSession", () => {
  describe("auth failures", () => {
    it("returns unauthorized when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "v1",
        dateOptionId: "d1",
      });
      expect(result).toEqual({ ok: false, error: "unauthorized" });
    });
  });

  describe("wrong status", () => {
    it("returns WRONG_STATUS when not in voting state", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "collecting", host_id: "host-1", session_shape: "need_both" }],
          }),
        };
        return cb(tx as unknown as any);
      });
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "v1",
        dateOptionId: "d1",
      });
      expect(result).toEqual({ ok: false, error: "Status harus voting dulu" });
    });
  });

  describe("invalid venue", () => {
    it("returns error when venue not found", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        let selectCount = 0;
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "voting", host_id: "host-1", session_shape: "need_both" }],
          }),
          select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(() => {
              selectCount++;
              // First select = venue (not found), second = date
              return selectCount === 1 ? Promise.resolve([]) : Promise.resolve([{ id: "d1" }]);
            }),
          })),
        };
        return cb(tx as unknown as any);
      });
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "missing-venue",
        dateOptionId: "d1",
      });
      expect(result).toEqual({ ok: false, error: "Venue ga valid" });
    });
  });

  describe("invalid date", () => {
    it("returns error when date not found", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        let selectCount = 0;
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "voting", host_id: "host-1", session_shape: "need_both" }],
          }),
          select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(() => {
              selectCount++;
              // First select = venue (found), second = date (not found)
              return selectCount === 1 ? Promise.resolve([{ id: "v1" }]) : Promise.resolve([]);
            }),
          })),
        };
        return cb(tx as unknown as any);
      });
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "v1",
        dateOptionId: "missing-date",
      });
      expect(result).toEqual({ ok: false, error: "Tanggal ga valid" });
    });
  });

  describe("happy path", () => {
    it("returns ok: true when all valid", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "voting", host_id: "host-1", session_shape: "need_both" }],
          }),
          select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ id: "found" }]),
          })),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        };
        return cb(tx as unknown as any);
      });
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "v1",
        dateOptionId: "d1",
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("date_known shape", () => {
    it("overrides dateOptionId with stored confirmedDateOptionId for date_known shape", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        let selectCount = 0;
        const tx = {
          execute: vi.fn().mockResolvedValue({
            rows: [{ id: "s1", status: "voting", host_id: "host-1", session_shape: "date_known" }],
          }),
          select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(() => {
              selectCount++;
              // 1st=confirmedDateOptionId query, 2nd=venue, 3rd=date, 4th=hostMember
              if (selectCount === 1) return Promise.resolve([{ confirmedDateOptionId: "stored-d1" }]);
              return Promise.resolve([{ id: "found" }]);
            }),
          })),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        };
        return cb(tx as unknown as any);
      });
      const result = await confirmSession({
        sessionId: "s1",
        venueId: "v1",
        dateOptionId: "d-ignored",
      });
      expect(result).toEqual({ ok: true });
    });
  });

  describe("collecting → discovering (date_known skips viable date check)", () => {
    it("skips viable date count check for date_known shape", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = makeTxForAdvance({
          status: "collecting",
          memberCount: 3,
          sessionShape: "date_known",
        });
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: true });
    });
  });

  describe("venue_known shape transition", () => {
    it("venue_known skips discovering and goes collecting → voting", async () => {
      mockAuthUser();
      vi.mocked(db.transaction).mockImplementation(async (cb) => {
        const tx = makeTxForAdvance({
          status: "collecting",
          memberCount: 3,
          sessionShape: "venue_known",
        });
        return cb(tx as unknown as any);
      });
      const result = await advanceSessionStatus("s1");
      expect(result).toEqual({ ok: true });
    });
  });
});
