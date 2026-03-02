import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Proxies the Unsplash download tracking call so the access key
 * stays server-side and never reaches the client.
 */
export async function POST(req: NextRequest) {
  const accessKey = env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { downloadLocation } = (await req.json()) as {
    downloadLocation?: string;
  };

  if (
    !downloadLocation ||
    !downloadLocation.startsWith("https://api.unsplash.com/")
  ) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  // Fire-and-forget to Unsplash — we don't need the response
  fetch(`${downloadLocation}?client_id=${accessKey}`).catch(() => {});

  return NextResponse.json({ ok: true });
}
