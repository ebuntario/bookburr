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
vi.mock("@/lib/algorithms/scoring", () => ({
  calculateFlexibilityScore: vi.fn(() => 0.75),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { broadcastSessionEvent } from "@/lib/supabase/broadcast";
import { calculateFlexibilityScore } from "@/lib/algorithms/scoring";
import { updateDateVotes } from "./date-votes";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function mockTx(tx: any) {
  vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx));
}

function tw(result: any[]) {
  return {
    then(resolve: (v: unknown) => void) { resolve(result); },
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Tx mock for updateDateVotes.
 * Select order: 1=validateVotableSession(session), 2=findMemberWithUser(member+user join),
 *   3=allDates
 */
function makeVoteTx(opts: {
  session?: any[] | null;
  member?: any[] | null;
  allDates?: any[];
}) {
  const seq = [
    opts.session ?? [],
    opts.member ?? [],
    opts.allDates ?? [],
  ];
  let i = 0;

  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => tw(seq[i++] ?? [])),
        }),
        where: vi.fn().mockImplementation(() => tw(seq[i++] ?? [])),
      }),
    })),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue([]),
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

afterEach(() => vi.clearAllMocks());

const validInput = {
  sessionId: "s1",
  votes: [{ dateOptionId: "d1", preferenceLevel: "can_do" as const }],
};

// ── Auth ────────────────────────────────────────────────────────────────────

describe("updateDateVotes — auth", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("UNAUTHORIZED"));
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });
});

// ── Session validation ─────────────────────────────────────────────────────

describe("updateDateVotes — session validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error when session not found", async () => {
    const tx = makeVoteTx({ session: [] });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "Session ga ketemu" });
  });

  it("returns error when session is in voting status (locked)", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "voting" }],
    });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "Votes udah dikunci, ga bisa edit lagi" });
  });

  it("returns error when session is confirmed", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "confirmed" }],
    });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "Votes udah dikunci, ga bisa edit lagi" });
  });
});

// ── Member validation ──────────────────────────────────────────────────────

describe("updateDateVotes — member validation", () => {
  beforeEach(() => mockAuthUser());

  it("returns error when user is not a member", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "collecting" }],
      member: [],
    });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "Lu belum join session ini" });
  });
});

// ── Invalid dates ──────────────────────────────────────────────────────────

describe("updateDateVotes — invalid dates", () => {
  beforeEach(() => mockAuthUser());

  it("returns error when voting for non-existent date option", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "collecting" }],
      member: [{ memberId: "m1", referenceLocation: null, maritalStatus: null }],
      allDates: [{ id: "d2" }], // only d2 exists, not d1
    });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: false, error: "Tanggal ga valid" });
  });
});

// ── Happy path ─────────────────────────────────────────────────────────────

describe("updateDateVotes — happy path", () => {
  beforeEach(() => mockAuthUser());

  it("succeeds with valid votes", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "collecting" }],
      member: [{ memberId: "m1", referenceLocation: null, maritalStatus: null }],
      allDates: [{ id: "d1" }, { id: "d2" }],
    });
    mockTx(tx);
    const result = await updateDateVotes(validInput);
    expect(result).toEqual({ ok: true });
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/sessions/s1");
    expect(vi.mocked(broadcastSessionEvent)).toHaveBeenCalledWith({
      event: "votes_updated", sessionId: "s1",
    });
  });

  it("recalculates flexibility score", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "discovering" }],
      member: [{ memberId: "m1", referenceLocation: { lat: 1, lng: 2 }, maritalStatus: "single" }],
      allDates: [{ id: "d1" }],
    });
    mockTx(tx);
    await updateDateVotes(validInput);
    expect(calculateFlexibilityScore).toHaveBeenCalledWith({
      maritalStatus: "single",
      hasLocation: true,
      totalDates: 1,
      availableDates: 1,
    });
    expect(tx.update).toHaveBeenCalled();
  });

  it("deletes votes for unsubmitted dates", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "collecting" }],
      member: [{ memberId: "m1", referenceLocation: null, maritalStatus: null }],
      allDates: [{ id: "d1" }, { id: "d2" }, { id: "d3" }],
    });
    mockTx(tx);
    // Only voting for d1, so d2 and d3 should be deleted
    await updateDateVotes(validInput);
    expect(tx.delete).toHaveBeenCalled();
  });

  it("succeeds with empty votes (deletes all)", async () => {
    const tx = makeVoteTx({
      session: [{ id: "s1", status: "collecting" }],
      member: [{ memberId: "m1", referenceLocation: null, maritalStatus: null }],
      allDates: [{ id: "d1" }],
    });
    mockTx(tx);
    const result = await updateDateVotes({ sessionId: "s1", votes: [] });
    expect(result).toEqual({ ok: true });
    // Should delete d1 since no votes submitted
    expect(tx.delete).toHaveBeenCalled();
  });
});
