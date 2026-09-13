"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { sendStaffMessage, closeConversation } from "@/lib/chat";

export async function sendMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const conversationId = formData.get("conversationId");
  const body = formData.get("body");
  if (typeof conversationId !== "string" || typeof body !== "string") return;
  if (!body.trim()) return;

  await sendStaffMessage(conversationId, body.trim());
  revalidatePath("/[locale]/admin/chat", "page");
}

export async function closeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string") return;

  await closeConversation(conversationId);
  revalidatePath("/[locale]/admin/chat", "page");
}
