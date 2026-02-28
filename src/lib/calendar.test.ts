import { describe, it, expect } from "vitest";
import { generateIcsContent } from "./calendar";

describe("generateIcsContent", () => {
  it("returns a string starting with BEGIN:VCALENDAR", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toMatch(/^BEGIN:VCALENDAR/);
  });

  it("ends with END:VCALENDAR followed by CRLF", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("uses CRLF line endings throughout", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    // All line endings should be CRLF
    const lines = result.split("\r\n");
    expect(lines.length).toBeGreaterThan(5);
  });

  it("includes UID with sessionId@bookburr.com", () => {
    const result = generateIcsContent({
      sessionId: "my-session-id",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toContain("UID:my-session-id@bookburr.com");
  });

  it("includes DTSTART with correct date at 18:00 by default", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toContain("DTSTART;TZID=Asia/Jakarta:20250315T180000");
  });

  it("uses custom startHour when provided", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      startHour: 19,
    });
    expect(result).toContain("DTSTART;TZID=Asia/Jakarta:20250315T190000");
  });

  it("calculates DTEND as startHour + durationMinutes (default 120min)", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      startHour: 18,
    });
    // 18:00 + 120 min = 20:00
    expect(result).toContain("DTEND;TZID=Asia/Jakarta:20250315T200000");
  });

  it("calculates DTEND correctly for non-round durations", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      startHour: 18,
      durationMinutes: 90,
    });
    // 18:00 + 90 min = 19:30
    expect(result).toContain("DTEND;TZID=Asia/Jakarta:20250315T193000");
  });

  it("includes SUMMARY with session name", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber Kantor",
      date: "2025-03-15",
    });
    expect(result).toContain("SUMMARY:Bukber: Bukber Kantor");
  });

  it("escapes semicolons in session name", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Test; Bukber",
      date: "2025-03-15",
    });
    expect(result).toContain("SUMMARY:Bukber: Test\\; Bukber");
  });

  it("escapes commas in session name", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Test, Bukber",
      date: "2025-03-15",
    });
    expect(result).toContain("SUMMARY:Bukber: Test\\, Bukber");
  });

  it("includes LOCATION when venueName is provided", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      venueName: "Sate Khas Senayan",
    });
    expect(result).toContain("LOCATION:Sate Khas Senayan");
  });

  it("includes venueAddress in LOCATION when both provided", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      venueName: "Sate Khas Senayan",
      venueAddress: "Jl Sudirman",
    });
    // escapeIcsText escapes commas in the joined location string
    expect(result).toContain("LOCATION:Sate Khas Senayan");
    expect(result).toContain("Jl Sudirman");
  });

  it("omits LOCATION when no venue info provided", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).not.toContain("LOCATION:");
  });

  it("includes GEO when lat and lng provided", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      lat: -6.2088,
      lng: 106.8456,
    });
    expect(result).toContain("GEO:-6.2088;106.8456");
  });

  it("omits GEO when only lat is provided (not both)", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
      lat: -6.2088,
    });
    expect(result).not.toContain("GEO:");
  });

  it("includes VALARM for 30 min reminder", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toContain("BEGIN:VALARM");
    expect(result).toContain("TRIGGER:-PT30M");
    expect(result).toContain("END:VALARM");
  });

  it("includes Asia/Jakarta timezone definition", () => {
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: "Bukber SMA",
      date: "2025-03-15",
    });
    expect(result).toContain("TZID:Asia/Jakarta");
    expect(result).toContain("TZNAME:WIB");
  });

  it("folds long lines at 75 octets", () => {
    // Create a session name that produces a SUMMARY line > 75 chars
    const longName = "A".repeat(80);
    const result = generateIcsContent({
      sessionId: "s1",
      sessionName: longName,
      date: "2025-03-15",
    });
    const lines = result.split("\r\n");
    // Each non-continuation line should be <= 75 chars; continuation lines start with space
    lines.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(75);
    });
  });
});
