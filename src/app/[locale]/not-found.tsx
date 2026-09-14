import Link from "next/link";

import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";

export default async function NotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = isLocale(locale) ? (locale as Locale) : "fr";
  const dictionary = await getDictionary(typedLocale);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl font-bold text-brass">404</p>
      <h1 className="mt-4 text-3xl font-bold">
        {dictionary.notFound?.title ?? "Page introuvable"}
      </h1>
      <p className="mt-2 text-shell-dim">
        {dictionary.notFound?.description ??
          "La page que vous cherchez n'existe pas ou a été déplacée."}
      </p>
      <Link
        href={`/${typedLocale}`}
        className="mt-6 rounded bg-brass px-6 py-3 font-medium text-night transition hover:bg-brass/80"
      >
        {dictionary.notFound?.backHome ?? "Retour à l'accueil"}
      </Link>
    </div>
  );
}
