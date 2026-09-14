import { NextResponse } from "next/server";

import { env, hasSms } from "@/lib/env";
import { verifyTwilioSignature } from "@/lib/channels/sms";
import { handleVoiceConversation } from "@/lib/voice/voice-agent";
import { goodbye, sayAndGather } from "@/lib/voice/twilio-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/voice/gather
 *
 * Processes gathered speech from Twilio's <Gather> verb. Routes the
 * transcription to the voice agent, which processes it through the existing
 * tool pipeline and returns TwiML for the response.
 */
export async function POST(request: Request) {
  if (!hasSms) {
    return new NextResponse("Canal vocal non configuré", { status: 503 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const publicUrl = new URL(
    "/api/voice/gather",
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

  const callSid = params.CallSid;
  const from = params.From;
  const speechResult = params.SpeechResult;
  const confidence = params.Confidence;

  if (!callSid || !from) {
    return new NextResponse("Paramètres manquants", { status: 400 });
  }

  // If no speech was detected (timeout), prompt again
  if (!speechResult) {
    const twiml = sayAndGather(
      "Je n'ai pas entendu. Pouvez-vous répéter ?",
      "fr",
      "/api/voice/gather",
    );

    return new NextResponse(twiml, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }

  try {
    console.warn("[voice/gather] parole reçue", {
      callSid,
      from,
      speech: speechResult,
      confidence,
    });

    // Process through voice agent
    const twiml = await handleVoiceConversation(callSid, from, speechResult);

    return new NextResponse(twiml, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  } catch (error) {
    console.error("[voice/gather] erreur", {
      callSid,
      error: error instanceof Error ? error.message : error,
    });

    const twiml = sayAndGather(
      "Désolé, une erreur s'est produite. Pouvez-vous répéter ?",
      "fr",
      "/api/voice/gather",
    );

    return new NextResponse(twiml, {
      status: 200,
      headers: { "content-type": "text/xml" },
    });
  }
}
