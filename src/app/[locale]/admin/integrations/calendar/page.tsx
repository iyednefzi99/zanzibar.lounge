import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";
import {
  getIntegrationSettings,
  updateIntegrationSettings,
} from "@/lib/white-label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Google Calendar — Intégrations",
};

export default async function CalendarIntegrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();
  const settings = await getIntegrationSettings(restaurantId);
  const apiKeySet = !!process.env.GOOGLE_CALENDAR_API_KEY;

  async function toggleCalendar(formData: FormData) {
    "use server";
    const enabled = formData.get("enabled") !== "true";
    await updateIntegrationSettings(restaurantId, { googleCalendar: enabled });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link
        href={`/${locale}/admin/integrations`}
        className="mb-2 inline-block text-sm text-brass hover:underline"
      >
        ← Retour aux intégrations
      </Link>

      <h1 className="font-display text-3xl text-shell">Google Calendar</h1>
      <p className="text-sm text-shell-dim">
        Synchronisez vos réservations avec Google Calendar pour garder votre
        équipe informée en temps réel.
      </p>

      {/* Status */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-shell">Connexion</h2>
            <p className="mt-1 text-sm text-shell-dim">
              {apiKeySet
                ? "Clé API Google Calendar détectée."
                : "Clé API non configurée."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              settings.googleCalendar
                ? "bg-lagoon/15 text-lagoon"
                : "bg-shell/10 text-shell-dim"
            }`}
          >
            {settings.googleCalendar ? "Activé" : "Désactivé"}
          </span>
        </div>

        {!apiKeySet && (
          <p className="mt-3 text-xs text-coral">
            Ajoutez GOOGLE_CALENDAR_API_KEY dans votre fichier .env.local pour
            activer cette intégration.
          </p>
        )}

        <form action={toggleCalendar} className="mt-4">
          <input
            type="hidden"
            name="enabled"
            value={settings.googleCalendar ? "true" : "false"}
          />
          <button
            type="submit"
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              settings.googleCalendar
                ? "bg-coral/20 text-coral hover:bg-coral/30"
                : "bg-brass text-night hover:bg-brass/80"
            }`}
          >
            {settings.googleCalendar ? "Désactiver" : "Activer"}
          </button>
        </form>
      </div>

      {/* Sync settings */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <h2 className="font-display text-lg text-shell">
          Paramètres de synchronisation
        </h2>
        <div className="mt-4 space-y-3 text-sm text-shell-dim">
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Synchronisation automatique</span>
            <span className="text-xs text-lagoon">Activée</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Fréquence</span>
            <span className="font-mono text-xs text-brass">Toutes les 5 min</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Direction</span>
            <span className="text-xs text-shell-dim">
              Réservations → Calendar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
