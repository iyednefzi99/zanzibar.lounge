import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { clockIn, clockOut, getCurrentEntry } from "@/lib/staff/timeclock";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const staffId = request.nextUrl.searchParams.get("staffId");

  if (!staffId) {
    return NextResponse.json({ ok: false, error: "staffId required" }, { status: 400 });
  }

  const entry = await getCurrentEntry(staffId);
  return NextResponse.json({ ok: true, data: entry });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const { action, staffId } = body;

  if (!staffId) {
    return NextResponse.json({ ok: false, error: "staffId required" }, { status: 400 });
  }

  if (action === "clockIn") {
    const entry = await clockIn(staffId, restaurantId);
    return NextResponse.json({ ok: true, data: entry });
  }

  if (action === "clockOut") {
    const entry = await clockOut(staffId);
    return NextResponse.json({ ok: true, data: entry });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
