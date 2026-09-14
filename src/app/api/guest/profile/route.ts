import { NextResponse } from "next/server";

import { getOrCreateGuestProfile, updateGuestProfile, type GuestProfileInput } from "@/lib/guest-app";
import { requireGuestSession } from "@/lib/guest-session";

export async function GET() {
  try {
    const session = await requireGuestSession();
    const profile = await getOrCreateGuestProfile(session.guestId);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireGuestSession();
    const body = await request.json();

    const input: GuestProfileInput = {};
    if ("displayName" in body) input.displayName = body.displayName;
    if ("avatarUrl" in body) input.avatarUrl = body.avatarUrl;
    if ("birthday" in body) input.birthday = body.birthday ? new Date(body.birthday) : null;
    if ("favoriteZone" in body) input.favoriteZone = body.favoriteZone;
    if ("defaultPartySize" in body) input.defaultPartySize = body.defaultPartySize;
    if ("language" in body) input.language = body.language;
    if ("pushEnabled" in body) input.pushEnabled = body.pushEnabled;
    if ("emailOptIn" in body) input.emailOptIn = body.emailOptIn;
    if ("preferences" in body) input.preferences = body.preferences;

    const profile = await updateGuestProfile(session.guestId, input);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
