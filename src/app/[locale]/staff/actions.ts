"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { authenticateStaff } from "@/lib/staff-auth";
import { createStaffSession, destroyStaffSession } from "@/lib/staff-session";
import {
  seatReservation,
  completeReservation,
  cancelReservation,
} from "@/lib/reservations";
import { updateOrderStatus } from "@/lib/orders";
import { getDefaultRestaurantId } from "@/lib/restaurant";

// ─── Auth ───────────────────────────────────────────────────────────

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Identifiants requis" };
  }

  const restaurantId = await getDefaultRestaurantId();
  const staff = await authenticateStaff(restaurantId, email, password);
  if (!staff) {
    return { error: "Email ou mot de passe incorrect" };
  }

  await createStaffSession(staff.id, restaurantId);
  return null;
}

export async function logoutAction(): Promise<void> {
  await destroyStaffSession();
}

// ─── Reservations ──────────────────────────────────────────────────

const RESERVATION_TRANSITIONS = {
  seat: seatReservation,
  complete: completeReservation,
  cancel: (ref: string) => cancelReservation(ref, "staff"),
} as const;

export async function reservationAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  await requireAdmin();

  const reference = formData.get("reference");
  const action = formData.get("action");
  if (typeof reference !== "string" || typeof action !== "string") {
    return { error: "Paramètres invalides" };
  }

  const handler =
    RESERVATION_TRANSITIONS[action as keyof typeof RESERVATION_TRANSITIONS];
  if (!handler) return { error: "Action inconnue" };

  const result = await handler(reference);
  if (!result.ok) {
    return { error: "Impossible d'effectuer cette action" };
  }

  revalidatePath("/[locale]/staff", "page");
  revalidatePath("/[locale]/staff/reservations", "page");
  return null;
}

// ─── Orders ────────────────────────────────────────────────────────

const ORDER_VALID = ["PREPARING", "READY", "COMPLETED"] as const;

export async function orderStatusAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  await requireAdmin();

  const orderId = formData.get("orderId");
  const nextStatus = formData.get("nextStatus");
  if (typeof orderId !== "string" || typeof nextStatus !== "string") {
    return { error: "Paramètres invalides" };
  }

  if (!(ORDER_VALID as readonly string[]).includes(nextStatus)) {
    return { error: "Statut invalide" };
  }

  const result = await updateOrderStatus(
    orderId,
    nextStatus as (typeof ORDER_VALID)[number],
  );
  if (!result.ok) {
    return { error: "Impossible de mettre à jour la commande" };
  }

  revalidatePath("/[locale]/staff", "page");
  revalidatePath("/[locale]/staff/orders", "page");
  return null;
}

export async function cancelOrderAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  await requireAdmin();

  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") {
    return { error: "Paramètres invalides" };
  }

  const result = await updateOrderStatus(orderId, "CANCELLED");
  if (!result.ok) {
    return { error: "Impossible d'annuler la commande" };
  }

  revalidatePath("/[locale]/staff", "page");
  revalidatePath("/[locale]/staff/orders", "page");
  return null;
}

// ─── QR Scan ───────────────────────────────────────────────────────

export async function scanCheckinAction(
  _prev: { error: string; reference?: string } | null,
  formData: FormData,
): Promise<{ error: string; reference?: string } | null> {
  await requireAdmin();

  const reference = formData.get("reference");
  if (typeof reference !== "string") {
    return { error: "Référence invalide" };
  }

  const result = await seatReservation(reference);
  if (!result.ok) {
    return { error: "Réservation non trouvée ou statut invalide", reference };
  }

  revalidatePath("/[locale]/staff", "page");
  revalidatePath("/[locale]/staff/reservations", "page");
  revalidatePath("/[locale]/staff/scan", "page");
  return null;
}
