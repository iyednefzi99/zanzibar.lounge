import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { runComplianceCheck, getComplianceChecks, getComplianceStatus } from "@/lib/sustainability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const type = searchParams.get("type") as "allergen" | "food_safety" | "hygiene" | null;
  const summary = searchParams.get("summary") === "true";

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  if (summary) {
    const status = await getComplianceStatus(restaurantId);
    return NextResponse.json(status);
  }

  const checks = await getComplianceChecks(restaurantId, type ?? undefined);
  return NextResponse.json(checks);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, type, details } = body;

  if (!restaurantId || !type) {
    return NextResponse.json({ error: "restaurantId, type required" }, { status: 400 });
  }

  const check = await runComplianceCheck(restaurantId, type, details);
  return NextResponse.json(check, { status: 201 });
}
