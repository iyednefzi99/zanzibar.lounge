import { NextResponse } from "next/server";

import { isAuthorizedCron, sendDueReminders } from "@/lib/reminders";
import { purgeExpiredData } from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Un lot de rappels peut être long : on laisse de la marge. */
export const maxDuration = 60;

/**
 * Rappels de réservation. À appeler toutes les 30 minutes.
 *
 * Vercel Cron transmet `Authorization: Bearer $CRON_SECRET`. Ailleurs, ajouter
 * le même en-tête dans la tâche planifiée. Sans CRON_SECRET, l'endpoint est
 * fermé — un rappel est un envoi payant, il ne doit pas se déclencher sur
 * simple visite de l'URL.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  try {
    const report = await sendDueReminders();
    // La purge suit les rappels : même cadence, une seule tâche planifiée à
    // surveiller, et les suppressions sont bornées par leur clause `where`.
    const purged = await purgeExpiredData();
    return NextResponse.json({ ok: true, ...report, purged });
  } catch (error) {
    console.error("[cron] rappels en échec", error);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
