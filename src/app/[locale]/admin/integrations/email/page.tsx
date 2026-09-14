import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email (Resend) — Intégrations",
};

export default async function EmailIntegrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  await getDefaultRestaurantId();
  const apiKeySet = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@e-coffee-node.com";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link
        href={`/${locale}/admin/integrations`}
        className="mb-2 inline-block text-sm text-brass hover:underline"
      >
        ← Retour aux intégrations
      </Link>

      <h1 className="font-display text-3xl text-shell">Email (Resend)</h1>
      <p className="text-sm text-shell-dim">
        Configuration de l&apos;envoi d&apos;emails transactionnels via Resend
        (confirmations, rappels, newsletters).
      </p>

      {/* API Key Status */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-shell">Clé API Resend</h2>
            <p className="mt-1 text-sm text-shell-dim">
              {apiKeySet
                ? "Clé API Resend configurée."
                : "Clé API non configurée."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              apiKeySet
                ? "bg-lagoon/15 text-lagoon"
                : "bg-coral/15 text-coral"
            }`}
          >
            {apiKeySet ? "Configuré" : "Non configuré"}
          </span>
        </div>

        {!apiKeySet && (
          <p className="mt-3 text-xs text-coral">
            Ajoutez RESEND_API_KEY dans votre fichier .env.local.
          </p>
        )}
      </div>

      {/* From address */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <h2 className="font-display text-lg text-shell">Adresse d&apos;envoi</h2>
        <div className="mt-4 space-y-3 text-sm text-shell-dim">
          <div className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3">
            <span>Adresse FROM</span>
            <span className="font-mono text-xs text-brass">{fromEmail}</span>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <h2 className="font-display text-lg text-shell">Modèles d&apos;emails</h2>
        <div className="mt-4 space-y-2 text-sm text-shell-dim">
          {[
            { name: "Confirmation de réservation", key: "booking_confirmation" },
            { name: "Rappel de réservation", key: "booking_reminder" },
            { name: "Newsletter", key: "newsletter" },
            { name: "Feedback après visite", key: "feedback_request" },
          ].map((tpl) => (
            <div
              key={tpl.key}
              className="flex items-center justify-between rounded-lg bg-night/60 px-4 py-3"
            >
              <span>{tpl.name}</span>
              <span className="rounded-full bg-lagoon/15 px-2.5 py-0.5 text-[0.65rem] text-lagoon">
                Prêt
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
