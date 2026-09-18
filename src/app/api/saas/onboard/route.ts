import { NextResponse } from "next/server";
import { z } from "zod";

import { createSetupToken } from "@/lib/saas";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  email: z.string().email(),
  restaurantName: z.string().trim().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`onboard:ip:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  const result = await createSetupToken(
    parsed.data.email,
    parsed.data.restaurantName,
  );

  if (!result.ok) {
    logger.error("onboard failed", { error: result.error.code });
    return NextResponse.json(
      { error: "onboard_failed", code: result.error.code },
      { status: 500 },
    );
  }

  logger.info("onboard token created", { email: parsed.data.email });

  return NextResponse.json({
    ok: true,
    token: result.token,
  });
}
