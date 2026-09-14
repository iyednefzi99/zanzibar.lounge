import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET(): Promise<
  NextResponse<{
    status: string;
    version: string;
    uptime: number;
    db: { status: string; latencyMs: number; error?: string };
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  }>
> {
  const result = await healthCheck();

  return NextResponse.json(result, {
    status: result.status === "healthy" ? 200 : 503,
  });
}
