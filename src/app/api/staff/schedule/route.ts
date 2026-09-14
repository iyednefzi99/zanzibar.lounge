import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getShifts, createShift, updateShift, deleteShift } from "@/lib/staff/scheduling";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const startDate = request.nextUrl.searchParams.get("startDate") ?? new Date().toISOString().split("T")[0];
  const endDate = request.nextUrl.searchParams.get("endDate") ?? startDate;

  const shifts = await getShifts(restaurantId, startDate, endDate);
  return NextResponse.json({ ok: true, data: shifts });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const body = await request.json();

  const shift = await createShift(restaurantId, body);
  return NextResponse.json({ ok: true, data: shift });
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  const shift = await updateShift(id, data);
  return NextResponse.json({ ok: true, data: shift });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  await deleteShift(id);
  return NextResponse.json({ ok: true });
}
