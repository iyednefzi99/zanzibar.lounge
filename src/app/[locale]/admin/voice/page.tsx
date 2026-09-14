import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { env, hasSms } from "@/lib/env";
import { site } from "@/content/site";
import { getCallAnalytics } from "@/lib/voice/call-analytics";

export const dynamic = "force-dynamic";

async function getRestaurantId() {
  return process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id ?? null
    : null;
}

const LANGUAGES = [
  { code: "fr", label: "Français", voice: "Polly.Mathieu" },
  { code: "ar", label: "العربية", voice: "Polly.Muhammed" },
  { code: "en", label: "English", voice: "Polly.Matthew" },
] as const;

const DEFAULT_GREETING: Record<string, string> = {
  fr: "Bienvenue au E-Coffee Node. Dites-moi comment je peux vous aider.",
  ar: "مرحبا بكم في E-Coffee Node. قل لي كيف يمكنني مساعدتك.",
  en: "Welcome to E-Coffee Node. Tell me how I can help you.",
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

  const restaurantId = await getRestaurantId();
  const analytics = restaurantId ? await getCallAnalytics(restaurantId) : null;

  const voiceOrders = restaurantId
    ? await db.voiceOrder.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const recentUpsells = restaurantId
    ? await db.upsellSuggestion.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  const upsellStats = { ordering: 0, seated: 0, post_meal: 0 };
  for (const u of recentUpsells) {
    if (u.context in upsellStats) {
      upsellStats[u.context as keyof typeof upsellStats]++;
    }
  }

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

      {/* Voice Commerce — Call Analytics */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Call Analytics</h2>
        <p className="mt-2 text-sm text-shell-dim">
          Statistiques des appels vocaux des 30 derniers jours.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-3xl text-brass">
              {analytics?.totalCalls ?? 0}
            </p>
            <p className="mt-1 text-xs text-shell-dim">Appels totaux</p>
          </div>
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-3xl text-lagoon">
              {analytics?.aiHandled ?? 0}
            </p>
            <p className="mt-1 text-xs text-shell-dim">Gérés par IA</p>
          </div>
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-3xl text-shell">
              {analytics?.avgDuration ?? 0}s
            </p>
            <p className="mt-1 text-xs text-shell-dim">Durée moyenne</p>
          </div>
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-3xl text-coral">
              {analytics?.staffHandled ?? 0}
            </p>
            <p className="mt-1 text-xs text-shell-dim">Transférés au staff</p>
          </div>
        </div>

        {/* Call breakdown */}
        {analytics && analytics.totalCalls > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
              <p className="font-display text-2xl text-brass">
                {analytics.inboundCalls}
              </p>
              <p className="mt-1 text-xs text-shell-dim">Entrants</p>
            </div>
            <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
              <p className="font-display text-2xl text-brass">
                {analytics.outboundCalls}
              </p>
              <p className="mt-1 text-xs text-shell-dim">Sortants</p>
            </div>
            <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
              <p className="font-display text-2xl text-shell">
                {analytics.avgSentiment > 0 ? "+" : ""}
                {analytics.avgSentiment}
              </p>
              <p className="mt-1 text-xs text-shell-dim">Sentiment moyen</p>
            </div>
          </div>
        )}

        {/* Recent calls table */}
        {analytics && analytics.calls.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-shell/12 bg-deep/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-shell/12 text-xs text-shell-dim">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Numéro</th>
                  <th className="px-4 py-3">Durée</th>
                  <th className="px-4 py-3">Géré par</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {analytics.calls.slice(0, 20).map((call) => (
                  <tr key={call.id} className="text-shell hover:bg-deep/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {new Date(call.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          call.direction === "inbound"
                            ? "bg-lagoon/15 text-lagoon"
                            : "bg-brass/15 text-brass"
                        }`}
                      >
                        {call.direction === "inbound" ? "Entrant" : "Sortant"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {call.direction === "inbound"
                        ? call.callerNumber
                        : call.calledNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{call.duration}s</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          call.handledBy === "ai"
                            ? "bg-lagoon/15 text-lagoon"
                            : "bg-shell/15 text-shell"
                        }`}
                      >
                        {call.handledBy === "ai" ? "IA" : "Staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          call.status === "completed"
                            ? "bg-lagoon/15 text-lagoon"
                            : call.status === "missed"
                              ? "bg-coral/15 text-coral"
                              : "bg-shell/15 text-shell"
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Voice Orders */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Voice Orders</h2>
        <p className="mt-2 text-sm text-shell-dim">
          Commandes passées par appel vocal.
        </p>

        {!restaurantId ? (
          <div className="mt-6 rounded-xl border border-shell/12 bg-deep/40 p-8 text-center">
            <p className="text-sm text-shell-dim">
              Configurer le restaurant pour voir les commandes vocales.
            </p>
          </div>
        ) : voiceOrders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-shell/12 bg-deep/40 p-8 text-center">
            <p className="text-sm text-shell-dim">
              Les commandes vocales apparaîtront ici une fois que des appels
              avec commandes seront traités.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-shell/12 bg-deep/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-shell/12 text-xs text-shell-dim">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Articles</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Langue</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {voiceOrders.map((order) => {
                  const items = order.items as Array<{
                    name: string;
                    quantity: number;
                  }>;
                  return (
                    <tr key={order.id} className="text-shell hover:bg-deep/60">
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {order.tableNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {(order.totalCents / 100).toFixed(2)} TND
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-shell-dim uppercase">
                          {order.language}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                            order.status === "completed"
                              ? "bg-lagoon/15 text-lagoon"
                              : order.status === "pending"
                                ? "bg-brass/15 text-brass"
                                : "bg-shell/15 text-shell"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upsell Stats */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-shell">Upsell Suggestions</h2>
        <p className="mt-2 text-sm text-shell-dim">
          Suggestions d&apos;upsell contextuelles générées pendant les appels.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-2xl text-brass">
              {upsellStats.ordering}
            </p>
            <p className="mt-1 text-xs text-shell-dim">En commande</p>
          </div>
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-2xl text-brass">
              {upsellStats.seated}
            </p>
            <p className="mt-1 text-xs text-shell-dim">À table</p>
          </div>
          <div className="rounded-xl border border-shell/12 bg-deep/40 p-4 text-center">
            <p className="font-display text-2xl text-brass">
              {upsellStats.post_meal}
            </p>
            <p className="mt-1 text-xs text-shell-dim">Après le repas</p>
          </div>
        </div>

        {recentUpsells.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-shell/12 bg-deep/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-shell/12 text-xs text-shell-dim">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Contexte</th>
                  <th className="px-4 py-3">Suggestion</th>
                  <th className="px-4 py-3">Raison</th>
                  <th className="px-4 py-3">Accepté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell/8">
                {recentUpsells.map((u) => (
                  <tr key={u.id} className="text-shell hover:bg-deep/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">
                      {u.context}
                    </td>
                    <td className="px-4 py-3 text-xs">{u.suggestion}</td>
                    <td className="px-4 py-3 font-mono text-xs text-shell-dim">
                      {u.reason}
                    </td>
                    <td className="px-4 py-3">
                      {u.accepted === null ? (
                        <span className="text-xs text-shell-dim">—</span>
                      ) : u.accepted ? (
                        <span className="text-xs text-lagoon">Oui</span>
                      ) : (
                        <span className="text-xs text-coral">Non</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
