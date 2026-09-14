import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { syncMenuFromPos } from "@/lib/pos/sync";
import type { PosProvider } from "@/lib/pos";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const { provider, type } = body;

  if (!provider) {
    return NextResponse.json({ ok: false, error: "provider required" }, { status: 400 });
  }

  if (type === "menu") {
    const result = await syncMenuFromPos(restaurantId, provider as PosProvider);
    return NextResponse.json({ ok: result.success, data: result });
  }

  return NextResponse.json({ ok: false, error: `Sync type ${type} not implemented` }, { status: 400 });
}
