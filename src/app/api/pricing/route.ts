import { NextResponse } from "next/server";

import { getSlotPricing } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const minutes = searchParams.get("minutes");
  const partySize = searchParams.get("partySize");

  if (!date || !minutes || !partySize) {
    return NextResponse.json(
      { error: "missing_params", required: ["date", "minutes", "partySize"] },
      { status: 400 },
    );
  }

  const pricing = await getSlotPricing(
    date,
    Number(minutes),
    Number(partySize),
  );

  return NextResponse.json({ pricing });
}
