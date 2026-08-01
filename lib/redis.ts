import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Inisialisasi Kredensial Upstash Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(redisUrl && redisToken);

if (!isConfigured && process.env.NODE_ENV === "development") {
  console.warn(
    "[Upstash Redis] Kredensial UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN belum dikonfigurasi di .env.local. Mode rate limiting akan dilewati secara otomatis.",
  );
}

// Singleton Redis Client
export const redis = isConfigured
  ? new Redis({
      url: redisUrl!,
      token: redisToken!,
    })
  : null;

// Helper Dummy Limiter untuk Graceful Fallback jika Redis belum dikonfigurasi
const createDummyLimiter = (maxLimit: number, windowMs: number) => ({
  limit: async () => ({
    success: true,
    limit: maxLimit,
    remaining: maxLimit,
    reset: Date.now() + windowMs,
  }),
});

// 1. Rate Limiter untuk Pendaftaran Calon Anggota (/register) - 5 req per 15m
export const registerRateLimiter =
  isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
        prefix: "@upstash/ratelimit/register",
      })
    : createDummyLimiter(5, 15 * 60 * 1000);

// 2. Rate Limiter untuk Portal Login (/login) - 5 req per 10m
export const loginRateLimiter =
  isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "@upstash/ratelimit/login",
      })
    : createDummyLimiter(5, 10 * 60 * 1000);

// 3. Rate Limiter untuk Lupa Password (/forgot-password) - 3 req per 15m
export const forgotPasswordRateLimiter =
  isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "15 m"),
        analytics: true,
        prefix: "@upstash/ratelimit/forgot-password",
      })
    : createDummyLimiter(3, 15 * 60 * 1000);
