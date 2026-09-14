import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendCampaign, getCampaignStats } from "@/lib/crm/campaigns";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const result = await sendCampaign(id);
  return NextResponse.json({ ok: true, data: result });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const stats = await getCampaignStats(id);
  if (!stats) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: stats });
}
