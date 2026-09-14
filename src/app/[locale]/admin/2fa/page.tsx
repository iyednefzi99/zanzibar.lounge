import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authentification à deux facteurs",
};

export default async function TwoFactorPage({
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

  const staffMembers = await db.staff.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      active: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const enabledCount = staffMembers.filter((s) => s.twoFactorEnabled).length;
  const totalCount = staffMembers.length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">
          Authentification à deux facteurs
        </h1>
        <Link
          href={`/${locale}/admin/security`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour à la sécurité
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Staff total
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell">
            {totalCount}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            2FA activée
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-lagoon">
            {enabledCount}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            2FA désactivée
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-coral">
            {totalCount - enabledCount}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl text-shell">État par membre</h2>
        <div className="mt-4 space-y-3">
          {staffMembers.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between rounded-xl border border-shell/12 bg-deep/40 px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-shell">{staff.name}</span>
                <span className="font-mono text-xs text-shell-dim">
                  {staff.email} · {staff.role}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {staff.twoFactorEnabled ? (
                  <span className="rounded-full border border-lagoon/50 px-3 py-1 font-mono text-xs text-lagoon">
                    Activée
                  </span>
                ) : (
                  <span className="rounded-full border border-coral/50 px-3 py-1 font-mono text-xs text-coral">
                    Désactivée
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-brass/35 pt-6">
        <p className="text-sm leading-relaxed text-shell-dim">
          L&apos;authentification à deux facteurs (TOTP) protège les accès
          sensibles du back-office. Chaque membre du personnel active sa 2FA
          depuis son profil via une application d&apos;authentification (Google
          Authenticator, Authy, etc.).
        </p>
      </div>
    </div>
  );
}
