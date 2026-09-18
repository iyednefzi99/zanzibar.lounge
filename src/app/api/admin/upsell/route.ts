import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getUpsellRules, upsertUpsellRule } from "@/lib/smart-upsell";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const rules = await getUpsellRules(restaurantId);
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, ...ruleData } = body;

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  if (!ruleData.name || !ruleData.triggerEvent || !ruleData.suggestionType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rule = await upsertUpsellRule(restaurantId, ruleData);
  return NextResponse.json({ rule }, { status: 201 });
}
