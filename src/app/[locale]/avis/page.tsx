import { notFound } from "next/navigation";

import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const { ref } = await searchParams;

  const [reviews, stats] = await Promise.all([
    getApprovedReviews(50),
    getReviewStats(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <header>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dictionary.reviews.title}
        </h1>
        <p className="mt-4 max-w-xl text-shell-dim">
          {dictionary.reviews.lead}
        </p>
      </header>

      <Studs className="mt-10" />

      {/* Formulaire */}
      <section className="mt-10">
        <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {dictionary.reviews.formTitle}
        </h2>
        <div className="mt-4">
          <ReviewForm
            locale={locale}
            reservationRef={ref}
            dictionary={{
              title: dictionary.reviews.titleField,
              rating: dictionary.reviews.rating,
              comment: dictionary.reviews.comment,
              submit: dictionary.reviews.submit,
              success: dictionary.reviews.success,
              error: dictionary.reviews.error,
              namePlaceholder: dictionary.reviews.namePlaceholder,
            }}
          />
        </div>
      </section>

      <Studs className="mt-10" />

      {/* Liste des avis */}
      <section className="mt-10">
        <ReviewList
          reviews={reviews}
          average={stats.average}
          count={stats.count}
          distribution={stats.distribution}
        />
      </section>
    </div>
  );
}
