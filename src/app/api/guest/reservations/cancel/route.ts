import { NextResponse } from "next/server";

import { cancelReservation } from "@/lib/reservations";
import { requireGuestSession } from "@/lib/guest-session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await requireGuestSession();
    const body = await request.json();
    const { reference } = body as { reference?: string };

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const reservation = await db.reservation.findFirst({
      where: { reference, guestId: session.guestId },
      select: { id: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await cancelReservation(reference, "guest");
    if (!result.ok) {
      return NextResponse.json({ error: result.error.code }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reservation: result.value });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
