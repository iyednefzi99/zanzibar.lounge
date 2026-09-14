import { NextResponse } from "next/server";
import { getAvailableRestaurants } from "@/lib/discovery";

export async function GET() {
  const restaurants = await getAvailableRestaurants();
  return NextResponse.json({ ok: true, data: restaurants });
}
