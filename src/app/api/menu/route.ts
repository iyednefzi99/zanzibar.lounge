import { NextResponse } from "next/server";

import { getMenu } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/menu — Articles du menu disponibles.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`menu:ip:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const menu = await getMenu();
  return NextResponse.json(menu);
}
