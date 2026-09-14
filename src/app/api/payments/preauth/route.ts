import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { createPreAuthorization, capturePreAuthorization, cancelPreAuthorization } from "@/lib/payments/preauth";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const { action, preAuthId, reservationId, amount, guestId } = body;

  switch (action) {
    case "create": {
      if (!reservationId || !amount || !guestId) {
        return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
      }
      const result = await createPreAuthorization(reservationId, amount, guestId, restaurantId);
      return NextResponse.json({ ok: !!result, data: result });
    }
    case "capture": {
      if (!preAuthId) {
        return NextResponse.json({ ok: false, error: "preAuthId required" }, { status: 400 });
      }
      const success = await capturePreAuthorization(preAuthId);
      return NextResponse.json({ ok: success });
    }
    case "cancel": {
      if (!preAuthId) {
        return NextResponse.json({ ok: false, error: "preAuthId required" }, { status: 400 });
      }
      const success = await cancelPreAuthorization(preAuthId);
      return NextResponse.json({ ok: success });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}
