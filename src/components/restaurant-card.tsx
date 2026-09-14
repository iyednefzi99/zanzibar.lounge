import Link from "next/link";

type RestaurantCardProps = {
  name: string;
  slug: string;
  address: string | null;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
};

export function RestaurantCard({
  name,
  slug,
  address,
  isOpen,
  rating,
  reviewCount,
}: RestaurantCardProps) {
  return (
    <Link
      href={`/r/${slug}`}
      className="group block rounded-2xl border border-shell/10 bg-deep/60 p-6 transition-colors hover:border-brass/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl text-shell transition-colors group-hover:text-brass">
          {name}
        </h3>
        <span
          className={`shrink-0 mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] ${
            isOpen
              ? "bg-lagoon/15 text-lagoon"
              : "bg-coral/15 text-coral"
          }`}
          aria-label={isOpen ? "Ouvert" : "Fermé"}
        >
          <span
            aria-hidden="true"
            className={`inline-block size-1.5 rounded-full ${
              isOpen ? "bg-lagoon" : "bg-coral"
            }`}
          />
          {isOpen ? "Ouvert" : "Fermé"}
        </span>
      </div>

      {address && (
        <address className="mt-3 text-sm not-italic text-shell-dim">
          {address}
        </address>
      )}

      <div className="mt-4 flex items-center gap-3">
        {reviewCount > 0 ? (
          <>
            <span className="inline-flex items-center gap-1 text-sm text-brass">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813 1.134.561 1.531-.38l3.898-3.46 4.753.381c.833.067 1.171-1.107.536-1.651l-3.62-3.102-1.106-4.637c-.194-.813-1.134-.561-1.531-.38L10.868 2.884Z"
                  clipRule="evenodd"
                />
              </svg>
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-shell-dim">
              ({reviewCount} avis)
            </span>
          </>
        ) : (
          <span className="text-sm text-shell-dim/80">Pas encore d&apos;avis</span>
        )}
      </div>
    </Link>
  );
}
