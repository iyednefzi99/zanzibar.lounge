import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getActiveSocialProof } from "@/lib/innovation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const type = searchParams.get("type") as
    | "recent_booking"
    | "popular_time"
    | "trending_dish"
    | "review_highlights"
    | null;

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const events = await getActiveSocialProof(restaurantId, { type: type ?? undefined });
  return NextResponse.json(events);
}
