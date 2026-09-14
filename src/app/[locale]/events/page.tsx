import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isLocale } from "@/i18n/config";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Événements | E-Coffee Node",
  description:
    "Découvrez les prochains événements au E-Coffee Node : soirées, ateliers, musique live et plus encore.",
  openGraph: {
    title: "Événements | E-Coffee Node",
    description:
      "Découvrez les prochains événements au E-Coffee Node : soirées, ateliers, musique live et plus encore.",
  },
};

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const restaurantId = await getDefaultRestaurantId();

  const events = await db.event.findMany({
    where: {
      restaurantId,
      status: "PUBLISHED",
      date: { gte: new Date().toISOString().split("T")[0] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      startTime: true,
      capacity: true,
      price: true,
      imageUrl: true,
      _count: { select: { bookings: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="text-center">
        <h1 className="font-display text-4xl text-shell sm:text-5xl">
          Événements
        </h1>
        <p className="mt-4 text-shell-dim">
          Retrouvez-nous pour des moments inoubliables au E-Coffee Node.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="mt-16 py-8 text-center text-shell-dim">
          Aucun événement à venir pour le moment. Revenez bientôt !
        </p>
      ) : (
        <div className="mt-12 space-y-6">
          {events.map((event) => {
            const spotsLeft = event.capacity - event._count.bookings;
            const isFull = spotsLeft <= 0;

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-xl border border-shell/12 bg-deep/40"
              >
                {event.imageUrl && (
                  <div className="aspect-video w-full bg-deep">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h2 className="font-display text-2xl text-shell">
                      {event.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      {event.price > 0 && (
                        <span className="font-mono text-sm text-brass">
                          {(event.price / 1000).toFixed(3)} TND
                        </span>
                      )}
                      {event.price === 0 && (
                        <span className="rounded-full border border-lagoon/50 px-2.5 py-0.5 font-mono text-xs text-lagoon">
                          Gratuit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs text-shell-dim">
                    <span>
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      }).format(new Date(event.date + "T00:00:00Z"))}
                    </span>
                    <span dir="ltr">{event.startTime}</span>
                    <span>
                      {isFull ? (
                        <span className="text-coral">Complet</span>
                      ) : (
                        <>
                          {spotsLeft} place{spotsLeft > 1 ? "s" : ""} restante
                          {spotsLeft > 1 ? "s" : ""}
                        </>
                      )}
                    </span>
                  </div>

                  {event.description && (
                    <p className="mt-4 text-sm leading-relaxed text-shell-dim">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-5">
                    {isFull ? (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-shell/20 px-5 text-sm text-shell-dim opacity-50">
                        Complet
                      </span>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-brass px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/10">
                        Réserver
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
