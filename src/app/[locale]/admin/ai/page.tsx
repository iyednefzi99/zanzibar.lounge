import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AiConfigPanel } from "@/components/ai-config-panel";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IA — Configuration",
};

export default async function AiPage({
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

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">IA — Cerveau</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <AiConfigPanel restaurantId={restaurantId} />
    </div>
  );
}
