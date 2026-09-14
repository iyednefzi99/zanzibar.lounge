import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getGuestAiProfile, upsertGuestAiProfile } from "@/lib/personalization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");
  if (!guestId) {
    return NextResponse.json({ error: "guestId required" }, { status: 400 });
  }

  const profile = await getGuestAiProfile(guestId);
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { guestId, ...data } = body;
  if (!guestId) {
    return NextResponse.json({ error: "guestId required" }, { status: 400 });
  }

  const profile = await upsertGuestAiProfile(guestId, data);
  return NextResponse.json(profile);
}
