import { env } from "@/lib/env";

type CacheOptions = {
  ttl?: number; // seconds
};

let redisAvailable = true;

async function redisCommand(command: string[], ttl?: number): Promise<unknown> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN || !redisAvailable) {
    return null;
  }

  try {
    const response = await fetch(env.UPSTASH_REDIS_REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      redisAvailable = false;
      return null;
    }

    const data = await response.json();
    return data.result;
  } catch {
    redisAvailable = false;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redisCommand(["GET", key]);
  if (!data || typeof data !== "string") return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = 300): Promise<void> {
  const serialized = JSON.stringify(value);
  await redisCommand(["SETEX", key, String(ttl), serialized]);
}

export async function cacheDel(key: string): Promise<void> {
  await redisCommand(["DEL", key]);
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const keys = await redisCommand(["KEYS", pattern]);
  if (Array.isArray(keys) && keys.length > 0) {
    await redisCommand(["DEL", ...keys]);
  }
}

export function cacheKey(...parts: string[]): string {
  return parts.join(":");
}

// Cached fetch wrapper
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { ttl = 300 } = options;

  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  await cacheSet(key, data, ttl);
  return data;
}
