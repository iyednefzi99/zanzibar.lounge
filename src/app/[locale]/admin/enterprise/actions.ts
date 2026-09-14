"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function createPropertyGroupAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const name = formData.get("name");
  const slug = formData.get("slug");
  const ownerEmail = formData.get("ownerEmail");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Nom requis" };
  }
  if (typeof slug !== "string" || !slug.trim()) {
    return { error: "Slug requis" };
  }
  if (typeof ownerEmail !== "string" || !ownerEmail.trim()) {
    return { error: "Email propriétaire requis" };
  }

  const existing = await db.propertyGroup.findUnique({
    where: { slug: slug.trim().toLowerCase() },
  });
  if (existing) {
    return { error: "Ce slug existe déjà" };
  }

  await db.propertyGroup.create({
    data: {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      ownerEmail: ownerEmail.trim(),
    },
  });

  revalidatePath("/[locale]/admin/enterprise", "page");
  return {};
}

export async function deletePropertyGroupAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const groupId = formData.get("groupId");
  if (typeof groupId !== "string") return;

  await db.propertyGroup.delete({ where: { id: groupId } });
  revalidatePath("/[locale]/admin/enterprise", "page");
}
