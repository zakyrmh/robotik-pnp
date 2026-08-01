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

// Rate Limiter untuk Pendaftaran Calon Anggota (/register)
// Maksimal 5 pendaftaran per IP per 15 menit
export const registerRateLimiter =
  isConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
        prefix: "@upstash/ratelimit/register",
      })
    : {
        limit: async () => ({
          success: true,
          limit: 5,
          remaining: 5,
          reset: Date.now() + 15 * 60 * 1000,
        }),
      };
