import { Channel } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { handleInbound } from "@/lib/agent";
import { claimEvent } from "@/lib/channels";
import { parseTwilioWebhook, verifyTwilioSignature } from "@/lib/channels/sms";
import { env, hasSms } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Réponse TwiML vide : Twilio attend du XML, et nous répondons hors bande. */
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

export async function POST(request: Request) {
  if (!hasSms) {
    return new NextResponse("Canal non configuré", { status: 503 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // Twilio signe l'URL telle qu'elle est enregistrée dans la console. Derrière
  // un proxy, `request.url` peut porter un hôte interne : on reconstruit
  // l'URL publique à partir de la configuration.
  const publicUrl = new URL(
    "/api/webhooks/twilio",
    env.NEXT_PUBLIC_SITE_URL,
  ).toString();

  const signed = verifyTwilioSignature(
    request.headers.get("x-twilio-signature"),
    publicUrl,
    params,
  );

  if (!signed) {
    return new NextResponse("Signature invalide", { status: 403 });
  }

  const message = parseTwilioWebhook(params);
  if (!message) {
    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }

  const fresh = await claimEvent(message.providerId, Channel.SMS);
  if (fresh) {
    try {
      await handleInbound(message);
    } catch (error) {
      console.error("[sms] traitement du message impossible", {
        providerId: message.providerId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}
