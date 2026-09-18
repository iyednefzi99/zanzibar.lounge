import { NextRequest, NextResponse } from "next/server";

import {
  createCheckoutSession,
  createDepositSession,
} from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  const ipLimit = await rateLimit(`checkout:ip:${ip}`, 6, 10 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(ipLimit.retryAfter) } },
    );
  }

  try {
    const body = await request.json();
    const {
      type,
      orderId,
      reservationId,
      amount,
      currency,
      successUrl,
      cancelUrl,
    } = body;

    if (!type || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, successUrl, cancelUrl" },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    if (type === "order" && orderId) {
      const result = await createCheckoutSession(
        orderId,
        amount,
        currency ?? "TND",
        successUrl ?? `${baseUrl}/fr/commander?success=true`,
        cancelUrl ?? `${baseUrl}/fr/commander?cancelled=true`,
      );

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error.code },
          { status: 400 },
        );
      }

      return NextResponse.json({
        ok: true,
        sessionId: result.value.sessionId,
        url: result.value.url,
      });
    }

    if (type === "deposit" && reservationId) {
      const result = await createDepositSession(
        reservationId,
        amount,
        currency ?? "TND",
        successUrl ?? `${baseUrl}/fr/reserver?success=true`,
        cancelUrl ?? `${baseUrl}/fr/reserver?cancelled=true`,
      );

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error.code },
          { status: 400 },
        );
      }

      return NextResponse.json({
        ok: true,
        sessionId: result.value.sessionId,
        url: result.value.url,
      });
    }

    return NextResponse.json(
      { error: "Invalid type or missing ID" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Payment checkout error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
