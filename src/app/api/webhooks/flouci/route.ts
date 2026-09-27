import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyFlouciWebhook, type FlouciWebhookEvent } from "@/lib/payments/flouci";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-flouci-signature");

  if (!verifyFlouciWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: FlouciWebhookEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { order_id, status } = payload;

  if (status === "completed") {
    await db.reservation.updateMany({
      where: { reference: order_id },
      data: { status: "CONFIRMED" },
    });
  }

  return NextResponse.json({ received: true });
}
