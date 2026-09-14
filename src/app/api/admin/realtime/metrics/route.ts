import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { recordLiveMetric, getLatestMetrics } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const metricType = searchParams.get("metricType");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const metrics = await getLatestMetrics(restaurantId, metricType ?? undefined);
  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, metricType, value, unit, metadata } = body;

  if (!restaurantId || !metricType || value == null) {
    return NextResponse.json({ error: "restaurantId, metricType, value required" }, { status: 400 });
  }

  const metric = await recordLiveMetric(restaurantId, metricType, value, unit, metadata);
  return NextResponse.json(metric, { status: 201 });
}
