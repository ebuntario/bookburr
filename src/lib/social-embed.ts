import type { SocialLinkMetadata } from "@/types";

export type SocialPlatformDetected = "tiktok" | "instagram" | null;

export function detectPlatform(url: string): SocialPlatformDetected {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  return null;
}

export async function fetchSocialLinkMetadata(
  url: string,
): Promise<SocialLinkMetadata> {
  const platform = detectPlatform(url);
  if (platform === "tiktok") return fetchTikTokMetadata(url);
  if (platform === "instagram") return fetchInstagramMetadata(url);
  return {};
}

async function fetchTikTokMetadata(url: string): Promise<SocialLinkMetadata> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
      author_url?: string;
    };
    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      author_name: data.author_name,
      author_url: data.author_url,
    };
  } catch {
    return {};
  }
}

function extractOgTag(html: string, property: string): string | undefined {
  // Standard: <meta property="og:x" content="...">
  const standard = html.match(
    new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]+)"`, "i"),
  )?.[1];
  if (standard) return standard;

  // Reversed: <meta content="..." property="og:x">
  return html.match(
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+property="${property}"`, "i"),
  )?.[1];
}

async function fetchInstagramMetadata(url: string): Promise<SocialLinkMetadata> {
  // Try facebookexternalhit UA first (best success rate for Instagram)
  for (const userAgent of [
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
  ]) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      const ogTitle = extractOgTag(html, "og:title");
      const ogImage = extractOgTag(html, "og:image");
      const ogDescription = extractOgTag(html, "og:description");

      if (ogTitle || ogImage) {
        // Extract @author from description if present
        const authorMatch = ogDescription?.match(/@([\w.]+)/);
        return {
          title: ogTitle,
          thumbnail_url: ogImage,
          author_name: authorMatch ? `@${authorMatch[1]}` : undefined,
        };
      }
    } catch {
      // Try next UA
    }
  }
  return {};
}
