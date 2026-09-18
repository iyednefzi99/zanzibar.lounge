import { NextRequest, NextResponse } from "next/server";
import { getAvailableRestaurants } from "@/lib/discovery";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await rateLimit(`discovery:list:ip:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const restaurants = await getAvailableRestaurants();
  return NextResponse.json({ ok: true, data: restaurants });
}
