import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getRealtimeStats } from "@/lib/analytics-advanced";

/**
 * Real-time stats API endpoint.
 *
 * Used by the client-side auto-refresh on the realtime dashboard.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getRealtimeStats();
  return NextResponse.json(stats);
}
