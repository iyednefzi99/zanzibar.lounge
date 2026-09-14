import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import StaffInterface from "./staff-interface";

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

  const staffForClient = staffMembers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role as "OWNER" | "MANAGER" | "STAFF",
    active: s.active,
  }));

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
        <StaffInterface staff={staffForClient} />
      </div>
    </div>
  );
}
