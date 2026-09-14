import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { env, hasSms } from "@/lib/env";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

const LANGUAGES = [
  { code: "fr", label: "Français", voice: "Polly.Mathieu" },
  { code: "ar", label: "العربية", voice: "Polly.Muhammed" },
  { code: "en", label: "English", voice: "Polly.Matthew" },
] as const;

const DEFAULT_GREETING: Record<string, string> = {
  fr: "Bienvenue au Zanzibar Lounge. Dites-moi comment je peux vous aider.",
  ar: "مرحبا بكم في زنجبار لاونج. قل لي كيف يمكنني مساعدتك.",
  en: "Welcome to Zanzibar Lounge. Tell me how I can help you.",
};

/**
 * Voice settings and call log page.
 *
 * Allows admins to configure the voice channel, view recent calls, and
 * test the voice agent.
 */
export default async function AdminVoicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const configured = hasSms;
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Voix</h1>
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            ← Retour au service
          </Link>
        </div>
      </header>

      {/* Status */}
      <div className="mt-8 border-t border-brass/35 pt-6">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block size-2.5 rounded-full ${configured ? "bg-lagoon" : "bg-coral"}`}
          />
          <span className="text-sm text-shell">
            {configured ? "Canal vocal configuré" : "Canal vocal non configuré"}
          </span>
        </div>

        {!configured && (
          <p className="mt-3 border-s-[3px] border-s-coral/60 ps-4 text-xs leading-relaxed text-coral">
            Configurez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_FROM
            dans .env.local pour activer les appels vocaux.
          </p>
        )}
      </div>

      {/* Configuration */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Configuration</h2>

        <div className="mt-6 space-y-6">
          {/* Webhook URLs */}
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-5">
            <h3 className="text-sm font-medium text-shell">
              URLs des webhooks
            </h3>
            <p className="mt-1 text-xs text-shell-dim">
              Configurez ces URLs dans la console Twilio Voice.
            </p>

            <dl className="mt-4 space-y-3">
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim/80">
                  Appel entrant
                </dt>
                <dd className="mt-1 font-mono text-xs text-shell break-all">
                  {baseUrl}/api/voice/incoming
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim/80">
                  Réception parole
                </dt>
                <dd className="mt-1 font-mono text-xs text-shell break-all">
                  {baseUrl}/api/voice/gather
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim/80">
                  Statut d&apos;appel
                </dt>
                <dd className="mt-1 font-mono text-xs text-shell break-all">
                  {baseUrl}/api/voice/outbound
                </dd>
              </div>
            </dl>
          </div>

          {/* Voices */}
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-5">
            <h3 className="text-sm font-medium text-shell">
              Voix TTS (Text-to-Speech)
            </h3>
            <p className="mt-1 text-xs text-shell-dim">
              Voix Amazon Polly utilisées pour chaque langue.
            </p>

            <ul className="mt-4 space-y-2">
              {LANGUAGES.map((lang) => (
                <li
                  key={lang.code}
                  className="flex items-center justify-between rounded-lg border border-shell/8 px-4 py-3"
                >
                  <span className="text-sm text-shell">{lang.label}</span>
                  <span className="font-mono text-xs text-shell-dim">
                    {lang.voice}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Default greeting */}
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-5">
            <h3 className="text-sm font-medium text-shell">
              Message d&apos;accueil
            </h3>
            <p className="mt-1 text-xs text-shell-dim">
              Message joué lorsqu&apos;un appelant décroche.
            </p>

            <ul className="mt-4 space-y-3">
              {Object.entries(DEFAULT_GREETING).map(([lang, text]) => (
                <li key={lang}>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim/80">
                    {LANGUAGES.find((l) => l.code === lang)?.label ?? lang}
                  </span>
                  <p className="mt-1 text-sm text-shell">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Agent features */}
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-5">
            <h3 className="text-sm font-medium text-shell">
              Fonctionnalités de l&apos;agent vocal
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-shell">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass" />
                Détection automatique de la langue (fr/ar/en)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass" />
                Réservation, annulation et report par la voix
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass" />
                Consultation du menu et des horaires
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass" />
                Transfert automatique vers l&apos;équipe
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brass" />
                Appels sortants (rappels, confirmations)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Outbound call form */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Appel sortant</h2>
        <p className="mt-2 text-sm text-shell-dim">
          Envoyer un appel automatisé (rappel, confirmation).
        </p>

        <form
          action="/api/voice/outbound"
          method="POST"
          className="mt-6 space-y-4"
        >
          <div>
            <label
              htmlFor="phone"
              className="block text-sm text-shell"
            >
              Numéro
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="+216 20 123 456"
              className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/40 px-4 py-3 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm text-shell"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={3}
              placeholder="Bonjour, ceci est un rappel pour votre réservation de ce soir à 20h."
              className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/40 px-4 py-3 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="language"
              className="block text-sm text-shell"
            >
              Langue
            </label>
            <select
              id="language"
              name="language"
              className="mt-1 w-full rounded-lg border border-shell/20 bg-deep/40 px-4 py-3 text-sm text-shell focus:border-brass focus:outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!configured}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-30"
          >
            Lancer l&apos;appel
          </button>
        </form>
      </section>

      {/* Call logs placeholder */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Journal des appels</h2>
        <p className="mt-2 text-sm text-shell-dim">
          Les appels vocaux sont tracés dans les logs du serveur. Consultez
          les logs de l&apos;application pour voir l&apos;historique des appels.
        </p>

        <div className="mt-6 rounded-xl border border-shell/12 bg-deep/40 p-8 text-center">
          <p className="text-sm text-shell-dim">
            Les journaux d&apos;appels apparaîtront ici une fois que le canal
            vocal sera configuré et que des appels seront traités.
          </p>
        </div>
      </section>
    </div>
  );
}
