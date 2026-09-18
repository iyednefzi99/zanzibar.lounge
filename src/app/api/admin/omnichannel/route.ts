import { NextResponse } from "next/server";

import { getUnifiedThread, getChannelSummary } from "@/lib/omnichannel";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");

  if (!guestId) {
    return NextResponse.json({ error: "missing_guestId" }, { status: 400 });
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

  const [thread, channels] = await Promise.all([
    getUnifiedThread(guestId, { limit }),
    getChannelSummary(guestId),
  ]);

  return NextResponse.json({ thread, channels });
}
