import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createStripePortalSession } from "@/lib/saas";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  restaurantId: z.string().min(1),
  returnUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  try {
    const url = await createStripePortalSession(
      parsed.data.restaurantId,
      parsed.data.returnUrl,
    );

    logger.info("portal session created", {
      restaurantId: parsed.data.restaurantId,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NO_STRIPE_CUSTOMER") {
      return NextResponse.json(
        { error: "no_stripe_customer", message },
        { status: 400 },
      );
    }

    logger.error("portal session failed", {
      error: message,
      restaurantId: parsed.data.restaurantId,
    });
    return NextResponse.json(
      { error: "portal_failed", message },
      { status: 500 },
    );
  }
}
