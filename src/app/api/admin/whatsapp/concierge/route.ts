import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const intent = searchParams.get("intent");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const where: Record<string, unknown> = {};
  if (restaurantId) where.restaurantId = restaurantId;
  if (intent) where.intentDetected = intent;

  const [interactions, total] = await Promise.all([
    db.conciergeInteraction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        conversation: {
          select: { id: true, locale: true, lastMessageAt: true },
        },
      },
    }),
    db.conciergeInteraction.count({ where }),
  ]);

  const stats = await db.conciergeInteraction.groupBy({
    by: ["intentDetected", "aiProcessed"],
    where: restaurantId ? { restaurantId } : undefined,
    _count: true,
  });

  return NextResponse.json({
    interactions,
    total,
    stats: stats.map((s) => ({
      intent: s.intentDetected,
      handoff: s.aiProcessed,
      count: s._count,
    })),
  });
}
