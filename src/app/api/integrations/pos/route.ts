import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { createPosIntegration, deletePosIntegration, getPosIntegrations } from "@/lib/pos";
import type { PosProvider } from "@/lib/pos";

export async function GET() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const integrations = await getPosIntegrations(restaurantId);
  return NextResponse.json({ ok: true, data: integrations });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const { provider, apiKey, apiSecret, locationId, syncMenu, syncOrders, syncPayments } = body;

  if (!provider) {
    return NextResponse.json({ ok: false, error: "provider required" }, { status: 400 });
  }

  const integration = await createPosIntegration(restaurantId, {
    provider: provider as PosProvider,
    apiKey,
    apiSecret,
    locationId,
    syncMenu,
    syncOrders,
    syncPayments,
  });

  return NextResponse.json({ ok: true, data: integration });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const provider = request.nextUrl.searchParams.get("provider");

  if (!provider) {
    return NextResponse.json({ ok: false, error: "provider required" }, { status: 400 });
  }

  await deletePosIntegration(restaurantId, provider as PosProvider);
  return NextResponse.json({ ok: true });
}
