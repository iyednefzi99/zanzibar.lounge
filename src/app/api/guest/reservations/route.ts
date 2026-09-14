import { NextResponse } from "next/server";

import { getGuestHistory } from "@/lib/guest-app";
import { requireGuestSession } from "@/lib/guest-session";

export async function GET() {
  try {
    const session = await requireGuestSession();
    const reservations = await getGuestHistory(session.guestId);
    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
