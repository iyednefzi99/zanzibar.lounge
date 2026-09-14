import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { generateTwoFactorSecret } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const { staffId } = body as { staffId?: string };
  if (!staffId || typeof staffId !== "string") {
    return NextResponse.json(
      { error: "missing staffId" },
      { status: 400 },
    );
  }

  try {
    const { secret, otpauthUri } = await generateTwoFactorSecret(staffId);
    return NextResponse.json({ ok: true, secret, otpauthUri });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "STAFF_NOT_FOUND") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "setup_failed", message },
      { status: 500 },
    );
  }
}
