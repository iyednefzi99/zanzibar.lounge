import { NextResponse } from "next/server";
import {
  reserveSocialTable,
  cancelSocialTableReservation,
  checkSocialTableAvailability,
} from "@/lib/social-dining";
import { getGuestSessionFromCookie } from "@/lib/guest-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const socialTableId = searchParams.get("socialTableId");
  const date = searchParams.get("date");
  const partySize = searchParams.get("partySize")
    ? parseInt(searchParams.get("partySize")!, 10)
    : undefined;

  if (!socialTableId || !date || !partySize) {
    return NextResponse.json(
      { error: "Missing socialTableId, date, or partySize" },
      { status: 400 },
    );
  }

  const availability = await checkSocialTableAvailability(
    socialTableId,
    date,
    partySize,
  );

  return NextResponse.json(availability);
}

export async function POST(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { socialTableId, restaurantId, serviceDate, partySize, reservationId } = body;

  if (!socialTableId || !restaurantId || !serviceDate || !partySize) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await reserveSocialTable({
    socialTableId,
    guestId: session.guestId,
    restaurantId,
    serviceDate,
    partySize,
    reservationId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reservationId } = body;

  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });
  }

  const result = await cancelSocialTableReservation(reservationId, session.guestId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
