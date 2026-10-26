const production = process.env.NODE_ENV === "production";

export function validateServerEnv() {
  const required = ["DATABASE_URL", "AUTH_SECRET", "ADMIN_PASSWORD"];
  const missing = required.filter((key) => !process.env[key]);

  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  if (production) {
    const rateLimitRequired = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
    missing.push(...rateLimitRequired.filter((key) => !process.env[key]));
    if (!process.env.DIRECT_URL) missing.push("DIRECT_URL");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${[...new Set(missing)].join(", ")}`);
  }
}
