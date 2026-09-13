import { NextResponse } from "next/server";

import { getOrderDetail, updateOrderStatus } from "@/lib/orders";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id — Détail d'une commande.
 * PATCH /api/orders/:id — Modifier le statut (admin).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (typeof body.status !== "string") {
    return NextResponse.json({ error: "status requis" }, { status: 400 });
  }

  const result = await updateOrderStatus(id, body.status);

  if (!result.ok) {
    return NextResponse.json({ error: result.error.code }, { status: 400 });
  }

  return NextResponse.json(result.value);
}
