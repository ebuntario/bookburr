/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/social-embed", () => ({
  fetchSocialLinkMetadata: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchSocialLinkMetadata } from "@/lib/social-embed";
import { refreshVenueMetadata } from "./social-metadata";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function setupDbSelects(results: any[][]) {
  let i = 0;
  vi.mocked(db.select).mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(results[i++] ?? []),
      }),
    }),
  }) as any);
}

function setupDbUpdate() {
  vi.mocked(db.update).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  } as any);
}

afterEach(() => vi.clearAllMocks());

const params = { venueId: "v1", sessionId: "s1" };

describe("refreshVenueMetadata", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: false, error: "Harus login dulu / bukan anggota" });
  });

  it("returns error when not a member", async () => {
    mockAuthUser();
    setupDbSelects([
      [], // no member found
    ]);
    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: false, error: "Harus login dulu / bukan anggota" });
  });

  it("returns error when venue not found", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }], // member
      [], // no venue
    ]);
    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: false, error: "Venue ga ditemukan" });
  });

  it("returns error when venue has no social link", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }],
      [{ socialLinkUrl: null, socialLinkMetadata: null }],
    ]);
    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: false, error: "Venue ga punya social link" });
  });

  it("returns ok without fetching when metadata already exists", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }],
      [{ socialLinkUrl: "https://tiktok.com/v/1", socialLinkMetadata: { title: "Existing" } }],
    ]);
    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: true });
    expect(fetchSocialLinkMetadata).not.toHaveBeenCalled();
  });

  it("fetches and updates metadata when empty", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }],
      [{ socialLinkUrl: "https://tiktok.com/v/1", socialLinkMetadata: {} }],
    ]);
    setupDbUpdate();
    vi.mocked(fetchSocialLinkMetadata).mockResolvedValue({ title: "New" });

    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: true });
    expect(fetchSocialLinkMetadata).toHaveBeenCalledWith("https://tiktok.com/v/1");
    expect(db.update).toHaveBeenCalled();
  });

  it("fetches metadata when metadata is null", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }],
      [{ socialLinkUrl: "https://tiktok.com/v/1", socialLinkMetadata: null }],
    ]);
    setupDbUpdate();
    vi.mocked(fetchSocialLinkMetadata).mockResolvedValue({ title: "Fresh" });

    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: true });
  });

  it("returns error when fetch throws", async () => {
    mockAuthUser();
    setupDbSelects([
      [{ id: "m1" }],
      [{ socialLinkUrl: "https://tiktok.com/v/1", socialLinkMetadata: null }],
    ]);
    vi.mocked(fetchSocialLinkMetadata).mockRejectedValue(new Error("network"));

    const result = await refreshVenueMetadata(params);
    expect(result).toEqual({ ok: false, error: "Gagal fetch metadata, coba lagi ya" });
  });
});
