import { db } from "@/lib/db";

export type CampaignData = {
  name: string;
  type: "email" | "sms" | "push" | "whatsapp";
  subject?: string;
  content: string;
  targetSegment?: Record<string, string>;
  scheduledAt?: Date;
};

export async function createCampaign(restaurantId: string, data: CampaignData) {
  return db.campaign.create({
    data: {
      restaurantId,
      name: data.name,
      type: data.type,
      subject: data.subject,
      content: data.content,
      targetSegment: (data.targetSegment as unknown as Record<string, string>) ?? undefined,
      scheduledAt: data.scheduledAt,
    },
  });
}

export async function updateCampaign(
  campaignId: string,
  data: Partial<CampaignData>,
) {
  return db.campaign.update({
    where: { id: campaignId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.subject && { subject: data.subject }),
      ...(data.content && { content: data.content }),
      ...(data.targetSegment && { targetSegment: data.targetSegment as unknown as Record<string, string> }),
      ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
    },
  });
}

export async function deleteCampaign(campaignId: string) {
  return db.campaign.delete({ where: { id: campaignId } });
}

export async function getCampaigns(restaurantId: string) {
  return db.campaign.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCampaignById(campaignId: string) {
  return db.campaign.findUnique({ where: { id: campaignId } });
}

export async function sendCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");

  // Get target guests based on segment
  const guests = await db.guest.findMany({
    where: {
      reservations: { some: { restaurantId: campaign.restaurantId, status: "COMPLETED" } },
      ...(campaign.type === "email" ? { profile: { emailOptIn: true } } : {}),
      optedOut: false,
    },
    take: 1000,
  });

  // Create delivery records
  const deliveries = guests.map((g) => ({
    campaignId,
    guestId: g.id,
    channel: campaign.type,
    status: "sent" as const,
    sentAt: new Date(),
  }));

  if (deliveries.length > 0) {
    await db.campaignDelivery.createMany({ data: deliveries });
  }

  // Update campaign stats
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sent",
      sentAt: new Date(),
      sentCount: deliveries.length,
    },
  });

  return { sent: deliveries.length };
}

export async function getCampaignStats(campaignId: string) {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;

  const deliveries = await db.campaignDelivery.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: true,
  });

  const statusCounts = Object.fromEntries(
    deliveries.map((d) => [d.status, d._count]),
  );

  return {
    campaign,
    sent: statusCounts["sent"] ?? 0,
    delivered: statusCounts["delivered"] ?? 0,
    opened: statusCounts["opened"] ?? 0,
    clicked: statusCounts["clicked"] ?? 0,
    failed: statusCounts["failed"] ?? 0,
    openRate: campaign.sentCount > 0 ? ((statusCounts["opened"] ?? 0) / campaign.sentCount) * 100 : 0,
    clickRate: campaign.sentCount > 0 ? ((statusCounts["clicked"] ?? 0) / campaign.sentCount) * 100 : 0,
  };
}
