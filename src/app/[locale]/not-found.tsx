import { getDictionary } from "@/i18n";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import Link from "next/link";

export default async function NotFoundPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
} = {}) {
  const raw = params ? (await params).locale : undefined;
  const typedLocale: Locale =
    raw && isLocale(raw) ? raw : defaultLocale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <div className="mx-auto flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-7xl text-brass">404</p>
      <h1 className="mt-4 font-display text-3xl text-shell">
        {dictionary.notFound.title}
      </h1>
      <p className="mt-2 max-w-md text-shell-dim">
        {dictionary.notFound.description}
      </p>
      <Link
        href={`/${typedLocale}`}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
      >
        {dictionary.notFound.backHome}
      </Link>
    </div>
  );
}
