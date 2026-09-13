import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrCreateAccount, getTransactionHistory, redeemPoints } from "@/lib/loyalty";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const redeemSchema = z.object({
  phone: z.string().min(1),
  points: z.number().int().positive(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone requis" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const [account, history] = await Promise.all([
    getOrCreateAccount(guest.id),
    getTransactionHistory(guest.id, 30),
  ]);

  return NextResponse.json({ account, history });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rl = await rateLimit(`loyalty:${ip}`, 10, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 },
    );
  }

  const { phone, points } = parsed.data;

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const guest = await db.guest.findUnique({ where: { phone: normalized } });
  if (!guest) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const result = await redeemPoints(guest.id, points, "redeemed");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, account: result.account });
}
