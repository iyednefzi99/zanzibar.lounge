import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { generateApiKey, revokeApiKey, createAuditLog } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- POST: generate API key ---

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { name } = body as { name?: string };
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "missing or invalid name" },
      { status: 400 },
    );
  }

  const restaurantId = process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id
    : null;

  if (!restaurantId) {
    return NextResponse.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  try {
    const { id, key, keyPrefix } = await generateApiKey(
      restaurantId,
      name.trim(),
    );

    await createAuditLog(restaurantId, "apikey.created", null, {
      apiKeyId: id,
      name: name.trim(),
      keyPrefix,
    });

    return NextResponse.json({
      ok: true,
      id,
      key,
      keyPrefix,
      name: name.trim(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "key_generation_failed", message },
      { status: 500 },
    );
  }
}

// --- DELETE: revoke API key ---

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { keyId } = body as { keyId?: string };
  if (!keyId || typeof keyId !== "string") {
    return NextResponse.json(
      { error: "missing keyId" },
      { status: 400 },
    );
  }

  const restaurantId = process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id
    : null;

  try {
    await revokeApiKey(keyId);

    await createAuditLog(restaurantId ?? "", "apikey.revoked", null, {
      apiKeyId: keyId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "API_KEY_NOT_FOUND") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "revoke_failed", message },
      { status: 500 },
    );
  }
}
