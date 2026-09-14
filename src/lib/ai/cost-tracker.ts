import { db } from "@/lib/db";

type CostInput = {
  inputTokens: number;
  outputTokens: number;
};

const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 300, output: 1500 },
  "claude-3-haiku-20240307": { input: 25, output: 125 },
  "gpt-4o": { input: 250, output: 1000 },
  "gpt-4o-mini": { input: 15, output: 60 },
};

function calculateCost(
  model: string,
  input: number,
  output: number,
): number {
  const rates = COST_PER_MILLION[model] ?? { input: 100, output: 500 };
  const inputCost = (input / 1_000_000) * rates.input;
  const outputCost = (output / 1_000_000) * rates.output;
  return Math.ceil((inputCost + outputCost) * 100);
}

export async function trackCost(
  restaurantId: string,
  provider: string,
  model: string,
  input: CostInput,
): Promise<void> {
  const costCents = calculateCost(model, input.inputTokens, input.outputTokens);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await db.aiCostEntry.upsert({
      where: {
        restaurantId_provider_model_date: {
          restaurantId,
          provider,
          model,
          date: today,
        },
      },
      create: {
        restaurantId,
        provider,
        model,
        date: today,
        requestCount: 1,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        costCents,
      },
      update: {
        requestCount: { increment: 1 },
        inputTokens: { increment: input.inputTokens },
        outputTokens: { increment: input.outputTokens },
        costCents: { increment: costCents },
      },
    });
  } catch (error) {
    console.error("Failed to track AI cost:", error);
  }
}

export async function getCostSummary(
  restaurantId: string,
  days?: number,
) {
  const since = new Date();
  since.setDate(since.getDate() - (days ?? 30));

  const entries = await db.aiCostEntry.findMany({
    where: {
      restaurantId,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  });

  const totalCost = entries.reduce((sum, e) => sum + e.costCents, 0);
  const totalRequests = entries.reduce((sum, e) => sum + e.requestCount, 0);
  const totalInputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0);
  const totalOutputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0);

  return {
    totalCostCents: totalCost,
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    entries,
  };
}
