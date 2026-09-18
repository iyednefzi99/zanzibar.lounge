import { NextResponse } from "next/server";
import { z } from "zod";

import { joinWaitlist, cancelWaitlistEntry, getWaitlistForGuest } from "@/lib/waitlist";
import { getGuestSessionFromCookie } from "@/lib/guest-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const joinBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minutes: z.number().int().min(0).max(2879),
  partySize: z.number().int().min(1).max(12),
});

export async function POST(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = joinBody.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues.map((i) => i.path) },
      { status: 400 },
    );
  }

  const result = await joinWaitlist({
    guestId: session.guestId,
    date: parsed.data.date,
    minutes: parsed.data.minutes,
    partySize: parsed.data.partySize,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "ALREADY_JOINED" ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    position: result.position,
    entryId: result.entry.id,
  });
}

export async function GET() {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const entries = await getWaitlistForGuest(session.guestId);
  return NextResponse.json({ entries });
}

export async function DELETE(request: Request) {
  const session = await getGuestSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("id");
  if (!entryId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const result = await cancelWaitlistEntry(entryId, session.guestId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "NOT_FOUND" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
