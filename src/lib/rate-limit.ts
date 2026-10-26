import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = { success: boolean; limit: number; remaining: number; reset: number };

let limiter: Ratelimit | null = null;

function getLimiter() {
  if (limiter) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Shared rate limiting is not configured.");
    }
    return null;
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "amebo-n-tech:admin-login",
    analytics: true
  });
  return limiter;
}

const devBuckets = new Map<string, { count: number; reset: number }>();

export async function limitAdminLogin(identifier: string): Promise<RateLimitResult> {
  const configured = getLimiter();
  if (configured) {
    return configured.limit(identifier);
  }

  // Local fallback only. Production must use the shared Redis limiter above.
  const now = Date.now();
  const current = devBuckets.get(identifier);
  if (!current || current.reset <= now) {
    const bucket = { count: 1, reset: now + 15 * 60 * 1000 };
    devBuckets.set(identifier, bucket);
    return { success: true, limit: 5, remaining: 4, reset: bucket.reset };
  }

  current.count += 1;
  return {
    success: current.count <= 5,
    limit: 5,
    remaining: Math.max(0, 5 - current.count),
    reset: current.reset
  };
}
