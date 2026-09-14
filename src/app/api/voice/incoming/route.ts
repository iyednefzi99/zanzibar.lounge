import { NextResponse } from "next/server";

import { env, hasSms } from "@/lib/env";
import { verifyTwilioSignature } from "@/lib/channels/sms";
import { handleVoiceCall } from "@/lib/voice/twilio-voice";
import { initVoiceCall } from "@/lib/voice/voice-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/voice/incoming
 *
 * Handles incoming Twilio voice calls. Greets the caller in their detected
 * language and starts speech recognition via Twilio's <Gather> verb.
 */
export async function POST(request: Request) {
  if (!hasSms) {
    return new NextResponse("Canal vocal non configuré", { status: 503 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const publicUrl = new URL(
    "/api/voice/incoming",
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

  const from = params.From;
  const to = params.To;
  const callSid = params.CallSid;

  if (!from || !callSid) {
    return new NextResponse("Paramètres manquants", { status: 400 });
  }

  try {
    // Initialize the voice conversation state
    const greeting = await initVoiceCall(callSid, from);

    // Generate TwiML response with greeting and speech recognition
    const twiml = await handleVoiceCall(from, to ?? "", callSid);

    return new NextResponse(twiml, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  } catch (error) {
    console.error("[voice/incoming] erreur", {
      callSid,
      error: error instanceof Error ? error.message : error,
    });

    // Return a minimal TwiML response so Twilio doesn't retry
    const errorTwiml =
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Mathieu" language="fr">Désolé, une erreur s\u2019est produite. Veuillez rappeler plus tard.</Say><Hangup/></Response>';

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }
}
