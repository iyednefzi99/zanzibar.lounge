import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { env, hasSms } from "@/lib/env";
import { makeOutboundCall } from "@/lib/voice/twilio-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/voice/outbound
 *
 * Makes an outbound voice call. Admin-only endpoint used for automated
 * reminders, confirmations, or manual callbacks.
 *
 * Body: { phone: string, message: string, language?: string }
 */
export async function POST(request: Request) {
  if (!hasSms) {
    return NextResponse.json(
      { error: "Canal vocal non configuré" },
      { status: 503 },
    );
  }

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 },
    );
  }

  let body: { phone?: string; message?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 },
    );
  }

  const { phone, message, language } = body;

  if (!phone || typeof phone !== "string") {
    return NextResponse.json(
      { error: "Le champ 'phone' est requis" },
      { status: 400 },
    );
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Le champ 'message' est requis" },
      { status: 400 },
    );
  }

  const lang = language && ["fr", "ar", "en"].includes(language) ? language : "fr";

  try {
    const result = await makeOutboundCall(phone, message, lang);

    console.warn("[voice/outbound] appel lancé", {
      callSid: result.callSid,
      phone,
      status: result.status,
    });

    return NextResponse.json({
      ok: true,
      callSid: result.callSid,
      status: result.status,
    });
  } catch (error) {
    console.error("[voice/outbound] erreur", {
      phone,
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json(
      {
        error: "Échec de l'appel",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
