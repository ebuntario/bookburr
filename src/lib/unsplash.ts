import { env } from "@/lib/env";
import { logError, logWarn } from "@/lib/logger";

export interface UnsplashPhoto {
  imageUrl: string;
  altDescription: string;
  photographerName: string;
  photographerUrl: string;
  downloadLocation: string;
}

export async function fetchRandomRamadanPhoto(): Promise<UnsplashPhoto | null> {
  const accessKey = env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const res = await fetch(
      "https://api.unsplash.com/photos/random?query=ramadan&orientation=portrait",
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      logWarn("unsplash", `Unsplash API returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      urls?: { regular?: string };
      alt_description?: string | null;
      user?: { name?: string; links?: { html?: string } };
      links?: { download_location?: string };
    };

    const imageUrl = data.urls?.regular;
    const downloadLocation = data.links?.download_location;
    if (!imageUrl || !downloadLocation) return null;

    return {
      imageUrl,
      altDescription: data.alt_description ?? "Ramadan",
      photographerName: data.user?.name ?? "Unknown",
      photographerUrl: data.user?.links?.html
        ? `${data.user.links.html}?utm_source=bookburr&utm_medium=referral`
        : "https://unsplash.com?utm_source=bookburr&utm_medium=referral",
      downloadLocation,
    };
  } catch (err) {
    logError("unsplash", err);
    return null;
  }
}
