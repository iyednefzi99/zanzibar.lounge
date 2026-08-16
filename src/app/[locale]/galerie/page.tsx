import Image from "next/image";
import { notFound } from "next/navigation";

import { Studs } from "@/components/studs";
import { gallery } from "@/content/gallery";
import { site } from "@/content/site";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    <>
      <header className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8">
        <h1 className="reveal font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dictionary.gallery.title}
        </h1>
        <p className="reveal reveal-1 mt-4 text-shell-dim">
          {dictionary.gallery.lead}
        </p>
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        {gallery.length === 0 ? (
          // Pas de photos dans le dépôt : on renvoie vers la source plutôt que
          // de meubler avec des images qui ne sont pas celles de la maison.
          <div className="arch mx-auto max-w-md border border-brass/40 bg-deep/50 p-10 pt-14 text-center">
            <p className="font-display text-3xl text-brass">
              {site.name}
            </p>
            <p className="mt-3 text-sm text-shell-dim">
              {dictionary.gallery.lead}
            </p>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-block rounded-full border border-shell/30 px-6 py-3 text-shell transition-colors hover:border-brass hover:text-brass"
            >
              {dictionary.gallery.instagram}
            </a>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {gallery.map((photo) => (
              <figure
                key={photo.src}
                className="on-scroll mb-4 break-inside-avoid overflow-hidden rounded-xl border border-shell/10"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt[locale]}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full"
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
