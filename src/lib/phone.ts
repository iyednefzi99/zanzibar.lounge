/**
 * Normalisation des numéros au format E.164.
 *
 * Un même client écrit « 20 123 456 », « 0020123456 » ou « +216 20-12-34-56 » :
 * il faut que ce soit le même enregistrement, sinon on lui perd sa réservation
 * dès qu'il change de canal.
 */

const TUNISIA_CC = "216";

export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // On conserve un « + » de tête et on jette tout le reste du décor.
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (!hasPlus) {
    // 00 en préfixe international, comme on le compose depuis un fixe.
    if (digits.startsWith("00")) {
      digits = digits.slice(2);
    } else if (digits.length === 8) {
      // Numéro tunisien local.
      digits = TUNISIA_CC + digits;
    } else if (digits.startsWith("0") && digits.length === 9) {
      digits = TUNISIA_CC + digits.slice(1);
    }
  }

  if (digits.length < 8 || digits.length > 15) return null;

  return `+${digits}`;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** Affichage lisible : +216 20 123 456. */
export function formatPhone(e164: string): string {
  if (e164.startsWith(`+${TUNISIA_CC}`) && e164.length === 12) {
    const national = e164.slice(4);
    return `+${TUNISIA_CC} ${national.slice(0, 2)} ${national.slice(
      2,
      5,
    )} ${national.slice(5)}`;
  }
  return e164;
}

/** Masque un numéro pour les journaux : +216 •• ••• 456. */
export function maskPhone(e164: string): string {
  if (e164.length < 5) return "•".repeat(e164.length);
  return `${e164.slice(0, 4)}${"•".repeat(e164.length - 7)}${e164.slice(-3)}`;
}
