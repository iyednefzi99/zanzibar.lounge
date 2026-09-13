import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getOpenOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders — Commandes ouvertes (polling admin).
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOpenOrders();
  return NextResponse.json(orders);
}
