import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantUsage } from "@/lib/saas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "missing restaurantId" },
      { status: 400 },
    );
  }

  const usage = await getRestaurantUsage(restaurantId);

  if (!usage) {
    return NextResponse.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    usage: {
      plan: usage.plan,
      reservationsThisMonth: usage.reservationsThisMonth,
      reservationLimit: usage.reservationLimit,
      ordersThisMonth: usage.ordersThisMonth,
      guestsThisMonth: usage.guestsThisMonth,
      revenueThisMonth: usage.revenueThisMonth,
    },
  });
}
