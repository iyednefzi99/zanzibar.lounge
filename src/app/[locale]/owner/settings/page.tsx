import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/saas";

import { updateRestaurantSettings } from "../actions";
import { PlanBadge } from "@/components/plan-badge";
import type { SubscriptionPlan } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const TIMEZONES = [
  "Africa/Tunis",
  "Africa/Casablanca",
  "Africa/Cairo",
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "Asia/Dubai",
];

const LOCALES = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

export default async function OwnerSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(await isAdminOrOwner())) notFound();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) notFound();

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  // Fetch full restaurant data for the form
  const full = await db.restaurant.findUnique({
    where: { slug },
    select: {
      name: true,
      address: true,
      phone: true,
      timezone: true,
      locale: true,
      logoUrl: true,
      brandColor: true,
      customDomain: true,
      plan: true,
    },
  });

  if (!full) notFound();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-shell">Paramètres</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Configurez les informations de votre restaurant.
        </p>
      </header>

      {/* Plan */}
      <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
              Plan actuel
            </h2>
            <div className="mt-3">
              <PlanBadge plan={full.plan as SubscriptionPlan} />
            </div>
          </div>
          <a
            href={`/${locale}/owner/billing`}
            className="rounded-full border border-brass/40 px-5 py-2.5 text-sm text-brass transition-colors hover:bg-brass/10"
          >
            Gérer l&apos;abonnement
          </a>
        </div>
      </section>

      {/* Form */}
      <form action={updateRestaurantSettings} className="space-y-8">
        <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
            Informations générales
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field
              name="name"
              label="Nom du restaurant"
              defaultValue={full.name}
              required
            />
            <Field
              name="phone"
              label="Téléphone"
              defaultValue={full.phone ?? ""}
              type="tel"
            />
            <div className="sm:col-span-2">
              <Field
                name="address"
                label="Adresse"
                defaultValue={full.address ?? ""}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
            Configuration
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Select
              name="timezone"
              label="Fuseau horaire"
              defaultValue={full.timezone}
              options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
            />
            <Select
              name="locale"
              label="Langue principale"
              defaultValue={full.locale}
              options={LOCALES}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-shell/12 bg-deep/40 p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-brass">
            Personnalisation
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field
              name="logoUrl"
              label="URL du logo"
              defaultValue={full.logoUrl ?? ""}
              type="url"
              placeholder="https://..."
            />
            <Field
              name="brandColor"
              label="Couleur principale (hex)"
              defaultValue={full.brandColor ?? ""}
              placeholder="c9922e"
            />
            <div className="sm:col-span-2">
              <Field
                name="customDomain"
                label="Domaine personnalisé"
                defaultValue={full.customDomain ?? ""}
                placeholder="reservation.monrestaurant.com"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-brass px-7 py-3 font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell placeholder-shell-dim/40 transition-colors focus:border-brass focus:outline-none"
      />
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell transition-colors focus:border-brass focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

async function isAdminOrOwner(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
