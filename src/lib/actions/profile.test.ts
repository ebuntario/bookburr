/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { updateProfile } from "./profile";

function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

function setupDbUpdate() {
  vi.mocked(db.update).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  } as any);
}

afterEach(() => vi.clearAllMocks());

describe("updateProfile", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await updateProfile({ name: "Test" });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns error for invalid marital status", async () => {
    mockAuthUser();
    const result = await updateProfile({ maritalStatus: "divorced" });
    expect(result).toEqual({ ok: false, error: "Status ga valid" });
  });

  it("accepts valid marital status 'single'", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({ maritalStatus: "single" });
    expect(result).toEqual({ ok: true });
  });

  it("accepts valid marital status 'married'", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({ maritalStatus: "married" });
    expect(result).toEqual({ ok: true });
  });

  it("accepts null marital status (clear)", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({ maritalStatus: null });
    expect(result).toEqual({ ok: true });
  });

  it("updates name and revalidates path", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({ name: "Test User" });
    expect(result).toEqual({ ok: true });
    expect(db.update).toHaveBeenCalled();
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/profile");
  });

  it("handles all-undefined input (no-op update)", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({});
    expect(result).toEqual({ ok: true });
    expect(db.update).toHaveBeenCalled();
  });

  it("trims name to null when empty string", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({ name: "  " });
    expect(result).toEqual({ ok: true });
  });

  it("updates dietary and cuisine preferences", async () => {
    mockAuthUser();
    setupDbUpdate();
    const result = await updateProfile({
      dietaryPreferences: ["halal"],
      defaultCuisinePreferences: ["indonesian", "japanese"],
    });
    expect(result).toEqual({ ok: true });
  });
});
