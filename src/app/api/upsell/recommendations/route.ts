import { NextResponse } from "next/server";
import { getUpsellRecommendations, recordUpsellAcceptance } from "@/lib/smart-upsell";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const reservationId = searchParams.get("reservationId");
  const guestId = searchParams.get("guestId");
  const context = searchParams.get("context") ?? "reservation";
  const partySize = searchParams.get("partySize")
    ? parseInt(searchParams.get("partySize")!, 10)
    : undefined;
  const zone = searchParams.get("zone") ?? undefined;
  const hour = searchParams.get("hour")
    ? parseInt(searchParams.get("hour")!, 10)
    : undefined;

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const suggestions = await getUpsellRecommendations({
    restaurantId,
    reservationId: reservationId ?? undefined,
    guestId: guestId ?? undefined,
    context: context as "reservation" | "pre_arrival" | "in_dining",
    partySize,
    zone,
    hour,
  });

  return NextResponse.json({ suggestions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { suggestionId } = body;

  if (!suggestionId) {
    return NextResponse.json({ error: "Missing suggestionId" }, { status: 400 });
  }

  const result = await recordUpsellAcceptance(suggestionId);

  return NextResponse.json(result);
}
