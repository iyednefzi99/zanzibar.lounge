import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAvailableRewards, createWaitlistReward } from "@/lib/waitlist";

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

  const rewards = await getAvailableRewards(restaurantId);
  return NextResponse.json({ rewards });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, name, description, type, value, minWaitMinutes, maxRedemptions } = body;

  if (!restaurantId || !name || !type || value === undefined || minWaitMinutes === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reward = await createWaitlistReward(restaurantId, {
    name,
    description,
    type,
    value,
    minWaitMinutes,
    maxRedemptions,
  });

  return NextResponse.json({ reward }, { status: 201 });
}
