import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getServerPerformance, getShiftReport } from "@/lib/staff/performance";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const startDate = request.nextUrl.searchParams.get("startDate") ?? new Date().toISOString().split("T")[0];
  const endDate = request.nextUrl.searchParams.get("endDate") ?? startDate;
  const type = request.nextUrl.searchParams.get("type") ?? "performance";

  if (type === "report") {
    const report = await getShiftReport(restaurantId, startDate);
    return NextResponse.json({ ok: true, data: report });
  }

  const performance = await getServerPerformance(restaurantId, startDate, endDate);
  return NextResponse.json({ ok: true, data: performance });
}
