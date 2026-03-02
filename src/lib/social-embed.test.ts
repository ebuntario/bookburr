/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { detectPlatform, fetchSocialLinkMetadata } from "./social-embed";

afterEach(() => {
  vi.restoreAllMocks();
});

// ── detectPlatform ─────────────────────────────────────────────────────────

describe("detectPlatform", () => {
  it("detects TikTok URLs", () => {
    expect(detectPlatform("https://www.tiktok.com/@user/video/123")).toBe("tiktok");
  });

  it("detects Instagram URLs", () => {
    expect(detectPlatform("https://www.instagram.com/p/ABC123/")).toBe("instagram");
  });

  it("returns null for YouTube URLs", () => {
    expect(detectPlatform("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("returns null for random URLs", () => {
    expect(detectPlatform("https://example.com")).toBeNull();
  });

  it("detects TikTok even with subdomains", () => {
    expect(detectPlatform("https://m.tiktok.com/v/123")).toBe("tiktok");
  });
});

// ── fetchSocialLinkMetadata ────────────────────────────────────────────────

describe("fetchSocialLinkMetadata", () => {
  it("returns empty object for unknown platform", async () => {
    const result = await fetchSocialLinkMetadata("https://example.com/page");
    expect(result).toEqual({});
  });

  describe("TikTok", () => {
    it("fetches oembed metadata successfully", async () => {
      const mockData = {
        title: "Cool video",
        thumbnail_url: "https://p16.tiktokcdn.com/thumb.jpg",
        author_name: "@testuser",
        author_url: "https://www.tiktok.com/@testuser",
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }));

      const result = await fetchSocialLinkMetadata("https://www.tiktok.com/@user/video/123");
      expect(result).toEqual({
        title: "Cool video",
        thumbnail_url: "https://p16.tiktokcdn.com/thumb.jpg",
        author_name: "@testuser",
        author_url: "https://www.tiktok.com/@testuser",
      });

      // Verify it called the oembed endpoint
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("tiktok.com/oembed"),
        expect.any(Object),
      );
    });

    it("returns empty object when oembed fetch fails (non-ok)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
      }));

      const result = await fetchSocialLinkMetadata("https://www.tiktok.com/@user/video/123");
      expect(result).toEqual({});
    });

    it("returns empty object when fetch throws (network error)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      const result = await fetchSocialLinkMetadata("https://www.tiktok.com/@user/video/123");
      expect(result).toEqual({});
    });
  });

  describe("Instagram", () => {
    it("extracts OG tags from HTML with facebookexternalhit UA", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Great post by @foodie">
            <meta property="og:image" content="https://scontent.cdninstagram.com/photo.jpg">
            <meta property="og:description" content="Check out @foodie.id enjoying sate!">
          </head>
        </html>
      `;

      // UA-aware mock: first call (facebookexternalhit) succeeds
      vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, opts?: any) => {
        const ua = opts?.headers?.["User-Agent"] ?? "";
        if (ua.includes("facebookexternalhit")) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(html) });
        }
        return Promise.resolve({ ok: false });
      }));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/ABC123/");
      expect(result).toEqual({
        title: "Great post by @foodie",
        thumbnail_url: "https://scontent.cdninstagram.com/photo.jpg",
        author_name: "@foodie.id",
      });
    });

    it("falls back to Twitterbot UA when facebookexternalhit fails", async () => {
      const html = `
        <meta property="og:title" content="Post title">
        <meta property="og:image" content="https://image.url/pic.jpg">
      `;

      vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, opts?: any) => {
        const ua = opts?.headers?.["User-Agent"] ?? "";
        if (ua.includes("Twitterbot")) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(html) });
        }
        return Promise.resolve({ ok: false });
      }));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/DEF456/");
      expect(result).toEqual({
        title: "Post title",
        thumbnail_url: "https://image.url/pic.jpg",
        author_name: undefined,
      });
    });

    it("returns empty object when no OG tags found", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<html><head></head></html>"),
      }));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/XYZ/");
      expect(result).toEqual({});
    });

    it("returns empty object when all UAs fail", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/XYZ/");
      expect(result).toEqual({});
    });

    it("returns empty object when all UAs throw", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/XYZ/");
      expect(result).toEqual({});
    });

    it("handles reversed OG tag attribute order", async () => {
      const html = `<meta content="Reversed title" property="og:title"><meta content="https://img.url/reversed.jpg" property="og:image">`;

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      }));

      const result = await fetchSocialLinkMetadata("https://www.instagram.com/p/REV/");
      expect(result).toEqual({
        title: "Reversed title",
        thumbnail_url: "https://img.url/reversed.jpg",
        author_name: undefined,
      });
    });
  });
});
