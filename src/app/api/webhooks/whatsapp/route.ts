import { Channel } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { handleInbound } from "@/lib/agent";
import { claimEvent } from "@/lib/channels";
import {
  parseWhatsAppWebhook,
  verifyMetaSignature,
  verifyWebhookChallenge,
} from "@/lib/channels/whatsapp";
import { hasWhatsApp } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vérification de l'abonnement : Meta appelle cette URL une fois, à
 * l'enregistrement du webhook, et attend son `hub.challenge` en écho.
 */
export async function GET(request: Request) {
  const challenge = verifyWebhookChallenge(new URL(request.url).searchParams);
  if (!challenge) {
    return new NextResponse("Vérification refusée", { status: 403 });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

/**
 * Messages entrants.
 *
 * On répond 200 même en cas d'échec interne : Meta désactive un webhook qui
 * renvoie des erreurs à répétition, et perdre l'abonnement coûte plus cher
 * qu'un message manqué. Les échecs partent dans les journaux.
 */
export async function POST(request: Request) {
  if (!hasWhatsApp) {
    return new NextResponse("Canal non configuré", { status: 503 });
  }

  // Le corps brut, tel quel : c'est sur ces octets que porte la signature.
  const rawBody = await request.text();

  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Signature invalide", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Corps illisible", { status: 400 });
  }

  const messages = parseWhatsAppWebhook(payload);

  for (const message of messages) {
    // Meta rejoue les livraisons non acquittées : sans cette réservation
    // d'événement, l'agent répondrait deux fois à la même phrase.
    const fresh = await claimEvent(message.providerId, Channel.WHATSAPP);
    if (!fresh) continue;

    try {
      await handleInbound(message);
    } catch (error) {
      console.error("[whatsapp] traitement du message impossible", {
        providerId: message.providerId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return NextResponse.json({ received: messages.length });
}
