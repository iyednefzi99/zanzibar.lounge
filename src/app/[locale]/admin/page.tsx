import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelAction,
  completeAction,
  noShowAction,
  seatAction,
} from "@/app/[locale]/admin/actions";
import { Studs } from "@/components/studs";
import { site } from "@/content/site";
import { isLocale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { productionGaps } from "@/lib/env";
import { serviceWindow } from "@/lib/hours";
import { formatPhone } from "@/lib/phone";
import { reservationsForDate } from "@/lib/reservations";
import { addDays, toISODate } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Le service du soir, sur une page.
 *
 * Conçu pour être ouvert sur un téléphone posé près de la caisse : une seule
 * colonne, des boutons larges, aucun menu à déplier.
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
  const covers = reservations
    .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((total, r) => total + r.partySize, 0);

  const gaps = productionGaps();
  const closed = serviceWindow(serviceDate) === null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl text-shell">Service</h1>
        <p className="font-mono text-sm text-shell-dim">
          {covers} couverts · {reservations.length} réservations
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap items-center gap-2">
        {[-1, 0, 1, 2].map((offset) => {
          const target = addDays(today, offset);
          const active = target === serviceDate;
          return (
            <Link
              key={target}
              href={`/${locale}/admin?date=${target}`}
              className={`rounded-full border px-4 py-2 font-mono text-sm transition-colors ${
                active
                  ? "border-brass bg-brass text-deep"
                  : "border-shell/20 text-shell-dim hover:border-brass hover:text-brass"
              }`}
            >
              {target}
            </Link>
          );
        })}
      </nav>

      {gaps.length > 0 && (
        <p className="mt-6 rounded-lg border border-coral/40 bg-coral/10 p-4 text-sm text-coral">
          Configuration incomplète : {gaps.join(", ")}.
        </p>
      )}

      <Studs className="mt-8" />

      {closed ? (
        <p className="py-16 text-center text-shell-dim">
          Fermé ce jour-là.
        </p>
      ) : reservations.length === 0 ? (
        <p className="py-16 text-center text-shell-dim">
          Aucune réservation pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {reservations.map((reservation) => (
            <li
              key={reservation.reference}
              className="rounded-xl border border-shell/12 bg-deep/40 p-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span
                  className="font-mono text-lg tabular-nums text-brass"
                  dir="ltr"
                >
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
                <a
                  href={`tel:${reservation.phone}`}
                  className="hover:text-brass"
                >
                  {formatPhone(reservation.phone)}
                </a>
              </p>

              {reservation.notes && (
                <p className="mt-2 text-sm text-shell-dim">
                  « {reservation.notes} »
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton
                  action={seatAction}
                  reference={reservation.reference}
                  label="Installer"
                  disabled={reservation.status !== "CONFIRMED" && reservation.status !== "PENDING"}
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
                  disabled={reservation.status === "COMPLETED" || reservation.status === "CANCELLED"}
                />
                <ActionButton
                  action={cancelAction}
                  reference={reservation.reference}
                  label="Annuler"
                  tone="danger"
                  disabled={reservation.status === "CANCELLED" || reservation.status === "COMPLETED"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
        className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-30 ${
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
