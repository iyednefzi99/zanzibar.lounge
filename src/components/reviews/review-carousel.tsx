"use client";

import { SectionHeader } from "@/components/ui/section-header";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

const reviews = [
  { name: "Aymen B.", rating: 5, text: "Un cadre magnifique, une ambiance unique et des plats délicieux. L'endroit parfait pour un dîner en amoureux." },
  { name: "Ines M.", rating: 5, text: "La terrasse est absolument sublime. On se croirait à Stone Town. Le service est impeccable et la carte très variée." },
  { name: "Karim D.", rating: 4, text: "J'ai adoré l'ambiance et le concept. La carte des cocktails est inventive. Je recommande vivement." },
  { name: "Salma H.", rating: 5, text: "Le meilleur restaurant de la région. Les saveurs sont authentiques et le cadre exceptionnel." },
  { name: "Youssef R.", rating: 5, text: "Une expérience culinaire incroyable du début à la fin. Le tajine était parfait." },
];

export function ReviewCarousel({
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-section sm:px-8">
      <SectionHeader
        eyebrow={dictionary.reviews.lead}
        title={dictionary.reviews.title}
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <article
            key={i}
            className="glass-card group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 card-hover"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="mb-3 flex items-center gap-1">
              <span className="sr-only">
                {review.rating}/5
              </span>
              {Array.from({ length: 5 }, (_, j) => (
                <svg
                  key={j}
                  aria-hidden="true"
                  className={`h-4 w-4 ${j < review.rating ? "text-brass" : "text-shell/20"}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-shell-dim">
              &ldquo;{review.text}&rdquo;
            </p>

            <p className="mt-4 font-mono text-xs text-brass">
              — {review.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
