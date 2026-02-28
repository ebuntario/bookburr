import { describe, it, expect, vi, afterEach } from "vitest";
import {
  copyToClipboard,
  nativeShare,
  buildInvitationCard,
  buildVotingOpenCard,
  buildConfirmationCard,
} from "./share-utils";

function decodeWaUrl(url: string): string {
  const prefix = "https://wa.me/?text=";
  return decodeURIComponent(url.replace(prefix, ""));
}

describe("copyToClipboard", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns true when clipboard.writeText succeeds", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    expect(await copyToClipboard("some text")).toBe(true);
  });

  it("returns false when clipboard.writeText throws", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    expect(await copyToClipboard("some text")).toBe(false);
  });
});

describe("nativeShare", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing when navigator.share is not available", async () => {
    vi.stubGlobal("navigator", {});
    await expect(nativeShare("Bukber SMA", "https://bookburr.com")).resolves.toBeUndefined();
  });

  it("calls navigator.share with correct payload", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share: shareMock });
    await nativeShare("Bukber SMA", "https://bookburr.com/s/abc");
    expect(shareMock).toHaveBeenCalledWith({
      title: "Bukber: Bukber SMA",
      text: 'Yuk join bukber "Bukber SMA" di BookBurr!',
      url: "https://bookburr.com/s/abc",
    });
  });

  it("ignores AbortError when user cancels share", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("AbortError")),
    });
    await expect(nativeShare("test", "https://test.com")).resolves.toBeUndefined();
  });
});

describe("buildInvitationCard", () => {
  it("returns a wa.me URL", () => {
    const url = buildInvitationCard({
      hostName: "Reza",
      sessionName: "Bukber SMA",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("encodes the invite code in the URL", () => {
    const url = buildInvitationCard({
      sessionName: "Bukber SMA",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("INVITE01");
  });

  it("includes hostName when provided", () => {
    const url = buildInvitationCard({
      hostName: "Reza",
      sessionName: "Bukber SMA",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("Reza");
  });

  it("uses 'Someone' when hostName is not provided", () => {
    const url = buildInvitationCard({
      sessionName: "Bukber SMA",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("Someone");
  });

  it("includes dateRange when provided", () => {
    const url = buildInvitationCard({
      sessionName: "Bukber SMA",
      dateRange: "15-20 Maret",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("15-20 Maret");
  });

  it("omits date line when dateRange is not provided", () => {
    const url = buildInvitationCard({
      sessionName: "Bukber SMA",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    // No " — " separator when no dateRange
    expect(text).not.toContain(" — ");
  });

  it("includes shareUrl in text", () => {
    const shareUrl = "https://bookburr.com/sessions/abc123";
    const url = buildInvitationCard({
      sessionName: "Bukber SMA",
      shareUrl,
      inviteCode: "INVITE01",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain(shareUrl);
  });

  it("includes sessionName in text", () => {
    const url = buildInvitationCard({
      sessionName: "Bukber Kantor 2025",
      shareUrl: "https://bookburr.com/sessions/abc",
      inviteCode: "CODE1234",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("Bukber Kantor 2025");
  });
});

describe("buildVotingOpenCard", () => {
  it("returns a wa.me URL", () => {
    const url = buildVotingOpenCard({
      sessionName: "Bukber SMA",
      venueCount: 5,
      shareUrl: "https://bookburr.com/sessions/abc",
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("includes venueCount in text", () => {
    const url = buildVotingOpenCard({
      sessionName: "Bukber SMA",
      venueCount: 5,
      shareUrl: "https://bookburr.com/sessions/abc",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("5");
  });

  it("includes sessionName", () => {
    const url = buildVotingOpenCard({
      sessionName: "Bukber Geng Bandung",
      venueCount: 3,
      shareUrl: "https://bookburr.com/sessions/xyz",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("Bukber Geng Bandung");
  });

  it("includes shareUrl", () => {
    const shareUrl = "https://bookburr.com/sessions/xyz";
    const url = buildVotingOpenCard({
      sessionName: "Bukber SMA",
      venueCount: 3,
      shareUrl,
    });
    const text = decodeWaUrl(url);
    expect(text).toContain(shareUrl);
  });
});

describe("buildConfirmationCard", () => {
  it("returns a wa.me URL", () => {
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("includes venue name and session name", () => {
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("Sate Khas Senayan");
    expect(text).toContain("Bukber SMA");
  });

  it("includes googleMapsUrl when provided", () => {
    const mapsUrl = "https://maps.google.com/maps?q=Sate+Khas";
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
      googleMapsUrl: mapsUrl,
    });
    const text = decodeWaUrl(url);
    expect(text).toContain(mapsUrl);
  });

  it("omits Maps URL when not provided", () => {
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
    });
    const text = decodeWaUrl(url);
    expect(text).not.toContain("maps.google.com");
  });

  it("defaults time to '18:00 WIB' when not provided", () => {
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("18:00 WIB");
  });

  it("uses provided time when given", () => {
    const url = buildConfirmationCard({
      sessionName: "Bukber SMA",
      venueName: "Sate Khas Senayan",
      dateStr: "Sabtu, 15 Maret 2025",
      time: "19:30 WIB",
    });
    const text = decodeWaUrl(url);
    expect(text).toContain("19:30 WIB");
    expect(text).not.toContain("18:00 WIB");
  });
});
