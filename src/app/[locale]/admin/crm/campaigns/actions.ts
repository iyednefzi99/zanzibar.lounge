"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import {
  createCampaign,
  updateCampaign,
  sendCampaign,
} from "@/lib/crm/campaigns";

export async function createNewCampaign(data: {
  name: string;
  type: string;
  subject?: string;
  content: string;
}) {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  return createCampaign(restaurantId, {
    name: data.name,
    type: data.type as "email" | "sms" | "push" | "whatsapp",
    subject: data.subject,
    content: data.content,
  });
}

export async function updateExistingCampaign(
  campaignId: string,
  data: { name?: string; subject?: string; content?: string },
) {
  await requireAdmin();
  return updateCampaign(campaignId, data);
}

export async function sendCampaignById(campaignId: string) {
  await requireAdmin();
  return sendCampaign(campaignId);
}
