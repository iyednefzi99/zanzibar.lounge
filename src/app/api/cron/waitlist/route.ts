import { NextResponse } from "next/server";

import { cleanupExpiredWaitlist } from "@/lib/waitlist";
import { isAuthorizedCron } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron : nettoyage des notifications expirées.
 *
 * GET /api/cron/waitlist — appelé toutes les 5 minutes par un cron externe
 * ou manuellement. Authentification via CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const expired = await cleanupExpiredWaitlist();

  return NextResponse.json({ ok: true, expired });
}
