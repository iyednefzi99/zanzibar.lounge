import { db } from "@/lib/db";

type AuditInput = {
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export async function logAiAudit(
  restaurantId: string,
  input: AuditInput,
): Promise<void> {
  try {
    await db.aiAuditLog.create({
      data: {
        restaurantId,
        ...input,
        metadata: input.metadata ? (input.metadata as never) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log AI audit:", error);
  }
}

export async function getAuditLogs(
  restaurantId: string,
  options?: { limit?: number; offset?: number; operation?: string },
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return db.aiAuditLog.findMany({
    where: {
      restaurantId,
      ...(options?.operation ? { operation: options.operation } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
