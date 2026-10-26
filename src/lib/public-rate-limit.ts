import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type Bucket = {
  count: number;
  reset: number;
};

const memoryBuckets = new Map<string, Bucket>();
const limiters = new Map<string, Ratelimit>();

function getLimiter(action: "comment" | "like"): Ratelimit | null {
  const existing = limiters.get(action);
  if (existing) return existing;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Public API rate limiting is not configured.");
    }
    return null;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter:
      action === "comment"
        ? Ratelimit.slidingWindow(5, "15 m")
        : Ratelimit.slidingWindow(60, "15 m"),
    prefix: `amebo-n-tech:public-${action}`,
    analytics: true
  });

  limiters.set(action, limiter);
  return limiter;
}

export function getRequestIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function limitPublicAction(
  action: "comment" | "like",
  identifier: string
): Promise<LimitResult> {
  const limiter = getLimiter(action);

  if (limiter) {
    return limiter.limit(identifier);
  }

  const key = `${action}:${identifier}`;
  const now = Date.now();
  const current = memoryBuckets.get(key);
  const duration = 15 * 60 * 1000;
  const maximum = action === "comment" ? 5 : 60;

  if (!current || current.reset <= now) {
    const bucket = { count: 1, reset: now + duration };
    memoryBuckets.set(key, bucket);

    return {
      success: true,
      limit: maximum,
      remaining: maximum - 1,
      reset: bucket.reset
    };
  }

  current.count += 1;

  return {
    success: current.count <= maximum,
    limit: maximum,
    remaining: Math.max(0, maximum - current.count),
    reset: current.reset
  };
}
