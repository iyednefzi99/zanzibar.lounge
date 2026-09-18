import { NextResponse } from "next/server";

import { processWaitlistResponse } from "@/lib/waitlist";
import { getGuestSessionFromCookie } from "@/lib/guest-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { entryId, response } = (payload ?? {}) as {
    entryId?: string;
    response?: "accept" | "decline";
  };

  if (!entryId || !response || !["accept", "decline"].includes(response)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await processWaitlistResponse(entryId, response);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "NOT_FOUND" ? 404 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    reservationRef: result.reservationRef,
  });
}
