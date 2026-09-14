import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getRecommendations, generateRecommendations } from "@/lib/personalization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");
  const restaurantId = searchParams.get("restaurantId");
  const type = searchParams.get("type") as "dish" | "drink" | "upsell" | "return_visit" | null;

  if (!guestId || !restaurantId) {
    return NextResponse.json({ error: "guestId and restaurantId required" }, { status: 400 });
  }

  const recs = await getRecommendations(guestId, restaurantId, type ?? undefined);
  return NextResponse.json(recs);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { guestId, restaurantId } = body;
  if (!guestId || !restaurantId) {
    return NextResponse.json({ error: "guestId and restaurantId required" }, { status: 400 });
  }

  const recs = await generateRecommendations(guestId, restaurantId);
  return NextResponse.json(recs);
}
