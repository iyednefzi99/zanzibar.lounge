import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantBySlug } from "@/lib/saas";

import { getStripePortalUrl, getCheckoutUrl } from "../actions";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function OwnerBillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  if (!(await isAdminOrOwner())) notFound();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) notFound();

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <BillingClient
      restaurant={restaurant}
      getPortalUrlAction={getStripePortalUrl}
      getCheckoutUrlAction={getCheckoutUrl}
    />
  );
}

async function isAdminOrOwner(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
