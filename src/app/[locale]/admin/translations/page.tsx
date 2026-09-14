import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { isLocale } from "@/i18n/config";
import { TranslationsInterface } from "./translations-interface";

export const metadata: Metadata = {
  title: "Translations",
};

export const dynamic = "force-dynamic";

export default async function TranslationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  return <TranslationsInterface />;
}
