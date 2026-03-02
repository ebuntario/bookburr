import { vi } from "vitest";

/**
 * Makes a `.where()` result that is both thenable (for `await tx.select().from().where()`)
 * and has `.limit()` (for `await tx.select().from().where().limit(1)`).
 */
export function makeWhereResult(result: object[]) {
  return {
    then(resolve: (v: unknown) => void) {
      resolve(result);
    },
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Simple chainable tx mock for insert/update/delete patterns.
 * Good for tests that only need basic CRUD operations.
 */
export function makeMockTx() {
  const deleteMock = vi.fn();
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const onConflictDoNothing = vi.fn().mockResolvedValue([]);
  const onConflictDoUpdate = vi.fn().mockResolvedValue([]);
  const values = vi.fn().mockReturnValue({ onConflictDoNothing, onConflictDoUpdate });
  const insert = vi.fn().mockReturnValue({ values });
  deleteMock.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });

  return { insert, values, update, set, where, onConflictDoNothing, onConflictDoUpdate, delete: deleteMock };
}

/**
 * Creates a tx mock with configurable select chain behavior.
 * Each call to `.select()` can return different data based on call order.
 *
 * @param selectResults - Array of results, returned in order for each select().from().where() call.
 *   Each entry is the resolved value of `.where()` (or `.limit()` if chained).
 */
export function makeTxWithSelects(selectResults: object[][]) {
  const base = makeMockTx();
  let selectCallCount = 0;

  const select = vi.fn().mockImplementation(() => {
    const idx = Math.min(selectCallCount, selectResults.length - 1);
    const result = selectResults[idx] ?? [];
    selectCallCount++;

    return {
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => makeWhereResult(result)),
        }),
        where: vi.fn().mockImplementation(() => makeWhereResult(result)),
      }),
    };
  });

  return { ...base, select };
}

/**
 * Creates a tx mock for actions that use `lockSessionForUpdate` (via `tx.execute(sql`...`)`).
 * Provides both execute and select/insert/update/delete chains.
 */
export function makeTxWithLock(
  lockRow: { id: string; status: string; host_id: string; session_shape: string } | null,
  selectResults: object[][] = [],
) {
  const txWithSelects = makeTxWithSelects(selectResults);
  return {
    ...txWithSelects,
    execute: vi.fn().mockResolvedValue({
      rows: lockRow ? [lockRow] : [],
    }),
  };
}
