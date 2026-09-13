import Image from "next/image";
import Link from "next/link";
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
        <p className="reveal reveal-1 mt-4 max-w-xl text-shell-dim">
          {dictionary.gallery.lead}
        </p>
      </header>

      <Studs className="reveal reveal-2" />

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        {gallery.length === 0 ? (
          /* Pas de photos dans le dépôt : elles appartiennent à la maison. On
             renvoie vers la source plutôt que de meubler avec des images qui ne
             sont pas les siennes — et on laisse une porte de sortie utile, la
             réservation, plutôt qu'un cul-de-sac.

             L'en-tête a déjà dit d'où viennent les photos ; le panneau ne le
             redit pas, il agit. */
          <div className="reveal reveal-3 mx-auto max-w-lg border-t border-brass/35 py-12 text-center">
            <p className="font-display text-3xl text-shell">{site.name}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-shell/30 px-6 py-3 text-shell transition-colors hover:border-brass hover:text-brass"
              >
                {dictionary.gallery.instagram}
              </a>
              <Link
                href={`/${locale}/reserver`}
                className="px-2 py-3 text-shell-dim underline underline-offset-4 transition-colors hover:text-shell"
              >
                {dictionary.nav.book}
              </Link>
            </div>
          </div>
        ) : (
          /* Mosaïque à rangées fixes : une photo « haute » occupe deux rangées,
             ce que la colonne CSS ne savait pas faire. Le recadrage est assumé —
             la page doit tenir sa grille, pas suivre chaque proportion. */
          <div className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] lg:grid-cols-3">
            {gallery.map((photo) => (
              <figure
                key={photo.src}
                className={`on-scroll group relative overflow-hidden rounded-xl border border-shell/10 ${
                  photo.tall ? "row-span-2" : ""
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt[locale]}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-700 ease-door group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
