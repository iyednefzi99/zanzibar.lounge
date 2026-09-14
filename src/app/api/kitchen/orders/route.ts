import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = await getDefaultRestaurantId();

  const orders = await db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["PENDING", "PREPARING", "READY"] },
    },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const payload = orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    status: o.status,
    notes: o.notes,
    total: o.total,
    pickupMinutes: o.pickupMinutes,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((oi) => ({
      id: oi.id,
      name: oi.menuItem.name,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
    })),
  }));

  return NextResponse.json(payload);
}
