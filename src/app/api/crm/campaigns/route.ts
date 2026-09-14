import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { createCampaign, getCampaigns, sendCampaign, getCampaignStats } from "@/lib/crm/campaigns";

export async function GET() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const campaigns = await getCampaigns(restaurantId);
  return NextResponse.json({ ok: true, data: campaigns });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const campaign = await createCampaign(restaurantId, body);
  return NextResponse.json({ ok: true, data: campaign });
}
