import { NextRequest, NextResponse } from "next/server";

import { handleWebhookEvent } from "@/lib/payments";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  try {
    const payload = await request.text();
    const result = await handleWebhookEvent(payload, signature);

    logger.info("Stripe webhook processed", {
      type: result.type,
      processed: result.processed,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Stripe webhook failed", { error: message });
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }
}
