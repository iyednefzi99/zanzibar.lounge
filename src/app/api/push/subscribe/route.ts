import { NextResponse } from "next/server";
import { z } from "zod";

import { subscribe } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  guestId: z.string().optional(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rl = await rateLimit(`push-sub:${ip}`, 10, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { endpoint, keys, guestId } = parsed.data;

  await subscribe(endpoint, keys.p256dh, keys.auth, guestId);

  return NextResponse.json({ ok: true });
}
