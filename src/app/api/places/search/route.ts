import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessionMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { placesRatelimit } from "@/lib/rate-limit";

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  price_level?: number;
  geometry?: { location: { lat: number; lng: number } };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit by userId
  if (placesRatelimit) {
    const { success, reset } = await placesRatelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Slow down bestie, terlalu banyak request. Coba lagi sebentar ya." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
        },
      );
    }
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const sessionId = searchParams.get("sessionId");

  if (!query || !sessionId) {
    return NextResponse.json({ error: "Missing q or sessionId" }, { status: 400 });
  }

  // Input validation
  if (query.length > 200) {
    return NextResponse.json({ error: "Query terlalu panjang" }, { status: 400 });
  }
  if (sessionId.length > 30) {
    return NextResponse.json({ error: "sessionId ga valid" }, { status: 400 });
  }

  // Verify membership
  const [member] = await db
    .select({ id: sessionMembers.id })
    .from(sessionMembers)
    .where(
      and(
        eq(sessionMembers.sessionId, sessionId),
        eq(sessionMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "Not a member of this session" }, { status: 403 });
  }

  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 503 });
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}&type=restaurant&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Places request failed" }, { status: 502 });
  }

  const data = (await res.json()) as { results?: GooglePlace[] };
  const results = (data.results ?? []).slice(0, 8).map((p) => ({
    placeId: p.place_id,
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    priceLevel: p.price_level,
    location: p.geometry?.location,
  }));

  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
