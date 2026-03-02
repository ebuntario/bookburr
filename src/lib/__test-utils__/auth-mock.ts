/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";
import { auth } from "@/lib/auth";

export function mockAuthUser(id = "user-1") {
  vi.mocked(auth).mockResolvedValue({ user: { id } } as any);
}

export function mockAuthUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any);
}
