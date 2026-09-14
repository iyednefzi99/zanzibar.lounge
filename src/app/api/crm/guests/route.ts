import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getGuest360, getGuestTimeline } from "@/lib/crm";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const guestId = request.nextUrl.searchParams.get("guestId");

  if (guestId) {
    const guest = await getGuest360(restaurantId, guestId);
    if (!guest) return NextResponse.json({ ok: false, error: "Guest not found" }, { status: 404 });
    const timeline = await getGuestTimeline(restaurantId, guestId);
    return NextResponse.json({ ok: true, data: { guest, timeline } });
  }

  return NextResponse.json({ ok: false, error: "guestId required" }, { status: 400 });
}
