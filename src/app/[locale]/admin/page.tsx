import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelAction,
  completeAction,
  noShowAction,
  seatAction,
} from "@/app/[locale]/admin/actions";
import { ExportForm } from "@/components/export-form";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { productionGaps } from "@/lib/env";
import { activeService, serviceWindow } from "@/lib/hours";
import { formatPhone } from "@/lib/phone";
import {
  reservationsForDate,
  type ReservationSummary,
} from "@/lib/reservations";
import { addDays, minutesToHM, toISODate } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Statuts qui attendent encore quelqu'un à la porte. */
const EXPECTED = ["PENDING", "CONFIRMED"];

/** Statuts qui ne comptent plus de couverts. */
const DROPPED = ["CANCELLED", "NO_SHOW"];

/**
 * Le service du soir, sur une page.
 *
 * Conçu pour être ouvert sur un téléphone posé près de la caisse : une seule
 * colonne, des boutons larges, aucun menu à déplier. La page se lit debout et
 * de haut en bas — le total d'abord, puis les arrivées heure par heure, comme
 * on les vit. L'état de chaque table se voit au liseré avant de se lire.
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Seconde barrière, après le proxy : si la requête arrive sans identifiants
  // valides, la page n'existe pas. Un 404 ne confirme pas l'existence du
  // back-office à qui tâtonne.
  if (!(await isAdmin())) notFound();

  const { date } = await searchParams;
  const today = toISODate(new Date(), site.timezone);
  const serviceDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : today;

  const reservations = await reservationsForDate(serviceDate);

  // Les deux totaux comptent le même ensemble : une table annulée n'est plus
  // une réservation, pas seulement des couverts en moins. Les lignes restent
  // dans la liste, estompées — la salle doit pouvoir y revenir.
  const live = reservations.filter((r) => !DROPPED.includes(r.status));
  const covers = live.reduce((total, r) => total + r.partySize, 0);

  const gaps = productionGaps();
  const closed = serviceWindow(serviceDate) === null;

  // « Maintenant » n'a de sens que si l'on regarde le service en cours : à
  // 21 h un mardi, la page de samedi ne doit pas prétendre suivre l'heure.
  const service = activeService();
  const liveMinutes =
    service && service.window.serviceDate === serviceDate
      ? service.nowMinutes
      : null;

  const next = nextArrival(reservations, liveMinutes);
  const groups = groupByHour(reservations);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">Service</h1>
        <div className="flex items-baseline gap-4">
          <Link
            href={`/${locale}/admin/analytics`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Statistiques
          </Link>
          <Link
            href={`/${locale}/admin/reviews`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Avis
          </Link>
          <Link
            href={`/${locale}/admin/chat`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Chat
          </Link>
          <Link
            href={`/${locale}/admin/floor`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Plan de salle
          </Link>
          <Link
            href={`/${locale}/admin/orders`}
            className="text-sm text-shell-dim hover:text-brass"
          >
            Commandes
          </Link>
          <p className="font-mono text-sm text-shell-dim">
            {longDate(serviceDate)}
          </p>
        </div>
      </header>

      <nav
        aria-label="Jour de service"
        className="mt-6 flex flex-wrap items-center gap-2"
      >
        {[-1, 0, 1, 2].map((offset) => {
          const target = addDays(today, offset);
          const active = target === serviceDate;
          return (
            <Link
              key={target}
              href={`/${locale}/admin?date=${target}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                active
                  ? "border-brass bg-brass font-medium text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {dayLabel(offset, target)}
            </Link>
          );
        })}
      </nav>

      {/* Le total avant le détail : ce qu'on veut savoir en passant devant. */}
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
        <Tile label="Couverts" value={String(covers)} />
        <Tile label="Réservations" value={String(live.length)} />
        <Tile
          label={liveMinutes === null ? "Première arrivée" : "Prochaine arrivée"}
          value={next ? next.time : "—"}
          detail={
            next ? `${next.name ?? "—"} · ${next.partySize} pers.` : undefined
          }
        />
      </div>

      {/* L'état de la configuration se lit après le service, pas avant : c'est
          une note d'exploitation, pas une urgence de salle. */}
      {gaps.length > 0 && (
        <p className="mt-8 border-s-[3px] border-s-coral/60 ps-4 text-xs leading-relaxed text-coral">
          Configuration incomplète : {gaps.join(", ")}.
        </p>
      )}

      <div className="mt-8 border-t border-brass/35 pt-6">
        <ExportForm />
      </div>

      <Studs className="mt-8" />

      {closed ? (
        <p className="py-16 text-center text-shell-dim">Fermé ce jour-là.</p>
      ) : reservations.length === 0 ? (
        <p className="py-16 text-center text-shell-dim">
          Aucune réservation pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {withNowMarker(groups, liveMinutes).map((entry) =>
            entry.kind === "now" ? (
              <NowMarker key="now" label={minutesToHM(entry.minutes)} />
            ) : (
            <section key={entry.group.hour}>
              <h2 className="flex items-baseline gap-4">
                <span
                  className="font-mono text-lg tabular-nums text-brass"
                  dir="ltr"
                >
                  {entry.group.label}
                </span>

                <span aria-hidden="true" className="h-px flex-1 bg-shell/12" />

                <span className="font-mono text-xs tabular-nums text-shell-dim">
                  {entry.group.covers} couverts
                </span>
              </h2>

              <ul className="mt-4 space-y-3">
                {entry.group.rows.map((reservation) => (
                  <ReservationRow
                    key={reservation.reference}
                    reservation={reservation}
                  />
                ))}
              </ul>
            </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Le repère de l'instant présent, glissé entre deux heures.
 *
 * Une salle a besoin de savoir où elle en est dans la soirée, y compris à une
 * heure creuse où personne n'est attendu. Le repère se place donc toujours,
 * avant la première heure encore à venir — ou en fin de liste si tout est
 * derrière nous.
 */
function NowMarker({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-4 text-lagoon">
      <span
        aria-hidden="true"
        className="inline-block size-2 shrink-0 rounded-full bg-lagoon shadow-[0_0_12px_var(--color-lagoon)]"
      />
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em]">
        maintenant
      </span>
      <span className="font-mono text-xs tabular-nums text-lagoon" dir="ltr">
        {label}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-lagoon/30" />
    </p>
  );
}

function Tile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border-t border-brass/35 pt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
        {label}
      </p>
      <p
        className="mt-2 font-mono text-3xl leading-none tabular-nums text-shell sm:text-4xl"
        dir="ltr"
      >
        {value}
      </p>
      {detail && <p className="mt-2 truncate text-xs text-shell-dim">{detail}</p>}
    </div>
  );
}

function ReservationRow({
  reservation,
}: {
  reservation: ReservationSummary;
}) {
  const tone = TONES[reservation.status] ?? TONES.PENDING;

  return (
    <li
      className={`relative overflow-hidden rounded-xl border border-shell/12 bg-deep/40 py-4 pe-4 ps-5 ${tone.row}`}
    >
      {/* Le liseré d'état : la table se voit avant de se lire. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 start-0 w-[3px] ${tone.stripe}`}
      />

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-lg tabular-nums text-shell" dir="ltr">
          {reservation.time}
        </span>
        <span className="text-shell">
          {reservation.name ?? "—"} · {reservation.partySize} pers.
        </span>
        <StatusPill status={reservation.status} />
        <span className="ms-auto font-mono text-xs text-shell-dim">
          {reservation.reference}
          {reservation.table ? ` · ${reservation.table}` : ""}
          {reservation.zone ? ` · ${reservation.zone}` : ""}
        </span>
      </div>

      <p className="mt-1 font-mono text-xs text-shell-dim" dir="ltr">
        <a href={`tel:${reservation.phone}`} className="hover:text-brass">
          {formatPhone(reservation.phone)}
        </a>
      </p>

      {reservation.notes && (
        <p className="mt-2 text-sm text-shell-dim">« {reservation.notes} »</p>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <ActionButton
          action={seatAction}
          reference={reservation.reference}
          label="Installer"
          disabled={!EXPECTED.includes(reservation.status)}
        />
        <ActionButton
          action={completeAction}
          reference={reservation.reference}
          label="Libérer"
          disabled={reservation.status !== "SEATED"}
        />
        <ActionButton
          action={noShowAction}
          reference={reservation.reference}
          label="Non venu"
          disabled={
            reservation.status === "COMPLETED" ||
            reservation.status === "CANCELLED"
          }
        />
        <ActionButton
          action={cancelAction}
          reference={reservation.reference}
          label="Annuler"
          tone="danger"
          disabled={
            reservation.status === "CANCELLED" ||
            reservation.status === "COMPLETED"
          }
        />
      </div>
    </li>
  );
}

/**
 * L'état d'une table, en couleur et en épaisseur.
 *
 * Le laiton est réservé à ce qui est vivant — une table occupée. Le lagon dit
 * « attendu », le corail « perdu », et ce qui est clos s'efface au lieu de
 * disparaître : la salle doit pouvoir revenir dessus.
 */
const TONES: Record<string, { stripe: string; row: string }> = {
  PENDING: { stripe: "bg-shell/25", row: "" },
  CONFIRMED: { stripe: "bg-lagoon/70", row: "" },
  SEATED: { stripe: "bg-brass", row: "" },
  COMPLETED: { stripe: "bg-shell/15", row: "opacity-45" },
  CANCELLED: { stripe: "bg-coral/50", row: "opacity-45" },
  NO_SHOW: { stripe: "bg-coral", row: "opacity-60" },
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "border-shell/30 text-shell-dim",
    CONFIRMED: "border-lagoon/50 text-lagoon",
    SEATED: "border-brass/60 text-brass",
    COMPLETED: "border-shell/20 text-shell-dim",
    CANCELLED: "border-coral/50 text-coral",
    NO_SHOW: "border-coral/50 text-coral",
  };

  const labels: Record<string, string> = {
    PENDING: "en attente",
    CONFIRMED: "confirmée",
    SEATED: "à table",
    COMPLETED: "terminée",
    CANCELLED: "annulée",
    NO_SHOW: "non venu",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function ActionButton({
  action,
  reference,
  label,
  disabled,
  tone,
}: {
  action: (formData: FormData) => Promise<void>;
  reference: string;
  label: string;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="reference" value={reference} />
      <button
        type="submit"
        disabled={disabled}
        className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm transition-colors disabled:opacity-30 ${
          tone === "danger"
            ? "border-coral/40 text-coral hover:bg-coral/10"
            : "border-shell/25 text-shell hover:border-brass hover:text-brass"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

/** Les arrivées regroupées par heure, dans l'ordre où on les vivra. */
function groupByHour(reservations: ReservationSummary[]): Array<{
  hour: number;
  label: string;
  covers: number;
  rows: ReservationSummary[];
}> {
  const byHour = new Map<number, ReservationSummary[]>();

  for (const reservation of reservations) {
    const hour = Math.floor(reservation.minutes / 60);
    const rows = byHour.get(hour);
    if (rows) rows.push(reservation);
    else byHour.set(hour, [reservation]);
  }

  return [...byHour.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, rows]) => ({
      hour,
      label: minutesToHM(hour * 60),
      covers: rows
        .filter((r) => !DROPPED.includes(r.status))
        .reduce((total, r) => total + r.partySize, 0),
      rows,
    }));
}

type HourGroup = ReturnType<typeof groupByHour>[number];

type TimelineEntry =
  | { kind: "group"; group: HourGroup }
  | { kind: "now"; minutes: number };

/**
 * Les heures du service, avec le repère de l'instant à sa place.
 *
 * Hors service — une date passée, ou demain — il n'y a pas d'instant à situer :
 * la liste ressort telle quelle.
 */
function withNowMarker(
  groups: HourGroup[],
  liveMinutes: number | null,
): TimelineEntry[] {
  const entries: TimelineEntry[] = groups.map((group) => ({
    kind: "group",
    group,
  }));

  if (liveMinutes === null) return entries;

  const marker: TimelineEntry = { kind: "now", minutes: liveMinutes };
  const index = entries.findIndex(
    (entry) => entry.kind === "group" && entry.group.hour * 60 > liveMinutes,
  );

  if (index < 0) entries.push(marker);
  else entries.splice(index, 0, marker);

  return entries;
}

/**
 * La prochaine table à accueillir. Pendant le service, c'est la première
 * attendue à partir de maintenant ; hors service, la première de la journée.
 */
function nextArrival(
  reservations: ReservationSummary[],
  liveMinutes: number | null,
): ReservationSummary | null {
  const expected = reservations.filter((r) => EXPECTED.includes(r.status));
  if (liveMinutes === null) return expected[0] ?? null;
  return expected.find((r) => r.minutes >= liveMinutes) ?? null;
}

/** « Hier », « Aujourd'hui », « Demain », ou la date écrite. */
function dayLabel(offset: number, isoDate: string): string {
  if (offset === -1) return "Hier";
  if (offset === 0) return "Aujourd'hui";
  if (offset === 1) return "Demain";
  return shortDate(isoDate);
}

function shortDate(isoDate: string): string {
  return formatDate(isoDate, { weekday: "short", day: "numeric" });
}

function longDate(isoDate: string): string {
  return formatDate(isoDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Une date ISO nue mise en français.
 *
 * Le fuseau est fixé à UTC exprès : « 2026-08-25 » est un jour de calendrier,
 * pas un instant. Le laisser au fuseau du serveur ferait basculer la date d'un
 * jour selon l'endroit où tourne l'application.
 */
function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
