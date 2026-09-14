/**
 * Performance utilities — no external dependencies.
 *
 * Provides measurement, caching, batching, debouncing, and throttling.
 * All functions are framework-agnostic and work on both server and client.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

let lastCacheSweep = 0;
const CACHE_SWEEP_INTERVAL = 60_000;

function sweepCache(now: number): void {
  if (now - lastCacheSweep < CACHE_SWEEP_INTERVAL) return;
  lastCacheSweep = now;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

/**
 * Measure execution time of an async function. Returns both the result and
 * the duration in milliseconds.
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log(`[perf] ${name}: ${durationMs.toFixed(1)}ms`);
  }

  return { result, durationMs };
}

/**
 * In-memory cache with TTL. Returns cached value if still fresh, otherwise
 * calls `fn`, stores the result, and returns it.
 */
export async function cacheResponse<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  sweepCache(now);

  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) return entry.value;

  const value = await fn();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/**
 * Batch an array of request functions and execute them in groups of
 * `batchSize`, waiting `delayMs` between each batch. Returns results in
 * the same order as the input requests.
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number,
  delayMs: number,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);

    if (i + batchSize < requests.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Debounce: delays execution until `ms` milliseconds have passed since the
 * last call. The returned function resolves with the result of `fn`.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolvePending: ((value: Awaited<ReturnType<T>>) => void) | null = null;

  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise((resolve) => {
      if (timer) clearTimeout(timer);
      resolvePending = resolve;
      timer = setTimeout(async () => {
        const result = await fn(...args);
        resolvePending?.(result as Awaited<ReturnType<T>>);
        resolvePending = null;
        timer = null;
      }, ms);
    });
  };
}

/**
 * Throttle: ensures `fn` is called at most once every `ms` milliseconds.
 * The first call is immediate; subsequent calls within the window are
 * batched and the latest arguments win.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed >= ms) {
      lastCall = now;
      fn(...args);
    } else {
      pendingArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          lastCall = Date.now();
          timer = null;
          if (pendingArgs) {
            fn(...pendingArgs);
            pendingArgs = null;
          }
        }, ms - elapsed);
      }
    }
  };
}

/**
 * Clear all cached entries. Useful in tests or when invalidation is needed.
 */
export function clearCache(): void {
  cache.clear();
}
