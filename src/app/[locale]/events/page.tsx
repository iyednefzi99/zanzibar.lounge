import { notFound } from "next/navigation";
import Link from "next/link";

import { Studs } from "@/components/studs";
import { isLocale } from "@/i18n/config";
import { getEvents, type EventData } from "@/lib/events";
import { getDefaultRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const DICTS: Record<string, { title: string; lead: string; date: string; spots: string; spotsLeft: string; price: string; free: string; book: string; full: string; noEvents: string }> = {
  fr: {
    title: "Événements",
    lead: "Découvrez nos soirées à thème, dégustations et événements spéciaux.",
    date: "Date",
    spots: "places",
    spotsLeft: "places restantes",
    price: "Prix",
    free: "Gratuit",
    book: "Réserver",
    full: "Complet",
    noEvents: "Aucun événement à venir pour le moment.",
  },
  ar: {
    title: "الأحداث",
    lead: "اكتشف حفلاتنا Tematique وتذوق الأحداث الخاصة.",
    date: "التاريخ",
    spots: "أماكن",
    spotsLeft: "أماكن متبقية",
    price: "السعر",
    free: "مجاني",
    book: "حجز",
    full: "مكتمل",
    noEvents: "لا توجد أحداث قادمة في الوقت الحالي.",
  },
  en: {
    title: "Events",
    lead: "Discover our themed nights, tastings, and special events.",
    date: "Date",
    spots: "spots",
    spotsLeft: "spots left",
    price: "Price",
    free: "Free",
    book: "Book",
    full: "Full",
    noEvents: "No upcoming events at this time.",
  },
};

function formatPrice(price: number): string {
  if (price === 0) return "";
  return `${(price / 1000).toFixed(3)} DT`;
}

function formatDate(isoDate: string, startTime: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, h, min));
  return new Intl.DateTimeFormat("fr-TN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Tunis",
  }).format(date);
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = DICTS[locale] ?? DICTS.fr;
  const restaurantId = await getDefaultRestaurantId();
  const events = await getEvents(restaurantId);

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <header>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-shell">
          {dict.title}
        </h1>
        <p className="mt-4 max-w-xl text-shell-dim">{dict.lead}</p>
      </header>

      <Studs className="mt-10" />

      <section className="mt-10">
        {events.length === 0 ? (
          <p className="text-center text-shell-dim py-12">{dict.noEvents}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EventCard({
  event,
  locale,
  dict,
}: {
  event: EventData;
  locale: string;
  dict: (typeof DICTS)["fr"];
}) {
  const isFull = event.status === "full" || event.spotsLeft <= 0;

  return (
    <div className="group overflow-hidden rounded-xl border border-shell/10 bg-deep/40 transition-colors hover:border-brass/30">
      {event.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-xl text-shell">{event.title}</h3>
        <p className="mt-2 text-sm text-shell-dim">
          {formatDate(event.date, event.startTime)}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-shell-dim">
            {event.spotsLeft > 0
              ? `${event.spotsLeft} ${dict.spotsLeft}`
              : dict.full}
          </span>
          <span className="font-mono text-brass">
            {event.price === 0 ? dict.free : formatPrice(event.price)}
          </span>
        </div>

        {/* Barre de capacité */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-shell/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(5, ((event.capacity - event.spotsLeft) / event.capacity) * 100)}%`,
              backgroundColor: isFull
                ? "var(--color-coral)"
                : "var(--color-brass)",
            }}
          />
        </div>

        <div className="mt-4">
          {isFull ? (
            <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-coral/30 px-6 text-sm text-coral">
              {dict.full}
            </span>
          ) : (
            <Link
              href={`/${locale}/events/${event.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80"
            >
              {dict.book}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
