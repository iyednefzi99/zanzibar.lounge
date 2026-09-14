import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getJobs, getJobStats } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const type = request.nextUrl.searchParams.get("type");
  const stats = getJobStats();
  const jobs = getJobs(type ?? undefined);

  return NextResponse.json({ ok: true, data: { stats, jobs } });
}
