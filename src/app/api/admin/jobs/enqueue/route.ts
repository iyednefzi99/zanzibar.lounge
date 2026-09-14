import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { enqueueJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const { type, data } = body;

  if (!type) {
    return NextResponse.json({ ok: false, error: "type required" }, { status: 400 });
  }

  const jobId = await enqueueJob(type, data ?? {});
  return NextResponse.json({ ok: true, data: { jobId } });
}
