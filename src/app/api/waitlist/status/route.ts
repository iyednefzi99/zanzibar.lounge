import { NextResponse } from "next/server";
import { getGuestSessionFromCookie } from "@/lib/guest-session";
import {
  getWaitlistForGuest,
  calculateEstimatedWait,
  getAvailableRewards,
} from "@/lib/waitlist";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  const entries = await getWaitlistForGuest(session.guestId);
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const estimatedWait = await calculateEstimatedWait(
    entry.restaurantId,
    entry.date,
    entry.partySize,
  );
  const rewards = await getAvailableRewards(entry.restaurantId);

  return NextResponse.json({
    entry,
    estimatedWait,
    rewards,
  });
}
