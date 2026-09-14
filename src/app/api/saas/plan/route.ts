import { NextResponse } from "next/server";
import { z } from "zod";

import { createCheckoutSessionForPlan, getRestaurantUsage } from "@/lib/saas";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- GET: current plan & usage ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "missing restaurantId" },
      { status: 400 },
    );
  }

  const usage = await getRestaurantUsage(restaurantId);

  if (!usage) {
    return NextResponse.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    plan: usage.plan,
    reservationsThisMonth: usage.reservationsThisMonth,
    reservationLimit: usage.reservationLimit,
    ordersThisMonth: usage.ordersThisMonth,
    guestsThisMonth: usage.guestsThisMonth,
    revenueThisMonth: usage.revenueThisMonth,
  });
}

// --- POST: upgrade plan ---

const postBody = z.object({
  restaurantId: z.string().min(1),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = postBody.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  try {
    const { url } = await createCheckoutSessionForPlan(
      parsed.data.restaurantId,
      parsed.data.plan,
      parsed.data.successUrl,
      parsed.data.cancelUrl,
    );

    logger.info("checkout session created", {
      restaurantId: parsed.data.restaurantId,
      plan: parsed.data.plan,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "INVALID_PLAN") {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    if (message === "RESTAURANT_NOT_FOUND") {
      return NextResponse.json(
        { error: "restaurant_not_found" },
        { status: 404 },
      );
    }

    logger.error("checkout failed", {
      error: message,
      restaurantId: parsed.data.restaurantId,
    });
    return NextResponse.json(
      { error: "checkout_failed", message },
      { status: 500 },
    );
  }
}
