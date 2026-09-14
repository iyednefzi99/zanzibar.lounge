import { NextRequest, NextResponse } from "next/server";

import { getPaymentStatus } from "@/lib/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 },
    );
  }

  const result = await getPaymentStatus(sessionId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.code },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, payment: result.value });
}
