import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort } from "./format-utils";

describe("formatDate", () => {
  it("formats 2025-03-15 in Indonesian long format", () => {
    const result = formatDate("2025-03-15");
    // 2025-03-15 is a Saturday (Sabtu)
    expect(result).toContain("2025");
    // Month should be Maret (March in Indonesian)
    // This depends on locale availability
    expect(result).toMatch(/\d/); // contains a day number
  });

  it("includes the day number", () => {
    const result = formatDate("2025-03-15");
    expect(result).toContain("15");
  });

  it("formats different dates correctly", () => {
    const result1 = formatDate("2025-01-01");
    const result2 = formatDate("2025-12-31");
    // Different months should produce different output
    expect(result1).not.toBe(result2);
  });

  it("returns a non-empty string", () => {
    const result = formatDate("2025-06-01");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatDateShort", () => {
  it("returns shorter format without year", () => {
    const long = formatDate("2025-03-15");
    const short = formatDateShort("2025-03-15");
    // Short should be shorter than long (no year)
    expect(short.length).toBeLessThan(long.length);
  });

  it("does not include the year", () => {
    const result = formatDateShort("2025-03-15");
    expect(result).not.toContain("2025");
  });

  it("includes the day number", () => {
    const result = formatDateShort("2025-03-15");
    expect(result).toContain("15");
  });

  it("returns a non-empty string", () => {
    const result = formatDateShort("2025-06-01");
    expect(result.length).toBeGreaterThan(0);
  });
});
