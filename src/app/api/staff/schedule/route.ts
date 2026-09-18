import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getShifts, createShift, updateShift, deleteShift } from "@/lib/staff/scheduling";

const createShiftSchema = z.object({
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  role: z.string().optional(),
});

const patchShiftSchema = z.object({
  id: z.string().min(1),
  staffId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  role: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const restaurantId = await getDefaultRestaurantId();
    const startDate = request.nextUrl.searchParams.get("startDate") ?? new Date().toISOString().split("T")[0];
    const endDate = request.nextUrl.searchParams.get("endDate") ?? startDate;

    const shifts = await getShifts(restaurantId, startDate, endDate);
    return NextResponse.json({ ok: true, data: shifts });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const restaurantId = await getDefaultRestaurantId();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const parsed = createShiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
        { status: 400 },
      );
    }

    const shift = await createShift(restaurantId, parsed.data);
    return NextResponse.json({ ok: true, data: shift });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "internal_error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const parsed = patchShiftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
        { status: 400 },
      );
    }

    const { id, ...data } = parsed.data;
    const shift = await updateShift(id, data);
    return NextResponse.json({ ok: true, data: shift });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "internal_error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }

    await deleteShift(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "internal_error" },
      { status: 500 },
    );
  }
}
