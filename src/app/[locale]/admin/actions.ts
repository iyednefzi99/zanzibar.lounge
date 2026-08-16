"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  cancelReservation,
  completeReservation,
  markNoShow,
  seatReservation,
} from "@/lib/reservations";

/**
 * Actions du back-office.
 *
 * Chacune revérifie l'identité par `requireAdmin()`. Le proxy filtre déjà les
 * requêtes vers /{langue}/admin, mais il ne suffit pas : l'identifiant d'une
 * action serveur vaut pour tout le build, et un POST vers une page publique
 * portant l'en-tête `Next-Action` contournerait ce filtre. L'autorisation vit
 * donc là où se produit la mutation.
 *
 * Ces actions restent minces — toute la règle métier vit dans lib/reservations.
 * Elles ne renvoient rien : une action de formulaire React doit résoudre sur
 * `void`. L'issue se lit sur la page, qui est revalidée juste après.
 */

export async function seatAction(formData: FormData): Promise<void> {
  await run(formData, seatReservation);
}

export async function completeAction(formData: FormData): Promise<void> {
  await run(formData, completeReservation);
}

export async function noShowAction(formData: FormData): Promise<void> {
  await run(formData, markNoShow);
}

export async function cancelAction(formData: FormData): Promise<void> {
  await run(formData, (reference) => cancelReservation(reference, "staff"));
}

async function run(
  formData: FormData,
  action: (reference: string) => Promise<{ ok: boolean }>,
): Promise<void> {
  // Avant toute lecture du formulaire : une entrée non autorisée ne doit même
  // pas révéler si la référence existe.
  await requireAdmin();

  const reference = formData.get("reference");
  if (typeof reference !== "string") return;

  const result = await action(reference);
  if (!result.ok) {
    console.warn("[admin] action refusée", { reference });
  }

  revalidatePath("/[locale]/admin", "page");
}
