/**
 * Speech-to-text processing for voice calls.
 *
 * Uses Twilio's built-in speech recognition via the <Gather> verb, with
 * optional Whisper API fallback for pre-recorded audio. Also handles intent
 * detection and language identification.
 */

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";

/**
 * Transcribe audio using Whisper API or Twilio's built-in speech recognition.
 *
 * For live calls, Twilio handles speech recognition via the <Gather> verb —
 * the transcription result comes as a parameter in the webhook. This function
 * is used for pre-recorded audio (voicemails, callbacks).
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = "fr",
): Promise<{ text: string; confidence: number; language: string }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    // Fallback: return empty transcription if Whisper is not configured
    return { text: "", confidence: 0, language };
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" }),
    "audio.wav",
  );
  formData.append("model", "whisper-1");
  formData.append("language", language);
  formData.append("response_format", "verbose_json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    text: string;
    language: string;
    segments?: Array<{ confidence: number }>;
  };

  const avgConfidence = data.segments?.length
    ? data.segments.reduce((sum, s) => sum + s.confidence, 0) / data.segments.length
    : 0.8;

  return {
    text: data.text.trim(),
    confidence: avgConfidence,
    language: data.language ?? language,
  };
}

/**
 * Detect the language of a transcription.
 *
 * Uses character analysis for quick detection, falling back to Anthropic
 * for ambiguous cases.
 */
export function detectTranscriptionLanguage(text: string): string {
  if (!text) return "fr";

  // Arabic script detection
  if (/[؀-ۿ]/.test(text)) return "ar";

  // Common English words
  if (/\b(the|hello|hi|book|table|tonight|tomorrow|yes|no|please|thank)\b/i.test(text)) {
    return "en";
  }

  // Common French words
  if (/\b(bonjour|bonsoir|salut|merci|oui|non|réservation|table|ce soir|demain|s'il vous plaît)\b/i.test(text)) {
    return "fr";
  }

  // Common Arabic words (transliterated)
  if (/\b(ahlan|marhaba|shukran|na'am|la|haqiza|tabla|alyawm|ghadan)\b/i.test(text)) {
    return "ar";
  }

  return "fr";
}

export type VoiceIntent =
  | "book"
  | "cancel"
  | "reschedule"
  | "info"
  | "menu"
  | "hours"
  | "reviews"
  | "greeting"
  | "goodbye"
  | "help"
  | "unknown";

/**
 * Detect user intent from transcribed speech.
 *
 * Uses keyword matching and pattern recognition to determine what the caller
 * wants to do, without requiring an LLM call for basic routing.
 */
export function detectIntent(transcription: string): VoiceIntent {
  const text = transcription.toLowerCase().trim();

  if (!text) return "unknown";

  // Greetings
  if (/^(bonjour|bonsoir|salut|hello|hi|marhaba|ahlan|hey)\b/i.test(text)) {
    return "greeting";
  }

  // Goodbyes
  if (/(au revoir|à bientôt|bye|goodbye|ma'a salama|ila al-liqaa)/i.test(text)) {
    return "goodbye";
  }

  // Help
  if (/(aide|help|comment|comment faire|kifech|shnu)/i.test(text)) {
    return "help";
  }

  // Booking intent
  if (/(réserver|réservation|réserver une table|book|booking|table pour|haqiz|7atiz|囷za)/i.test(text)) {
    return "book";
  }

  // Cancel intent
  if (/(annuler|cancel|cancelled|supprimer|hatafil|إلغاء)/i.test(text)) {
    return "cancel";
  }

  // Reschedule intent
  if (/(reporter|déplacer|changer|reschedule|modify|modifier|changer la date|نoffrir)/i.test(text)) {
    return "reschedule";
  }

  // Menu info
  if (/(menu|carte|plat|prix|chicha|boisson|nourriture|koulcha|makan)/i.test(text)) {
    return "menu";
  }

  // Hours
  if (/(heure|horaires|ouvert|fermé|quand|heure d'ouverture|saa3at|wa9t|maftou7)/i.test(text)) {
    return "hours";
  }

  // Reviews
  if (/(avis|review|évaluation|bien|c'est bon|quality|jaw)/i.test(text)) {
    return "reviews";
  }

  // General info
  if (/(adresse|où|comment venir|téléphone|contact|adresse|endroit|blasa)/i.test(text)) {
    return "info";
  }

  // If transcription is very short or unclear
  if (text.split(/\s+/).length <= 2) {
    return "help";
  }

  return "unknown";
}

/**
 * Build a system prompt for voice-specific intent classification.
 *
 * Used when keyword matching is insufficient and we need the LLM to
 * understand the caller's intent from context.
 */
export function buildVoicePrompt(
  transcription: string,
  language: string,
  conversationHistory: string[],
): string {
  const langName = { fr: "français", ar: "arabe", en: "anglais" }[
    language as "fr" | "ar" | "en"
  ] ?? "français";

  const historyText = conversationHistory.length
    ? `\nHistorique récent :\n${conversationHistory.join("\n")}`
    : "";

  return `Tu es l'assistant vocal du E-Coffee Node, un café-restaurant-lounge à Medjez el Bab, Tunisie.

L'appelant vient de dire (en ${langName}) :
"${transcription}"
${historyText}

Tu dois répondre de manière naturelle, comme un employé qui répond au téléphone. Sois bref (1-2 phrases max). Tu parles dans la langue de l'appelant.

Si l'appelant veut :
- Réserver : demande la date, l'heure et le nombre de personnes (une question à la fois)
- Annuler : demande la référence ZL-XXXX
- Reporter : demande la référence et la nouvelle date
- Connaître le menu : résume les grandes catégories
- Les horaires : donne les horaires d'ouverture
- Un avis : dis que le restaurant est très bien noté
- Autre chose : propose de transférer à l'équipe

Ne donne jamais de faux horaires ou de faux prix. Si tu ne sais pas, propose de transférer.`;
}

/**
 * Format a speech recognition result for processing.
 *
 * Cleans up common speech-to-text artifacts and normalizes the text.
 */
export function normalizeSpeech(text: string): string {
  return text
    .replace(/[.!?]+$/, "") // Remove trailing punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
