import { NextResponse } from "next/server";
import { z } from "zod";

import { completeSetup } from "@/lib/saas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  token: z.string().min(1),
  restaurantName: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase alphanumeric with hyphens"),
  ownerName: z.string().trim().min(2).max(100),
  ownerEmail: z.string().email(),
  password: z.string().min(8).max(128),
  timezone: z.string().trim().max(50).optional(),
  locale: z.enum(["fr", "ar", "en"]).optional(),
});

export async function POST(request: Request) {
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

  const result = await completeSetup(parsed.data.token, {
    restaurantName: parsed.data.restaurantName,
    slug: parsed.data.slug,
    ownerName: parsed.data.ownerName,
    ownerEmail: parsed.data.ownerEmail,
    password: parsed.data.password,
    timezone: parsed.data.timezone,
    locale: parsed.data.locale,
  });

  if (!result.ok) {
    const code = result.error.code;
    const status =
      code === "TOKEN_INVALID" || code === "TOKEN_EXPIRED" ? 400 : 409;

    return NextResponse.json({ error: "setup_failed", code }, { status });
  }

  return NextResponse.json({
    ok: true,
    restaurant: {
      id: result.restaurant.id,
      name: result.restaurant.name,
      slug: result.restaurant.slug,
    },
  });
}
