import Link from "next/link";
import { notFound } from "next/navigation";

import { approveAction, rejectAction } from "@/app/[locale]/admin/reviews/actions";
import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { getPendingReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!(await isAdmin())) notFound();

  const pending = await getPendingReviews();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Avis en attente</h1>
        <Link
          href={`/${locale}/admin`}
          className="text-sm text-shell-dim hover:text-brass"
        >
          ← Retour au service
        </Link>
      </header>

      <Studs className="mt-8" />

      {pending.length === 0 ? (
        <p className="py-16 text-center text-shell-dim">
          Aucun avis en attente de modération.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {pending.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-shell/12 bg-deep/40 p-5"
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
                  {review.createdAt.toLocaleDateString("fr-FR")}
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

              <div className="mt-4 flex gap-2">
                <form action={approveAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-lagoon/50 px-4 text-sm text-lagoon transition-colors hover:bg-lagoon/10"
                  >
                    Approuver
                  </button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-coral/40 px-4 text-sm text-coral transition-colors hover:bg-coral/10"
                  >
                    Rejeter
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
