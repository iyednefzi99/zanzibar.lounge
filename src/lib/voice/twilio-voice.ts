import { Channel } from "@/generated/prisma/client";
import twilio from "twilio";

import { env, hasSms } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { ChannelNotConfiguredError } from "@/lib/channels/types";

/**
 * Twilio Voice integration.
 *
 * Generates TwiML responses for incoming/outgoing calls, handles call routing,
 * and manages transfers to human staff. Uses Twilio's built-in TTS voices:
 * - French: Polly.Mathieu
 * - Arabic: Polly.Muhammed
 * - English: Polly.Matthew
 */

const VoiceResponse = twilio.twiml.VoiceResponse;

const TTS_VOICE: Record<string, string> = {
  fr: "Polly.Mathieu",
  ar: "Polly.Muhammed",
  en: "Polly.Matthew",
};

const GREETING: Record<string, string> = {
  fr: "Bienvenue au E-Coffee Node. Dites-moi comment je peux vous aider, par exemple réserver une table ou consulter nos horaires.",
  ar: "مرحبا بكم في E-Coffee Node. قل لي كيف يمكنني مساعدتك، مثل حجز طاولة أو الاطلاع على مواعيد العمل.",
  en: "Welcome to E-Coffee Node. Tell me how I can help, for example booking a table or checking our hours.",
};

let client: ReturnType<typeof twilio> | null = null;

function twilioClient() {
  if (!hasSms) throw new ChannelNotConfiguredError(Channel.SMS);
  client ??= twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  return client;
}

/**
 * Map our internal language codes to Twilio GatherLanguage codes.
 */
function toGatherLanguage(lang: string): string {
  const map: Record<string, string> = {
    fr: "fr-FR",
    ar: "ar-TN",
    en: "en-US",
  };
  return map[lang] ?? "fr-FR";
}

/**
 * Generate TwiML response XML.
 *
 * Builds a TwiML <Response> that speaks text, gathers speech input, or
 * redirects to another endpoint.
 */
export function generateTwiML(
  response: {
    say?: string;
    language?: string;
    action?: string;
    gather?: boolean;
    gatherInput?: string;
    gatherTimeout?: number;
    speechTimeout?: string | number;
    redirect?: string;
    hangup?: boolean;
  } = {},
): string {
  const twiml = new VoiceResponse();
  const lang = response.language ?? "fr";
  const voice = TTS_VOICE[lang] ?? TTS_VOICE.fr;

  if (response.say) {
    // Polly voices are valid at runtime but not in the TypeScript type union
    const say = twiml.say({ voice: voice as never, language: toGatherLanguage(lang) as never }, response.say);
  }

  if (response.gather) {
    const inputType = (response.gatherInput ?? "speech") as "speech" | "dtmf";
    const gatherLang = toGatherLanguage(lang);

    const gather = twiml.gather({
      input: [inputType],
      action: response.action,
      method: "POST",
      timeout: response.gatherTimeout ?? 5,
      speechTimeout: String(response.speechTimeout ?? "auto"),
      language: gatherLang as never,
    });

    if (response.say) {
      // Re-add the say inside gather so Twilio processes speech after it
      gather.say({ voice: voice as never, language: gatherLang as never }, response.say);
    }
  } else if (response.action && !response.redirect) {
    // Redirect to action after speaking if not gathering
    twiml.redirect({ method: "POST" }, response.action);
  }

  if (response.redirect) {
    twiml.redirect({ method: "POST" }, response.redirect);
  }

  if (response.hangup) {
    twiml.hangup();
  }

  return twiml.toString();
}

/**
 * Process an incoming voice call.
 *
 * Returns TwiML that greets the caller in their detected language and starts
 * speech recognition.
 */
export async function handleVoiceCall(
  from: string,
  to: string,
  callSid: string,
): Promise<string> {
  const callerPhone = normalizePhone(from);
  if (!callerPhone) {
    return generateTwiML({
      say: "Numéro invalide. Au revoir.",
      hangup: true,
    });
  }

  const language = detectLanguage(callerPhone);
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const gatherAction = new URL("/api/voice/gather", baseUrl).toString();

  console.warn("[voice] appel entrant", {
    callSid,
    from: callerPhone,
    to,
  });

  return generateTwiML({
    say: GREETING[language],
    language,
    gather: true,
    gatherInput: "speech",
    action: gatherAction,
    gatherTimeout: 5,
    speechTimeout: "auto",
  });
}

/**
 * Make an outbound call with TTS message.
 *
 * Initiates a call to the given phone number, speaks the provided message,
 * then hangs up.
 */
export async function makeOutboundCall(
  to: string,
  message: string,
  language: string = "fr",
  callbackUrl?: string,
): Promise<{ callSid: string; status: string }> {
  const recipient = normalizePhone(to);
  if (!recipient) throw new Error("Numéro invalide");

  const from = env.TWILIO_FROM;
  if (!from) throw new Error("TWILIO_FROM non configuré");

  const call = await twilioClient().calls.create({
    to: recipient,
    from,
    twiml: generateTwiML({ say: message, language }),
    ...(callbackUrl
      ? { statusCallback: callbackUrl, statusCallbackEvent: ["completed", "busy", "no-answer", "failed"] }
      : {}),
  });

  return { callSid: call.sid, status: call.status };
}

/**
 * Transfer a live call to a human staff member.
 *
 * Uses the <Dial> verb to connect the caller to the staff phone number.
 */
export async function transferToStaff(
  callSid: string,
  staffPhone: string,
): Promise<string> {
  const recipient = normalizePhone(staffPhone);
  if (!recipient) {
    return generateTwiML({
      say: "Transfert impossible. Veuillez rappeler le numéro du restaurant.",
      hangup: true,
    });
  }

  const twiml = new VoiceResponse();
  twiml.dial({ timeout: 30 }, recipient);

  return twiml.toString();
}

/**
 * Generate a TwiML response for speech recognition results.
 *
 * Used by the gather webhook to create a follow-up response after processing
 * the caller's speech.
 */
export function speechResponse(
  message: string,
  language: string = "fr",
  action?: string,
): string {
  return generateTwiML({
    say: message,
    language,
    gather: true,
    action,
    gatherTimeout: 5,
    speechTimeout: "auto",
  });
}

/**
 * Generate a TwiML response that just speaks and waits for more input.
 */
export function sayAndGather(
  message: string,
  language: string = "fr",
  action?: string,
): string {
  return generateTwiML({
    say: message,
    language,
    gather: true,
    gatherInput: "speech",
    action,
    gatherTimeout: 8,
    speechTimeout: "auto",
  });
}

/**
 * End a call gracefully with a goodbye message.
 */
export function goodbye(language: string = "fr"): string {
  const messages: Record<string, string> = {
    fr: "Merci de votre appel. Au revoir !",
    ar: "شكرا لاتصالك. مع السلامة!",
    en: "Thank you for calling. Goodbye!",
  };

  return generateTwiML({
    say: messages[language] ?? messages.fr,
    language,
    hangup: true,
  });
}

/**
 * Generate TwiML to play hold music or a message while waiting.
 */
export function holdMessage(language: string = "fr"): string {
  const messages: Record<string, string> = {
    fr: "Veuillez patienter, je vous transfère à un membre de l'équipe.",
    ar: "يرجى الانتظار، أنا أنقلك إلى أحد أفراد الفريق.",
    en: "Please hold, I'm transferring you to a team member.",
  };

  return generateTwiML({
    say: messages[language] ?? messages.fr,
    language,
  });
}

/**
 * Detect the caller's preferred language from their phone number prefix.
 *
 * Tunisia (+216) defaults to French. Other MENA numbers default to Arabic.
 * Everything else defaults to English.
 */
function detectLanguage(phone: string): string {
  if (phone.startsWith("+216")) return "fr";
  if (
    phone.startsWith("+212") ||
    phone.startsWith("+213") ||
    phone.startsWith("+218") ||
    phone.startsWith("+966") ||
    phone.startsWith("+971") ||
    phone.startsWith("+973") ||
    phone.startsWith("+974") ||
    phone.startsWith("+968") ||
    phone.startsWith("+965") ||
    phone.startsWith("+20")
  ) {
    return "ar";
  }
  return "en";
}

export { TTS_VOICE, detectLanguage };
