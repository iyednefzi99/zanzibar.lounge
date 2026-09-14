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
  title: "Google Business Profile — Intégrations",
};

export default async function GoogleBusinessIntegrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();
  const settings = await getIntegrationSettings(restaurantId);
  const apiKeySet = !!process.env.GOOGLE_BUSINESS_API_KEY;

  async function toggleGoogleBusiness(formData: FormData) {
    "use server";
    const enabled = formData.get("enabled") !== "true";
    await updateIntegrationSettings(restaurantId, {
      googleBusiness: enabled,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link
        href={`/${locale}/admin/integrations`}
        className="mb-2 inline-block text-sm text-brass hover:underline"
      >
        ← Retour aux intégrations
      </Link>

      <h1 className="font-display text-3xl text-shell">
        Google Business Profile
      </h1>
      <p className="text-sm text-shell-dim">
        Gérez votre présence Google, synchronisez les avis et maintenez vos
        informations à jour.
      </p>

      {/* Status */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-shell">Connexion</h2>
            <p className="mt-1 text-sm text-shell-dim">
              {apiKeySet
                ? "Clé API Google Business détectée."
                : "Clé API non configurée."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              settings.googleBusiness
                ? "bg-lagoon/15 text-lagoon"
                : "bg-shell/10 text-shell-dim"
            }`}
          >
            {settings.googleBusiness ? "Activé" : "Désactivé"}
          </span>
        </div>

        {!apiKeySet && (
          <p className="mt-3 text-xs text-coral">
            Ajoutez GOOGLE_BUSINESS_API_KEY dans votre fichier .env.local pour
            activer cette intégration.
          </p>
        )}

        <form action={toggleGoogleBusiness} className="mt-4">
          <input
            type="hidden"
            name="enabled"
            value={settings.googleBusiness ? "true" : "false"}
          />
          <button
            type="submit"
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              settings.googleBusiness
                ? "bg-coral/20 text-coral hover:bg-coral/30"
                : "bg-brass text-night hover:bg-brass/80"
            }`}
          >
            {settings.googleBusiness ? "Désactiver" : "Activer"}
          </button>
        </form>
      </div>

      {/* Review sync */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <h2 className="font-display text-lg text-shell">
          Synchronisation des avis
        </h2>
        <div className="mt-4 space-y-3 text-sm text-shell-dim">
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Synchronisation automatique des avis</span>
            <span className="text-xs text-lagoon">Activée</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Affichage sur la page publique</span>
            <span className="text-xs text-lagoon">Activé</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Notifications de nouveaux avis</span>
            <span className="text-xs text-brass">Activées</span>
          </div>
        </div>
      </div>
    </div>
  );
}
