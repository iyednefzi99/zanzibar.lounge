import { describe, expect, it } from "vitest";

import { formatPhone, maskPhone, normalizePhone } from "@/lib/phone";

describe("normalisation des numéros", () => {
  it("accepte les formes qu'un client écrit vraiment", () => {
    const expected = "+21620123456";
    for (const input of [
      "+216 20 123 456",
      "+216-20-12-34-56",
      "0021620123456",
      "20123456",
      "20 123 456",
      "  +21620123456  ",
    ]) {
      expect(normalizePhone(input)).toBe(expected);
    }
  });

  it("retire le zéro national", () => {
    expect(normalizePhone("020123456")).toBe("+21620123456");
  });

  it("laisse intacts les numéros étrangers", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
  });

  it("refuse ce qui ne peut pas être un numéro", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("bonsoir")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("+1234567890123456789")).toBeNull();
  });
});

describe("affichage", () => {
  it("aère un numéro tunisien", () => {
    expect(formatPhone("+21620123456")).toBe("+216 20 123 456");
  });

  it("masque le milieu pour les journaux", () => {
    const masked = maskPhone("+21620123456");
    expect(masked.startsWith("+216")).toBe(true);
    expect(masked.endsWith("456")).toBe(true);
    expect(masked).not.toContain("20123");
  });
});
