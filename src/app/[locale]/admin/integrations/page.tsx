import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import {
  getIntegrationSettings,
  updateIntegrationSettings,
} from "@/lib/white-label";

export const metadata: Metadata = {
  title: "Intégrations",
};

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const restaurantId = process.env.OWNER_RESTAURANT_SLUG
    ? (
        await db.restaurant.findUnique({
          where: { slug: process.env.OWNER_RESTAURANT_SLUG },
          select: { id: true },
        })
      )?.id
    : null;

  if (!restaurantId) notFound();

  const settings = await getIntegrationSettings(restaurantId);

  async function toggleIntegration(formData: FormData) {
    "use server";
    const key = formData.get("key") as string;
    const value = formData.get("value") === "true";

    if (
      key === "googleCalendar" ||
      key === "googleBusiness" ||
      key === "tripadvisor"
    ) {
      await updateIntegrationSettings(restaurantId!, { [key]: value });
    }
  }

  const integrations = [
    {
      key: "googleCalendar" as const,
      name: "Google Calendar",
      description: "Synchroniser les réservations avec Google Calendar",
      enabled: settings.googleCalendar,
      envKey: "GOOGLE_CALENDAR_API_KEY",
    },
    {
      key: "googleBusiness" as const,
      name: "Google Business Profile",
      description: "Gérer les avis et les informations sur Google",
      enabled: settings.googleBusiness,
      envKey: "GOOGLE_BUSINESS_API_KEY",
    },
    {
      key: "tripadvisor" as const,
      name: "TripAdvisor",
      description: "Afficher les notes et avis TripAdvisor",
      enabled: settings.tripadvisor,
      envKey: "TRIPADVISOR_API_KEY",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/${locale}/admin`}
        className="mb-6 inline-block text-sm text-brass hover:underline"
      >
        ← Retour au service
      </Link>

      <h1 className="mb-8 font-display text-3xl text-shell">Intégrations</h1>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="rounded-lg border border-shell-dim/20 bg-night p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-shell">
                  {integration.name}
                </h2>
                <p className="mt-1 text-sm text-shell-dim">
                  {integration.description}
                </p>
              </div>

              <form action={toggleIntegration}>
                <input type="hidden" name="key" value={integration.key} />
                <input
                  type="hidden"
                  name="value"
                  value={integration.enabled ? "false" : "true"}
                />
                <button
                  type="submit"
                  className={`rounded px-4 py-2 text-sm font-medium transition ${
                    integration.enabled
                      ? "bg-brass text-night hover:bg-brass/80"
                      : "bg-shell-dim/20 text-shell-dim hover:bg-shell-dim/30"
                  }`}
                >
                  {integration.enabled ? "Activé" : "Activer"}
                </button>
              </form>
            </div>

            {!process.env[integration.envKey] && (
              <p className="mt-3 text-xs text-coral">
                Variable d&apos;environnement {integration.envKey} non configurée.
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
