import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// --- Types ---

export type ExperimentVariant = {
  id: string;
  name: string;
  weight: number;
};

export type Experiment = {
  id: string;
  restaurantId: string;
  name: string;
  variants: ExperimentVariant[];
  status: "draft" | "running" | "paused" | "completed";
  startDate: string | null;
  endDate: string | null;
  createdAt: Date;
};

export type ConversionRecord = {
  id: string;
  experimentId: string;
  variantId: string;
  guestId: string;
  metric: number;
  createdAt: Date;
};

export type ExperimentResults = {
  experimentId: string;
  name: string;
  status: string;
  totalSamples: number;
  variants: VariantResult[];
  winner: string | null;
  confidence: number;
  isSignificant: boolean;
};

export type VariantResult = {
  variantId: string;
  name: string;
  samples: number;
  conversions: number;
  conversionRate: number;
  avgMetric: number;
  ci95Lower: number;
  ci95Upper: number;
};

// --- createExperiment ---

/**
 * Create a new A/B testing experiment.
 */
export async function createExperiment(
  restaurantId: string,
  name: string,
  variants: Array<{ name: string; weight?: number }>,
): Promise<Experiment> {
  if (variants.length < 2) {
    throw new Error("Un experiment nécessite au moins 2 variants");
  }

  const totalWeight = variants.reduce((s, v) => s + (v.weight ?? 1), 0);
  const variantData = variants.map((v, i) => ({
    id: `var_${i}_${Date.now()}`,
    name: v.name,
    weight: (v.weight ?? 1) / totalWeight,
  }));

  const experiment = await db.webhookEndpoint.create({
    data: {
      restaurantId,
      name,
      url: `experiment://${name}`,
      secret: JSON.stringify({ variants: variantData }),
      events: ["experiment.running"],
    },
  });

  logger.info("Experiment created", {
    experimentId: experiment.id,
    name,
    variants: variantData.map((v) => v.name),
  });

  return {
    id: experiment.id,
    restaurantId,
    name,
    variants: variantData,
    status: "draft",
    startDate: null,
    endDate: null,
    createdAt: experiment.createdAt,
  };
}

// --- assignVariant ---

/**
 * Deterministically assign a guest to a variant using consistent hashing.
 */
export async function assignVariant(
  experimentId: string,
  guestId: string,
): Promise<ExperimentVariant | null> {
  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id: experimentId },
  });

  if (!endpoint || !endpoint.secret) return null;

  const config = JSON.parse(endpoint.secret as string) as {
    variants: ExperimentVariant[];
  };
  const { variants } = config;

  if (variants.length === 0) return null;

  // Consistent hash: guestId → deterministic bucket [0, 1)
  const hash = simpleHash(`${experimentId}:${guestId}`);
  const bucket = hash % 1;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant;
  }

  return variants[variants.length - 1];
}

// --- recordConversion ---

/**
 * Record a conversion event for an experiment variant.
 */
export async function recordConversion(
  experimentId: string,
  variantId: string,
  guestId: string,
  metric: number,
): Promise<ConversionRecord> {
  // Store conversion in webhook delivery payload as JSON
  const payload: Record<string, unknown> = {
    variantId,
    guestId,
    metric,
    timestamp: new Date().toISOString(),
  };
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId: experimentId,
      event: "conversion",
      payload: payload as never,
      status: "success",
    },
  });

  logger.info("Conversion recorded", {
    experimentId,
    variantId,
    guestId,
    metric,
  });

  return {
    id: delivery.id,
    experimentId,
    variantId,
    guestId,
    metric,
    createdAt: delivery.createdAt,
  };
}

// --- getExperimentResults ---

/**
 * Compute statistical results for an experiment using z-test for proportions.
 */
export async function getExperimentResults(
  experimentId: string,
): Promise<ExperimentResults> {
  const endpoint = await db.webhookEndpoint.findUnique({
    where: { id: experimentId },
  });

  if (!endpoint) {
    throw new Error(`Experiment ${experimentId} non trouvé`);
  }

  const config = JSON.parse(endpoint.secret as string) as {
    variants: ExperimentVariant[];
  };

  // Fetch all conversions for this experiment
  const deliveries = await db.webhookDelivery.findMany({
    where: { webhookId: experimentId, event: "conversion" },
    orderBy: { createdAt: "asc" },
  });

  const conversions = deliveries.map((d) => {
    const payload = d.payload as Record<string, unknown>;
    return {
      variantId: payload.variantId as string,
      guestId: payload.guestId as string,
      metric: (payload.metric as number) ?? 0,
    };
  });

  // Group by variant
  const variantStats = new Map<
    string,
    { guests: Set<string>; metrics: number[] }
  >();

  for (const v of config.variants) {
    variantStats.set(v.id, { guests: new Set(), metrics: [] });
  }

  for (const c of conversions) {
    const stats = variantStats.get(c.variantId);
    if (stats) {
      stats.guests.add(c.guestId);
      stats.metrics.push(c.metric);
    }
  }

  const variantResults: VariantResult[] = [];
  let totalSamples = 0;

  for (const v of config.variants) {
    const stats = variantStats.get(v.id)!;
    const samples = stats.guests.size;
    const conversionsCount = stats.metrics.length;
    const conversionRate = samples > 0 ? conversionsCount / samples : 0;
    const avgMetric =
      stats.metrics.length > 0
        ? stats.metrics.reduce((s, m) => s + m, 0) / stats.metrics.length
        : 0;

    // 95% CI for proportion (Wald interval)
    const se = samples > 0 ? Math.sqrt((conversionRate * (1 - conversionRate)) / samples) : 0;
    const ci95Lower = Math.max(0, conversionRate - 1.96 * se);
    const ci95Upper = Math.min(1, conversionRate + 1.96 * se);

    variantResults.push({
      variantId: v.id,
      name: v.name,
      samples,
      conversions: conversionsCount,
      conversionRate: Math.round(conversionRate * 1000) / 1000,
      avgMetric: Math.round(avgMetric * 100) / 100,
      ci95Lower: Math.round(ci95Lower * 1000) / 1000,
      ci95Upper: Math.round(ci95Upper * 1000) / 1000,
    });

    totalSamples += samples;
  }

  // Determine winner using z-test (compare first variant vs each other)
  let winner: string | null = null;
  let maxSignificance = 0;
  let isSignificant = false;
  let confidence = 0;

  if (variantResults.length >= 2 && totalSamples >= 30) {
    const control = variantResults[0];

    for (let i = 1; i < variantResults.length; i++) {
      const treatment = variantResults[i];
      const zResult = zTestProportions(
        control.conversions,
        control.samples,
        treatment.conversions,
        treatment.samples,
      );

      if (zResult.significant && zResult.pValue < 0.05) {
        const conf = 1 - zResult.pValue;
        if (conf > maxSignificance) {
          maxSignificance = conf;
          winner = treatment.variantId;
          isSignificant = true;
          confidence = Math.round(conf * 1000) / 10;
        }
      }
    }
  }

  logger.info("Experiment results computed", {
    experimentId,
    totalSamples,
    winner,
    isSignificant,
  });

  return {
    experimentId,
    name: endpoint.name ?? "Experiment",
    status: endpoint.events?.[0]?.replace("experiment.", "") ?? "unknown",
    totalSamples,
    variants: variantResults,
    winner,
    confidence,
    isSignificant,
  };
}

// --- getActiveExperiments ---

/**
 * List all active experiments for a restaurant.
 */
export async function getActiveExperiments(
  restaurantId: string,
): Promise<Experiment[]> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: {
      restaurantId,
      events: { has: "experiment.running" },
    },
    orderBy: { createdAt: "desc" },
  });

  return endpoints.map((ep) => {
    const config = JSON.parse(ep.secret as string) as {
      variants: ExperimentVariant[];
    };
    return {
      id: ep.id,
      restaurantId,
      name: ep.name ?? "Experiment",
      variants: config.variants,
      status: "running",
      startDate: ep.lastDeliveryAt?.toISOString() ?? null,
      endDate: null,
      createdAt: ep.createdAt,
    };
  });
}

// --- Statistical Helpers ---

/**
 * Z-test for two proportions.
 * H0: p1 = p2 (no difference between variants)
 */
function zTestProportions(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
): { z: number; pValue: number; significant: boolean } {
  if (n1 === 0 || n2 === 0) {
    return { z: 0, pValue: 1, significant: false };
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);

  if (pPool === 0 || pPool === 1) {
    return { z: 0, pValue: 1, significant: false };
  }

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) {
    return { z: 0, pValue: 1, significant: false };
  }

  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    z: Math.round(z * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    significant: pValue < 0.05,
  };
}

/**
 * Approximation of the standard normal CDF using the error function.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Simple deterministic hash for consistent variant assignment.
 * Returns a value in [0, 1).
 */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Map to [0, 1)
  return Math.abs(hash) / 2147483647;
}
