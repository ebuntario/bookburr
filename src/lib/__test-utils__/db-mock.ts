/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";
import { db } from "@/lib/db";

/**
 * Wires up db.transaction to call the callback with the provided tx mock.
 */
export function mockDbTransaction(tx: Record<string, any>) {
  vi.mocked(db.transaction).mockImplementation(async (cb) =>
    cb(tx as unknown as Parameters<Parameters<typeof db.transaction>[0]>[0]),
  );
}

/**
 * Creates a chainable mock for direct db.select/insert/update/delete usage
 * (for actions that don't use transactions, like profile.ts and social-metadata.ts).
 *
 * Each selectResult entry is consumed in order for sequential db.select() calls.
 */
export function makeDirectDbMock(selectResults: object[][] = []) {
  let selectCallCount = 0;

  const selectMock = vi.fn().mockImplementation(() => {
    const idx = Math.min(selectCallCount, selectResults.length - 1);
    const result = selectResults[idx] ?? [];
    selectCallCount++;

    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    };
  });

  const updateSet = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  });

  const insertValues = vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockResolvedValue([]),
    onConflictDoUpdate: vi.fn().mockResolvedValue([]),
  });

  return {
    select: selectMock,
    insert: vi.fn().mockReturnValue({ values: insertValues }),
    update: vi.fn().mockReturnValue({ set: updateSet }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
  };
}
