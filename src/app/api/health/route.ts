import { NextRequest, NextResponse } from "next/server";
import { getHealth, getMetrics } from "@/lib/health";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "health";

  if (type === "metrics") {
    const metrics = await getMetrics();
    return NextResponse.json(metrics, {
      status: metrics.status === "unhealthy" ? 503 : 200,
    });
  }

  const health = await getHealth();
  return NextResponse.json(health, {
    status: health.status === "unhealthy" ? 503 : 200,
  });
}
