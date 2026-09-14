import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import {
  createNotification,
  getNotifications,
  type NotificationTypeValue,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum([
    "RESERVATION_REMINDER",
    "ORDER_READY",
    "FLASH_OFFER",
    "BIRTHDAY",
    "SYSTEM",
    "ANNOUNCEMENT",
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  data: z.record(z.string(), z.unknown()).optional(),
  actionUrl: z.string().max(500).optional(),
  target: z.union([
    z.object({ kind: z.literal("guest"), guestId: z.string().min(1) }),
    z.object({ kind: z.literal("staff"), staffId: z.string().min(1) }),
    z.object({ kind: z.literal("broadcast") }),
  ]),
});

/**
 * GET  /api/notifications — Lister les notifications (admin).
 * POST /api/notifications — Créer une notification (admin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const type = searchParams.get("type") as NotificationTypeValue | null;
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const restaurantId = await getDefaultRestaurantId();

  const validTypes: NotificationTypeValue[] = [
    "RESERVATION_REMINDER",
    "ORDER_READY",
    "FLASH_OFFER",
    "BIRTHDAY",
    "SYSTEM",
    "ANNOUNCEMENT",
  ];

  const result = await getNotifications(restaurantId, {
    page,
    limit,
    type: type && validTypes.includes(type) ? type : undefined,
    unreadOnly,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const restaurantId = await getDefaultRestaurantId();
  const notification = await createNotification(restaurantId, parsed.data);

  return NextResponse.json(notification, { status: 201 });
}
