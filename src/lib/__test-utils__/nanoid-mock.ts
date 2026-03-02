import { vi, beforeEach } from "vitest";

let idCounter = 0;

export function setupNanoidMock() {
  beforeEach(() => {
    idCounter = 0;
  });
}

/**
 * Sequential nanoid mock factory. Use in vi.mock("nanoid", ...).
 * Returns "mock-id-1", "mock-id-2", etc. Resets each test via setupNanoidMock().
 */
export function createNanoidMock() {
  return {
    nanoid: vi.fn(() => `mock-id-${++idCounter}`),
  };
}
