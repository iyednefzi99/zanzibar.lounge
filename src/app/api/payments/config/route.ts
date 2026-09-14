import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getPaymentConfig, updatePaymentConfig } from "@/lib/payments/config";

export async function GET() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const config = await getPaymentConfig(restaurantId);
  return NextResponse.json({ ok: true, data: config });
}

export async function PUT(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();
  await updatePaymentConfig(restaurantId, body);
  return NextResponse.json({ ok: true });
}
