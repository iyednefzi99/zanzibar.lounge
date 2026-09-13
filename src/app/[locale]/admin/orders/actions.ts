"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/orders";

export async function advanceStatusAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const orderId = formData.get("orderId");
  const nextStatus = formData.get("nextStatus");
  if (typeof orderId !== "string" || typeof nextStatus !== "string") return;

  await updateOrderStatus(orderId, nextStatus as "PREPARING" | "READY" | "COMPLETED");
  revalidatePath("/[locale]/admin/orders", "page");
}

export async function cancelOrderAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return;

  await updateOrderStatus(orderId, "CANCELLED");
  revalidatePath("/[locale]/admin/orders", "page");
}
