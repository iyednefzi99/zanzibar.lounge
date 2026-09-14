import { db } from "@/lib/db";

type AiConfigInput = {
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  dailyBudgetCents?: number;
  monthlyBudgetCents?: number;
  enabled?: boolean;
  fallbackProvider?: string;
  fallbackModel?: string;
};

export async function getConfig(restaurantId: string) {
  return db.aiConfig.findUnique({ where: { restaurantId } });
}

export async function upsertConfig(
  restaurantId: string,
  input: AiConfigInput,
) {
  return db.aiConfig.upsert({
    where: { restaurantId },
    create: { restaurantId, ...input },
    update: input,
  });
}
