import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { logCarbon, getCarbonLogs } from "@/lib/sustainability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category") as "energy" | "transport" | "waste" | "water" | null;

  if (!restaurantId || !from || !to) {
    return NextResponse.json({ error: "restaurantId, from, to required" }, { status: 400 });
  }

  const logs = await getCarbonLogs(restaurantId, new Date(from), new Date(to), category ?? undefined);
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, category, amount, unit, source, period } = body;

  if (!restaurantId || !category || amount == null || !unit || !period) {
    return NextResponse.json({ error: "restaurantId, category, amount, unit, period required" }, { status: 400 });
  }

  const log = await logCarbon(restaurantId, category, amount, unit, source, new Date(period));
  return NextResponse.json(log, { status: 201 });
}
