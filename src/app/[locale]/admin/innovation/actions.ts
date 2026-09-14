"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function resolveMaintenanceAlertAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const alertId = formData.get("alertId");
  if (typeof alertId !== "string") return;

  await db.maintenanceAlert.update({
    where: { id: alertId },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  revalidatePath("/[locale]/admin/innovation", "page");
}

export async function toggleSocialProofEventAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const eventId = formData.get("eventId");
  if (typeof eventId !== "string") return;

  const event = await db.socialProofEvent.findUnique({
    where: { id: eventId },
    select: { active: true },
  });
  if (!event) return;

  await db.socialProofEvent.update({
    where: { id: eventId },
    data: { active: !event.active },
  });

  revalidatePath("/[locale]/admin/innovation", "page");
}
