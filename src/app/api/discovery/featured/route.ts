import { NextResponse } from "next/server";
import { getFeaturedRestaurants } from "@/lib/discovery";

export async function GET() {
  const restaurants = await getFeaturedRestaurants();
  return NextResponse.json({ ok: true, data: restaurants });
}
