import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { disableTwoFactor, verifyTwoFactorCode, createAuditLog } from "@/lib/security";
import { db } from "@/lib/db";

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

  const { staffId, code } = body as { staffId?: string; code?: string };

  if (!staffId || !code) {
    return NextResponse.json(
      { error: "missing staffId or code" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "code must be 6 digits" },
      { status: 400 },
    );
  }

  try {
    const verified = await verifyTwoFactorCode(staffId, code);
    if (!verified) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    }

    await disableTwoFactor(staffId);

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { restaurantId: true },
    });

    await createAuditLog(
      staff?.restaurantId ?? "",
      "2fa.disabled",
      staffId,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "disable_failed", message },
      { status: 500 },
    );
  }
}
