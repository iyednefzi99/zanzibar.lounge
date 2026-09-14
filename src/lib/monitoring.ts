import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const startTime = Date.now();

type MetricTags = Record<string, string | number | boolean>;

interface MetricEntry {
  name: string;
  value: number;
  tags?: MetricTags;
  timestamp: string;
}

const metricsBuffer: MetricEntry[] = [];
const FLUSH_INTERVAL_MS = 30_000;
let lastFlush = Date.now();

function flushMetrics(): void {
  if (metricsBuffer.length === 0) return;
  const now = Date.now();
  if (now - lastFlush < FLUSH_INTERVAL_MS) return;
  lastFlush = now;

  const batch = metricsBuffer.splice(0);
  logger.info("metrics.flush", {
    count: batch.length,
    metrics: batch,
  });
}

export function trackMetric(
  name: string,
  value: number,
  tags?: MetricTags,
): void {
  metricsBuffer.push({
    name,
    value,
    tags,
    timestamp: new Date().toISOString(),
  });
  flushMetrics();
}

export async function getDbHealth(): Promise<{
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: performance.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: "error", latencyMs: performance.now() - start, error: message };
  }
}

export function getMemoryUsage(): {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
} {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
  };
}

export async function healthCheck(): Promise<{
  status: "healthy" | "unhealthy";
  version: string;
  uptime: number;
  db: { status: "ok" | "error"; latencyMs: number; error?: string };
  memory: ReturnType<typeof getMemoryUsage>;
}> {
  const [dbHealth] = await Promise.all([getDbHealth()]);

  const status = dbHealth.status === "ok" ? "healthy" : "unhealthy";

  return {
    status,
    version: process.env.npm_package_version ?? "unknown",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    db: dbHealth,
    memory: getMemoryUsage(),
  };
}
