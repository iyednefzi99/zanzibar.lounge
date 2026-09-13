import { site } from "@/content/site";
import { reservationsForDate } from "@/lib/reservations";

/**
 * Export CSV des réservations pour la comptabilité.
 *
 * Le format est conçu pour être lisible par Excel FR (BOM UTF-8, virgule
 * comme séparateur). Les dates et heures sont exprimées dans le fuseau de
 * l'établissement.
 */

const CSV_HEADERS = [
  "Date",
  "Heure",
  "Effectif",
  "Zone",
  "Table",
  "Statut",
  "Canal",
  "Référence",
  "Nom",
  "Téléphone",
  "Créé le",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SEATED: "À table",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW: "Non venu",
};

const CHANNEL_LABELS: Record<string, string> = {
  WEB: "Web",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  PHONE: "Téléphone",
};

export async function reservationsToCsv(
  from: string,
  to: string,
): Promise<string> {
  const dates = serviceDatesBetween(from, to);

  const lines = [CSV_HEADERS.map(csvEscape).join(",")];

  for (const date of dates) {
    const reservations = await reservationsForDate(date);

    for (const r of reservations) {
      lines.push(
        [
          formatExportDate(r.serviceDate),
          r.time,
          String(r.partySize),
          r.zone ? zoneLabel(r.zone) : "",
          r.table ?? "",
          STATUS_LABELS[r.status] ?? r.status,
          CHANNEL_LABELS[r.channel] ?? r.channel,
          r.reference,
          r.name ?? "",
          r.phone,
          formatExportDateTime(r.startsAt),
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }

  // BOM UTF-8 pour Excel
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

/** Génère la liste des dates ISO entre from et to inclus. */
function serviceDatesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function zoneLabel(zone: string): string {
  const labels: Record<string, string> = {
    TERRASSE: "Terrasse",
    SALLE: "Salle",
    SALON: "Salon",
  };
  return labels[zone] ?? zone;
}

function formatExportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatExportDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
