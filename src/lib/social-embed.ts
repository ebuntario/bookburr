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
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
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

async function fetchInstagramMetadata(url: string): Promise<SocialLinkMetadata> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Twitterbot/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const ogTitle = html.match(
      /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/,
    )?.[1];
    const ogImage = html.match(
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
    )?.[1];
    return { title: ogTitle, thumbnail_url: ogImage };
  } catch {
    return {};
  }
}
