import { NextResponse } from "next/server";

import { createReview } from "@/lib/reviews";
import { requireGuestSession } from "@/lib/guest-session";

export async function POST(request: Request) {
  try {
    const session = await requireGuestSession();
    const body = await request.json();
    const { reservationId, rating, body: reviewBody } = body as {
      reservationId?: string;
      rating?: number;
      body?: string;
    };

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const result = await createReview({
      guestId: session.guestId,
      reservationId,
      rating,
      body: reviewBody,
      locale: session.locale as "fr" | "ar" | "en",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
