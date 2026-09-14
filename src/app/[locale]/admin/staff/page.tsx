import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Équipe",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Gérant",
  STAFF: "Personnel",
};

const ROLE_STYLES: Record<string, string> = {
  OWNER: "border-brass/60 text-brass",
  MANAGER: "border-lagoon/50 text-lagoon",
  STAFF: "border-shell/30 text-shell-dim",
};

export default async function StaffPage({
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
      active: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const activeCount = staffMembers.filter((s) => s.active).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Équipe</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Membres actifs
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-lagoon">
            {activeCount}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Total
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell">
            {staffMembers.length}
          </p>
        </div>
        <div className="border-t border-brass/35 pt-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
            Inactifs
          </p>
          <p className="mt-2 font-mono text-3xl leading-none tabular-nums text-coral">
            {staffMembers.length - activeCount}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl text-shell">Membres</h2>

        {staffMembers.length === 0 ? (
          <p className="mt-8 py-8 text-center text-shell-dim">
            Aucun membre dans l&apos;équipe.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                className="relative overflow-hidden rounded-xl border border-shell/12 bg-deep/40 px-5 py-4"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 start-0 w-[3px] ${staff.active ? "bg-lagoon/70" : "bg-coral/50"}`}
                />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ps-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-shell">{staff.name}</span>
                    <span className="font-mono text-xs text-shell-dim">
                      {staff.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase ${ROLE_STYLES[staff.role]}`}
                    >
                      {ROLE_LABELS[staff.role]}
                    </span>
                    {staff.twoFactorEnabled && (
                      <span className="rounded-full border border-lagoon/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-lagoon">
                        2FA
                      </span>
                    )}
                    {staff.active ? (
                      <span className="rounded-full border border-lagoon/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-lagoon">
                        Actif
                      </span>
                    ) : (
                      <span className="rounded-full border border-coral/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-coral">
                        Inactif
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 ps-3 font-mono text-xs text-shell-dim">
                  Dernière connexion :{" "}
                  {staff.lastLoginAt
                    ? new Intl.DateTimeFormat("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(staff.lastLoginAt)
                    : "jamais"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
