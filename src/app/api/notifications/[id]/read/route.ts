import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { markAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/[id]/read — Marquer une notification comme lue.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notification = await markAsRead(id);

  if (!notification) {
    return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
  }

  return NextResponse.json(notification);
}
