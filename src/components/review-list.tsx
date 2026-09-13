import type { ReviewWithGuest } from "@/lib/reviews";

type ReviewListProps = {
  reviews: ReviewWithGuest[];
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

/**
 * Liste des avis approuvés avec note moyenne et distribution.
 *
 * Server component — les données viennent de la DB.
 */
export function ReviewList({
  reviews,
  average,
  count,
  distribution,
}: ReviewListProps) {
  if (count === 0) {
    return (
      <p className="py-12 text-center text-shell-dim">
        Aucun avis pour le moment.
      </p>
    );
  }

  return (
    <div>
      {/* Résumé */}
      <div className="flex items-start gap-8">
        <div className="text-center">
          <p className="font-mono text-5xl leading-none tabular-nums text-shell">
            {average.toFixed(1)}
          </p>
          <div className="mt-2 flex justify-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${star <= Math.round(average) ? "text-brass" : "text-shell/20"}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-shell-dim">
            {count} avis
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = distribution[star as 1 | 2 | 3 | 4 | 5];
            const pct = count > 0 ? (n / count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right font-mono text-xs text-shell-dim">
                  {star}
                </span>
                <span className="text-brass text-xs">★</span>
                <div className="flex-1 h-2 rounded-full bg-shell/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brass/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 font-mono text-xs text-shell-dim/70">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      <ul className="mt-10 space-y-6">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-xl border border-shell/10 bg-deep/40 p-5"
          >
            <div className="flex items-baseline gap-3">
              <div className="flex gap-0.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${star <= review.rating ? "text-brass" : "text-shell/20"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-shell">
                {review.guest.name ?? "Anonyme"}
              </span>
              <span className="ms-auto font-mono text-xs text-shell-dim">
                {formatDate(review.createdAt)}
              </span>
            </div>
            {review.title && (
              <p className="mt-2 font-medium text-shell">{review.title}</p>
            )}
            {review.body && (
              <p className="mt-1 text-sm leading-relaxed text-shell-dim">
                {review.body}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
