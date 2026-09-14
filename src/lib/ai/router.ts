import { getConfig } from "./config";
import { logAiAudit } from "./audit";
import { trackCost } from "./cost-tracker";
import { withFallback } from "./fallback";

export type AiRouteResult = {
  content: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export async function routeAiRequest(
  restaurantId: string,
  operation: string,
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<AiRouteResult> {
  const config = await getConfig(restaurantId);
  if (!config || !config.enabled) {
    throw new Error("AI is disabled for this restaurant");
  }

  const startTime = Date.now();

  const result = await withFallback(
    config,
    async (provider, model) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: options?.maxTokens ?? config.maxTokens,
          temperature: options?.temperature ?? config.temperature,
          messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status}`);
      }

      const data = await res.json();
      return {
        content: data.content?.[0]?.text ?? "",
        provider,
        model,
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      };
    },
  );

  const latencyMs = Date.now() - startTime;

  await Promise.all([
    logAiAudit(restaurantId, {
      provider: result.provider,
      model: result.model,
      operation,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs,
      success: true,
    }),
    trackCost(restaurantId, result.provider, result.model, {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    }),
  ]);

  return { ...result, latencyMs };
}
