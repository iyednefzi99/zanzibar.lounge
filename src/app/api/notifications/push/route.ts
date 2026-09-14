import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { subscribeToPush, unsubscribeFromPush, getPushSubscriptions } from "@/lib/notifications/push";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = request.nextUrl.searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ ok: false, error: "restaurantId required" }, { status: 400 });
  }

  const subscriptions = await getPushSubscriptions(restaurantId);
  return NextResponse.json({ ok: true, data: subscriptions });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { guestId, subscription, action } = body;

  if (!guestId) {
    return NextResponse.json(
      { ok: false, error: "guestId required" },
      { status: 400 },
    );
  }

  if (action === "unsubscribe") {
    await unsubscribeFromPush(guestId);
    return NextResponse.json({ ok: true });
  }

  if (!subscription) {
    return NextResponse.json(
      { ok: false, error: "subscription required" },
      { status: 400 },
    );
  }

  const sub = await subscribeToPush(guestId, subscription);
  return NextResponse.json({ ok: true, data: sub });
}
