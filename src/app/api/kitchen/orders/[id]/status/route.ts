import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const VALID_TRANSITIONS: Record<string, string> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const restaurantId = await getDefaultRestaurantId();

  const order = await db.order.findFirst({
    where: { id, restaurantId },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus = VALID_TRANSITIONS[order.status];
  if (!nextStatus) {
    return NextResponse.json(
      { error: `Cannot advance from ${order.status}` },
      { status: 409 },
    );
  }

  const updated = await db.order.update({
    where: { id },
    data: { status: nextStatus as "PREPARING" | "READY" | "COMPLETED" },
    select: { id: true, status: true },
  });

  if (nextStatus === "COMPLETED") {
    const { accrueForOrder } = await import("@/lib/loyalty");
    const fullOrder = await db.order.findUnique({
      where: { id },
      select: { guestId: true, total: true, reference: true },
    });
    if (fullOrder) {
      await accrueForOrder(fullOrder.guestId, fullOrder.total, fullOrder.reference).catch(() => {});
    }
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
