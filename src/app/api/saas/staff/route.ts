import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createStaff, getStaffMembers } from "@/lib/staff-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- GET: list staff ---

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "missing restaurantId" },
      { status: 400 },
    );
  }

  const members = await getStaffMembers(restaurantId);

  return NextResponse.json({
    ok: true,
    staff: members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      active: m.active,
      lastLoginAt: m.lastLoginAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// --- POST: create staff ---

const postBody = z.object({
  restaurantId: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(8).max(128),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = postBody.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  try {
    const member = await createStaff({
      restaurantId: parsed.data.restaurantId,
      email: parsed.data.email,
      name: parsed.data.name,
      password: parsed.data.password,
      role: parsed.data.role,
    });

    logger.info("staff created via API", {
      staffId: member.id,
      restaurantId: parsed.data.restaurantId,
      role: member.role,
    });

    return NextResponse.json({
      ok: true,
      staff: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        active: member.active,
        createdAt: member.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "email_taken", message },
        { status: 409 },
      );
    }

    logger.error("staff creation failed", {
      error: message,
      restaurantId: parsed.data.restaurantId,
    });
    return NextResponse.json(
      { error: "staff_creation_failed", message },
      { status: 500 },
    );
  }
}
