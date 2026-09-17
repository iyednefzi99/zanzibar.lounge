import { NextResponse } from "next/server";
import { getGuestSessionFromCookie } from "@/lib/guest-session";
import { checkInWaitlist } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { entryId } = body;

  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  const result = await checkInWaitlist(entryId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "INVALID_STATUS" ? 409 : 404 },
    );
  }

  return NextResponse.json(result);
}
