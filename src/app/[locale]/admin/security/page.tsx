import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import { getAuditLogs } from "@/lib/security";

import { SecurityDashboard } from "./security-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sécurité",
};

export default async function SecurityPage({
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

  const [staffMembers, auditLogs, webhookCount, apiKeyCount] = await Promise.all([
    db.staff.findMany({
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
    }),
    getAuditLogs(restaurantId, 100),
    db.webhookEndpoint.count({ where: { restaurantId, active: true } }),
    db.apiKey.count({ where: { restaurantId, active: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Sécurité</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <SecurityDashboard
        restaurantId={restaurantId}
        staffMembers={staffMembers}
        auditLogs={auditLogs}
        webhookCount={webhookCount}
        apiKeyCount={apiKeyCount}
      />
    </div>
  );
}
