import { describe, expect, it } from "vitest";

import {
  addDays,
  fromZoned,
  hmToMinutes,
  minutesToHM,
  parseLocalDateTime,
  toHM,
  toISODate,
  toZoned,
  weekdayOf,
} from "@/lib/time";

const TZ = "Africa/Tunis"; // UTC+1, sans heure d'été

describe("conversions de fuseau", () => {
  it("place une heure locale au bon instant UTC", () => {
    const instant = parseLocalDateTime("2026-08-21", "20:00", TZ);
    expect(instant?.toISOString()).toBe("2026-08-21T19:00:00.000Z");
  });

  it("fait l'aller-retour sans dérive", () => {
    const instant = parseLocalDateTime("2026-08-21", "20:30", TZ)!;
    expect(toISODate(instant, TZ)).toBe("2026-08-21");
    expect(toHM(instant, TZ)).toBe("20:30");
  });

  it("rend minuit comme 00:00 et non 24:00", () => {
    const instant = parseLocalDateTime("2026-08-21", "00:00", TZ)!;
    expect(toZoned(instant, TZ).hour).toBe(0);
    expect(toHM(instant, TZ)).toBe("00:00");
  });

  it("refuse une date qui n'existe pas", () => {
    expect(parseLocalDateTime("2026-02-31", "20:00", TZ)).toBeNull();
    expect(parseLocalDateTime("2026-13-01", "20:00", TZ)).toBeNull();
  });

  it("refuse une heure hors bornes ou mal formée", () => {
    expect(parseLocalDateTime("2026-08-21", "25:00", TZ)).toBeNull();
    expect(parseLocalDateTime("2026-08-21", "20:99", TZ)).toBeNull();
    expect(parseLocalDateTime("21-08-2026", "20:00", TZ)).toBeNull();
  });

  it("recompose une date-heure locale depuis ses éléments", () => {
    const instant = fromZoned(
      { year: 2026, month: 8, day: 21, hour: 20, minute: 0 },
      TZ,
    );
    expect(instant.toISOString()).toBe("2026-08-21T19:00:00.000Z");
  });
});

describe("minutes et affichage", () => {
  it("lit une fermeture après minuit comme un dépassement de 24 h", () => {
    expect(hmToMinutes("08:00")).toBe(480);
    expect(hmToMinutes("26:00")).toBe(1560);
  });

  it("ramène les minutes au-delà de 24 h dans la journée", () => {
    expect(minutesToHM(1560)).toBe("02:00");
    expect(minutesToHM(1500)).toBe("01:00");
    expect(minutesToHM(1200)).toBe("20:00");
    expect(minutesToHM(0)).toBe("00:00");
  });
});

describe("calendrier", () => {
  it("franchit les fins de mois et d'année", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("numérote les jours à partir de dimanche", () => {
    expect(weekdayOf("2026-08-16")).toBe(0); // dimanche
    expect(weekdayOf("2026-08-21")).toBe(5); // vendredi
    expect(weekdayOf("2026-08-22")).toBe(6); // samedi
  });
});
