import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { createBillSplit, splitEvenly, addTip, getSplitStatus } from "@/lib/payments/split";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const { action, splitId, reservationId, totalAmount, guestCount, tipAmount } = body;

  switch (action) {
    case "create": {
      if (!reservationId || !totalAmount) {
        return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
      }
      const split = await createBillSplit(reservationId, restaurantId, totalAmount);
      return NextResponse.json({ ok: true, data: split });
    }
    case "splitEvenly": {
      if (!splitId || !guestCount) {
        return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
      }
      const result = await splitEvenly(splitId, guestCount);
      return NextResponse.json({ ok: true, data: result });
    }
    case "addTip": {
      if (!splitId || tipAmount === undefined) {
        return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
      }
      const result = await addTip(splitId, tipAmount);
      return NextResponse.json({ ok: true, data: result });
    }
    case "getStatus": {
      if (!splitId) {
        return NextResponse.json({ ok: false, error: "splitId required" }, { status: 400 });
      }
      const status = await getSplitStatus(splitId);
      return NextResponse.json({ ok: true, data: status });
    }
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}
