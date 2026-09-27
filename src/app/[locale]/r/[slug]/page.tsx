import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/ui/section-header";
import { isLocale } from "@/i18n/config";

export default async function RestaurantSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-section sm:px-8">
      <SectionHeader
        title={slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        subtitle="Restaurant profile page"
      />

      <div className="mt-10 glass-card rounded-2xl p-8 text-center">
        <p className="text-shell-dim">Restaurant profile coming soon</p>
      </div>
    </div>
  );
}
