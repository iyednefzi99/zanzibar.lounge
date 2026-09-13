import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { reservationsToCsv } from "@/lib/export";

/**
 * Export CSV des réservations.
 *
 * Protégé par Basic Auth (requireAdmin vérifie l'en-tête Authorization).
 * Le proxy filtre déjà les requêtes vers /{langue}/admin, mais cette route
 * vit sous /api — elle doit donc se protéger seule.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json(
      { error: "Paramètres 'from' et 'to' requis (format AAAA-MM-JJ)" },
      { status: 400 },
    );
  }

  const csv = await reservationsToCsv(from, to);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${from}_${to}.csv"`,
    },
  });
}
