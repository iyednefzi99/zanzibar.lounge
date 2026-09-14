"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  createStaff,
  deactivateStaff,
  updateStaffRole,
} from "@/lib/staff-auth";
import {
  createCheckoutSessionForPlan,
  createStripePortalSession,
  getRestaurantBySlug,
} from "@/lib/saas";

// ─── Settings ────────────────────────────────────────────────────────

export async function updateRestaurantSettings(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) return;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return;

  const name = formData.get("name");
  const address = formData.get("address");
  const phone = formData.get("phone");
  const timezone = formData.get("timezone");
  const locale = formData.get("locale");
  const logoUrl = formData.get("logoUrl");
  const brandColor = formData.get("brandColor");
  const customDomain = formData.get("customDomain");

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      address:
        typeof address === "string" ? (address.trim() || null) : undefined,
      phone: typeof phone === "string" ? (phone.trim() || null) : undefined,
      timezone:
        typeof timezone === "string" && timezone.trim()
          ? timezone.trim()
          : undefined,
      locale: typeof locale === "string" && locale.trim() ? locale.trim() : undefined,
      logoUrl:
        typeof logoUrl === "string" ? (logoUrl.trim() || null) : undefined,
      brandColor:
        typeof brandColor === "string"
          ? (brandColor.trim() || null)
          : undefined,
      customDomain:
        typeof customDomain === "string"
          ? (customDomain.trim() || null)
          : undefined,
    },
  });

  revalidatePath("/[locale]/owner/settings", "page");
  revalidatePath("/[locale]/owner", "page");
}

// ─── Team ────────────────────────────────────────────────────────────

export async function addTeamMember(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) return { ok: false, error: "Configuration manquante" };

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false, error: "Restaurant introuvable" };

  const email = formData.get("email");
  const name = formData.get("name");
  const password = formData.get("password");
  const role = formData.get("role");

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return {
      ok: false,
      error: "Email, nom et mot de passe (8 car. min) requis",
    };
  }

  try {
    await createStaff({
      restaurantId: restaurant.id,
      email: email.trim(),
      name: name.trim(),
      password,
      role: typeof role === "string" ? role : "STAFF",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return { ok: false, error: "Cet email est déjà utilisé" };
    }
    return { ok: false, error: "Erreur lors de la création" };
  }

  revalidatePath("/[locale]/owner/team", "page");
  return { ok: true };
}

export async function changeStaffRole(
  staffId: string,
  role: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    await updateStaffRole(staffId, role);
  } catch {
    return { ok: false, error: "Membre introuvable" };
  }

  revalidatePath("/[locale]/owner/team", "page");
  return { ok: true };
}

export async function deactivateTeamMember(
  staffId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    await deactivateStaff(staffId);
  } catch {
    return { ok: false, error: "Membre introuvable" };
  }

  revalidatePath("/[locale]/owner/team", "page");
  return { ok: true };
}

// ─── Billing ─────────────────────────────────────────────────────────

export async function getStripePortalUrl(): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  await requireAdmin();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) return { ok: false, error: "Configuration manquante" };

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false, error: "Restaurant introuvable" };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const url = await createStripePortalSession(
      restaurant.id,
      `${origin}/owner/billing`,
    );
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Pas de portail Stripe configuré" };
  }
}

export async function getCheckoutUrl(
  plan: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireAdmin();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) return { ok: false, error: "Configuration manquante" };

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false, error: "Restaurant introuvable" };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { url } = await createCheckoutSessionForPlan(
      restaurant.id,
      plan,
      `${origin}/owner/billing`,
      `${origin}/owner/billing`,
    );
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Impossible de créer la session de paiement" };
  }
}
