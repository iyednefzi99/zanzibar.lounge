import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { getMenu } from "@/lib/orders";
import { OrderPageClient } from "./order-page-client";

export const dynamic = "force-dynamic";

export default async function CommanderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const menu = await getMenu();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <header>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {locale === "fr" ? "Commander" : locale === "ar" ? "طلب" : "Order"}
        </h1>
        <p className="mt-4 max-w-xl text-shell-dim">
          {locale === "fr"
            ? "Composez votre panier et choisissez l'heure de récupération."
            : locale === "ar"
              ? "اختر طعامك وحدد وقت الاستلام."
              : "Build your bag and choose a pickup time."}
        </p>
      </header>

      <OrderPageClient locale={locale} menu={menu} />
    </div>
  );
}
