import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrder, getGuestOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  phone: z.string().min(8),
  cart: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1).max(20),
    }),
  ).min(1),
  pickupMinutes: z.number().int().min(0).max(1439).nullable(),
  notes: z.string().max(500).nullable(),
  locale: z.enum(["fr", "ar", "en"]),
});

/**
 * POST /api/orders — Créer une commande.
 * GET  /api/orders?phone=+216... — Historique d'un client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "phone requis" }, { status: 400 });
  }

  const orders = await getGuestOrders(phone);
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { phone, cart, pickupMinutes, notes, locale } = parsed.data;
  const result = await createOrder(phone, cart, pickupMinutes, notes, locale);

  if (!result.ok) {
    const status = result.error.code === "CART_EMPTY" ? 400 : 400;
    return NextResponse.json({ error: result.error.code }, { status });
  }

  return NextResponse.json(result.value, { status: 201 });
}
