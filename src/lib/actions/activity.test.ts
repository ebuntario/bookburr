/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/queries/dashboard", () => ({
  getActivityFeed: vi.fn().mockResolvedValue([]),
}));

import { auth } from "@/lib/auth";
import { getActivityFeed } from "@/lib/queries/dashboard";
import { loadMoreActivity } from "./activity";

afterEach(() => vi.clearAllMocks());

describe("loadMoreActivity", () => {
  it("returns empty array when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await loadMoreActivity("s1", "2026-03-01T00:00:00Z");
    expect(result).toEqual([]);
    expect(getActivityFeed).not.toHaveBeenCalled();
  });

  it("delegates to getActivityFeed with parsed cursor date", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    vi.mocked(getActivityFeed).mockResolvedValue([{ id: "a1" }] as any);

    const result = await loadMoreActivity("s1", "2026-03-01T12:00:00Z");
    expect(result).toEqual([{ id: "a1" }]);
    expect(getActivityFeed).toHaveBeenCalledWith(
      "s1",
      10,
      new Date("2026-03-01T12:00:00Z"),
    );
  });

  it("passes Invalid Date when cursor is malformed", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as any);
    await loadMoreActivity("s1", "not-a-date");
    // new Date("not-a-date") produces Invalid Date — passes to getActivityFeed
    expect(getActivityFeed).toHaveBeenCalledWith(
      "s1",
      10,
      expect.any(Date),
    );
  });
});
