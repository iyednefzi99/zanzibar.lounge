/**
 * Limitation de débit, partagée entre instances quand c'est possible.
 *
 * Deux implantations derrière la même interface :
 *
 * - **Upstash Redis**, dès que `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
 *   sont présents. Le compteur est alors commun à toutes les instances, ce qui
 *   est la seule façon d'avoir une vraie limite en serverless.
 * - **En mémoire** sinon. Suffisant en développement et sur une instance unique ;
 *   sur plusieurs instances, chacune a son compteur et la limite réelle est
 *   multipliée d'autant.
 *
 * L'appel se fait par l'API REST d'Upstash plutôt que par son SDK : deux requêtes
 * `fetch`, aucune dépendance supplémentaire, et cela fonctionne sur l'Edge comme
 * sous Node.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Secondes avant réinitialisation. */
  retryAfter: number;
  remaining: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Vrai si les compteurs sont partagés entre instances. */
export const isShared = Boolean(REDIS_URL && REDIS_TOKEN);

/**
 * Consomme un jeton. À appeler une fois par tentative — ou, pour les échecs
 * d'authentification, une fois par échec seulement.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (isShared) {
    const shared = await redisIncrement(key, windowMs);
    if (shared) {
      const retryAfter = Math.max(1, shared.ttl);
      return shared.count > limit
        ? { allowed: false, retryAfter, remaining: 0 }
        : { allowed: true, retryAfter, remaining: limit - shared.count };
    }
    // Redis injoignable : on retombe sur le compteur local plutôt que d'ouvrir
    // grand la porte.
  }

  return memoryIncrement(key, limit, windowMs);
}

/**
 * Consulte l'état sans consommer de jeton. Utile avant une vérification
 * d'identifiants : on veut bloquer *avant* de comparer, sinon l'attaquant garde
 * un nombre illimité d'essais.
 */
export async function isRateLimited(
  key: string,
  limit: number,
): Promise<{ blocked: boolean; retryAfter: number }> {
  if (isShared) {
    const shared = await redisPeek(key);
    if (shared) {
      return {
        blocked: shared.count > limit,
        retryAfter: Math.max(1, shared.ttl),
      };
    }
  }

  const bucket = buckets.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt <= now) return { blocked: false, retryAfter: 0 };

  return {
    blocked: bucket.count > limit,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Remet le compteur à zéro — après une authentification réussie, par exemple. */
export async function clearRateLimit(key: string): Promise<void> {
  buckets.delete(key);
  if (isShared) await redisCommand([["DEL", key]]);
}

/** Adresse de l'appelant, en tenant compte des en-têtes de proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "inconnu";
}

// --------------------------------------------------------------------------
// Compteur local
// --------------------------------------------------------------------------

function memoryIncrement(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  bucket.count += 1;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);

  return bucket.count > limit
    ? { allowed: false, retryAfter, remaining: 0 }
    : { allowed: true, retryAfter, remaining: limit - bucket.count };
}

let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// --------------------------------------------------------------------------
// Compteur partagé (Upstash REST)
// --------------------------------------------------------------------------

type RedisReply = Array<{ result?: unknown; error?: string }>;

async function redisCommand(commands: unknown[][]): Promise<RedisReply | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;

  try {
    const response = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
      // Un compteur indisponible ne doit pas faire attendre le client.
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) return null;
    return (await response.json()) as RedisReply;
  } catch {
    return null;
  }
}

async function redisIncrement(
  key: string,
  windowMs: number,
): Promise<{ count: number; ttl: number } | null> {
  const seconds = Math.ceil(windowMs / 1000);
  // `EXPIRE … NX` ne pose l'expiration qu'à la création : la fenêtre est fixe
  // et ne se prolonge pas à chaque requête.
  const reply = await redisCommand([
    ["INCR", key],
    ["EXPIRE", key, seconds, "NX"],
    ["TTL", key],
  ]);
  if (!reply) return null;

  const count = Number(reply[0]?.result);
  const ttl = Number(reply[2]?.result);
  if (!Number.isFinite(count)) return null;

  return { count, ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : seconds };
}

async function redisPeek(
  key: string,
): Promise<{ count: number; ttl: number } | null> {
  const reply = await redisCommand([
    ["GET", key],
    ["TTL", key],
  ]);
  if (!reply) return null;

  const raw = reply[0]?.result;
  const count = raw === null || raw === undefined ? 0 : Number(raw);
  const ttl = Number(reply[1]?.result);

  return {
    count: Number.isFinite(count) ? count : 0,
    ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 0,
  };
}
