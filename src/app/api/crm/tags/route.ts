import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { assignTag, unassignTag, getTags } from "@/lib/crm/tags";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const tags = await getTags(restaurantId);
  return NextResponse.json({ ok: true, data: tags });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { guestId, tagId } = body;

  if (!guestId || !tagId) {
    return NextResponse.json({ ok: false, error: "guestId and tagId required" }, { status: 400 });
  }

  await assignTag(guestId, tagId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { guestId, tagId } = body;

  if (!guestId || !tagId) {
    return NextResponse.json({ ok: false, error: "guestId and tagId required" }, { status: 400 });
  }

  await unassignTag(guestId, tagId);
  return NextResponse.json({ ok: true });
}
