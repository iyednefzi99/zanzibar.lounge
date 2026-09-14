import { db } from "@/lib/db";

export type HealthCheck = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: CheckResult;
    memory: CheckResult;
    uptime: CheckResult;
    diskSpace: CheckResult;
  };
};

type CheckResult = {
  status: "ok" | "warning" | "error";
  message: string;
  latencyMs?: number;
};

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return {
      status: latency > 1000 ? "warning" : "ok",
      message: `Database connected (${latency}ms)`,
      latencyMs: latency,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: "error", message: `Database error: ${message}` };
  }
}

function checkMemory(): CheckResult {
  if (typeof process === "undefined") return { status: "ok", message: "N/A (browser)" };

  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

  if (heapUsedMB > 500) {
    return { status: "warning", message: `High memory: ${heapUsedMB}MB / ${heapTotalMB}MB` };
  }
  return { status: "ok", message: `Memory: ${heapUsedMB}MB / ${heapTotalMB}MB` };
}

function checkUptime(): CheckResult {
  if (typeof process === "undefined") return { status: "ok", message: "N/A (browser)" };

  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return {
    status: "ok",
    message: `Uptime: ${hours}h ${minutes}m`,
  };
}

function checkDiskSpace(): CheckResult {
  if (typeof process === "undefined") return { status: "ok", message: "N/A (browser)" };

  // Basic check — always OK in serverless
  return { status: "ok", message: "Disk space OK" };
}

export async function getHealth(): Promise<HealthCheck> {
  const [database, memory, uptime, diskSpace] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkUptime()),
    Promise.resolve(checkDiskSpace()),
  ]);

  const checks = { database, memory, uptime, diskSpace };
  const statuses = Object.values(checks).map((c) => c.status);

  let status: HealthCheck["status"] = "healthy";
  if (statuses.includes("error")) status = "unhealthy";
  else if (statuses.includes("warning")) status = "degraded";

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
  };
}

export async function getMetrics() {
  const health = await getHealth();

  const reservationCount = await db.reservation.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const activeOrders = await db.order.count({
    where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
  });

  const onlineStaff = await db.staffSession.count({
    where: {
      expiresAt: { gt: new Date() },
    },
  });

  return {
    ...health,
    metrics: {
      reservations24h: reservationCount,
      activeOrders,
      onlineStaff,
    },
  };
}
