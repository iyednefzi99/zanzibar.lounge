type AiProviderConfig = {
  provider: string;
  model: string;
  fallbackProvider?: string | null;
  fallbackModel?: string | null;
};

export async function withFallback<T>(
  config: AiProviderConfig,
  fn: (provider: string, model: string) => Promise<T>,
): Promise<T> {
  try {
    return await fn(config.provider, config.model);
  } catch (primaryError) {
    if (!config.fallbackProvider || !config.fallbackModel) {
      throw primaryError;
    }

    console.warn(
      `Primary AI provider ${config.provider} failed, falling back to ${config.fallbackProvider}`,
      primaryError,
    );

    try {
      return await fn(config.fallbackProvider, config.fallbackModel);
    } catch (fallbackError) {
      console.error("Fallback AI provider also failed:", fallbackError);
      throw primaryError;
    }
  }
}
