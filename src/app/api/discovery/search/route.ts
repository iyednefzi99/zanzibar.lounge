import { NextRequest, NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/discovery";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limitCheck = await rateLimit(`discovery:ip:${ip}`, 30, 60_000);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limitCheck.retryAfter) } },
    );
  }

  const sp = request.nextUrl.searchParams;

  const result = await searchRestaurants({
    query: sp.get("q") ?? undefined,
    cuisine: sp.get("cuisine") ?? undefined,
    priceRange: sp.get("price") ? Number(sp.get("price")) : undefined,
    minRating: sp.get("rating") ? Number(sp.get("rating")) : undefined,
    isOpenNow: sp.get("open") === "1",
    sortBy: (sp.get("sort") as "rating" | "price" | "name" | "popularity" | "newest") ?? "rating",
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 12,
  });

  return NextResponse.json({ ok: true, data: result });
}
