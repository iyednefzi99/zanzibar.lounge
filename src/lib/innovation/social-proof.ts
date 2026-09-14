import { type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function createSocialProofEvent(restaurantId: string, type: string, payload: Record<string, unknown>) {
  return db.socialProofEvent.create({
    data: { restaurantId, type, payload: payload as unknown as Prisma.InputJsonValue },
  });
}

export async function getActiveSocialProof(restaurantId: string, options?: { type?: string; limit?: number }) {
  return db.socialProofEvent.findMany({
    where: {
      restaurantId,
      active: true,
      ...(options?.type ? { type: options.type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 20,
  });
}

export async function toggleSocialProof(id: string, active: boolean) {
  return db.socialProofEvent.update({
    where: { id },
    data: { active },
  });
}
