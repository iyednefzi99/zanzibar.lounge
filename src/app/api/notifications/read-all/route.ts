import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { markAllAsRead } from "@/lib/notifications";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/read-all — Marquer toutes les notifications comme lues.
 */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = await getDefaultRestaurantId();
  const count = await markAllAsRead(restaurantId, { kind: "broadcast" });

  return NextResponse.json({ count });
}
