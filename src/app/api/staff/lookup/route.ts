import { NextResponse } from "next/server";

import { findByReference } from "@/lib/reservations";
import { requireStaffSession } from "@/lib/staff-session";

export async function GET(request: Request) {
  try {
    await requireStaffSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference || !/^ZL-[A-Z0-9]{4}$/i.test(reference.trim())) {
    return NextResponse.json(
      { ok: false, error: "Référence invalide." },
      { status: 400 },
    );
  }

  const reservation = await findByReference(reference.trim().toUpperCase());

  if (!reservation) {
    return NextResponse.json(
      { ok: false, error: "Réservation introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      reference: reservation.reference,
      name: reservation.name,
      partySize: reservation.partySize,
      time: reservation.time,
      zone: reservation.zone,
      table: reservation.table,
      seated: reservation.status === "SEATED",
    },
  });
}
