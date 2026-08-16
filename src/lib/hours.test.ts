import { describe, expect, it } from "vitest";

import { site } from "@/content/site";
import {
  isOpenAtLocal,
  lastSeating,
  openStatus,
  serviceSlotOf,
  serviceWindow,
  slotInstant,
  slotsFor,
} from "@/lib/hours";
import { parseLocalDateTime } from "@/lib/time";

const TZ = site.timezone;

// Les horaires par défaut : ouverture à 08:00 tous les jours, fermeture à
// minuit en semaine et à 02:00 le vendredi et le samedi.
const FRIDAY = "2026-08-21";
const SATURDAY = "2026-08-22";
const THURSDAY = "2026-08-20";

describe("fenêtres de service", () => {
  it("ouvre selon le jour de la semaine", () => {
    expect(serviceWindow(THURSDAY)).toEqual({
      serviceDate: THURSDAY,
      open: 480,
      close: 1440,
    });
    expect(serviceWindow(FRIDAY)).toEqual({
      serviceDate: FRIDAY,
      open: 480,
      close: 1560, // 02:00 le lendemain
    });
  });

  it("garde une marge avant la fermeture pour la dernière installation", () => {
    const window = serviceWindow(FRIDAY)!;
    expect(lastSeating(window)).toBe(
      1560 - site.booking.lastSeatingBufferMinutes,
    );
  });
});

describe("ouverture après minuit", () => {
  it("rattache 01:00 du samedi au service du vendredi", () => {
    expect(isOpenAtLocal(SATURDAY, 60)).toBe(true);
  });

  it("ferme entre 02:00 et l'ouverture du matin", () => {
    expect(isOpenAtLocal(SATURDAY, 180)).toBe(false); // 03:00
    expect(isOpenAtLocal(SATURDAY, 420)).toBe(false); // 07:00
    expect(isOpenAtLocal(SATURDAY, 480)).toBe(true); // 08:00
  });

  it("ne prolonge pas un service qui s'arrête à minuit", () => {
    // Jeudi ferme à 24:00 : vendredi 01:00 n'appartient à aucun service.
    expect(isOpenAtLocal(FRIDAY, 60)).toBe(false);
  });
});

describe("créneaux réservables", () => {
  it("s'arrête à la dernière installation, pas à la fermeture", () => {
    // Une date lointaine : aucun créneau n'est écarté pour cause de préavis.
    const distantFriday = "2027-08-20";
    expect(new Date(`${distantFriday}T12:00:00Z`).getUTCDay()).toBe(5);

    const slots = slotsFor(distantFriday, new Date("2027-08-01T10:00:00Z"));
    expect(slots[0]).toBe(480);
    expect(slots.at(-1)).toBe(1500); // 01:00, soit 02:00 moins une heure
  });

  it("écarte les créneaux qui ne respectent pas le préavis", () => {
    const now = parseLocalDateTime(FRIDAY, "19:00", TZ)!;
    const slots = slotsFor(FRIDAY, now);
    // Préavis d'une heure : 19:30 est trop tôt, 20:00 passe tout juste.
    expect(slots).not.toContain(1170);
    expect(slots[0]).toBeGreaterThanOrEqual(1200);
  });

  it("ne propose rien un jour de fermeture exceptionnelle", () => {
    const closed = [...site.closedDates];
    site.closedDates.push(FRIDAY);
    try {
      expect(serviceWindow(FRIDAY)).toBeNull();
      expect(slotsFor(FRIDAY, new Date("2026-08-01T10:00:00Z"))).toEqual([]);
    } finally {
      site.closedDates.length = 0;
      site.closedDates.push(...closed);
    }
  });
});

describe("instants et retour au service", () => {
  it("place un créneau d'après minuit sur le jour suivant", () => {
    const instant = slotInstant(FRIDAY, 1500)!; // 01:00
    expect(instant.toISOString()).toBe("2026-08-22T00:00:00.000Z"); // 01:00 à Tunis
  });

  it("retrouve la date de service d'un instant d'après minuit", () => {
    const instant = slotInstant(FRIDAY, 1500)!;
    expect(serviceSlotOf(instant)).toEqual({
      serviceDate: FRIDAY,
      minutes: 1500,
    });
  });

  it("retrouve la date de service d'un instant ordinaire", () => {
    const instant = slotInstant(FRIDAY, 1200)!; // 20:00
    expect(serviceSlotOf(instant)).toEqual({
      serviceDate: FRIDAY,
      minutes: 1200,
    });
  });
});

describe("état d'ouverture", () => {
  it("annonce l'heure de fermeture quand c'est ouvert", () => {
    const status = openStatus(parseLocalDateTime(FRIDAY, "21:00", TZ)!);
    expect(status).toEqual({ open: true, closesAt: "02:00" });
  });

  it("annonce la prochaine ouverture quand c'est fermé", () => {
    const status = openStatus(parseLocalDateTime(FRIDAY, "06:00", TZ)!);
    expect(status.open).toBe(false);
    if (!status.open) {
      expect(status.opensAt).toBe("08:00");
      expect(status.today).toBe(true);
    }
  });
});
