import { z } from "zod";

// ---------------------------------------------------------
// 1. LOGIN HISTORY SCHEMA
// ---------------------------------------------------------

/**
 * Schema untuk mencatat sejarah login (Audit Log)
 * Collection: login_history
 *
 * Retention: 30 hari (harus dihapus manual atau via scheduled function)
 */
export const LoginHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),

  // Timestamp login
  timestamp: z.union([z.date(), z.any()]), // Firestore Timestamp or Date

  // Device & Browser Info
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  device: z.string().optional(), // Parsed device name

  // Status
  status: z.enum(["success", "failed"]),
  failReason: z.string().optional(), // Alasan gagal (jika status = failed)

  // Session tracking
  sessionId: z.string().optional(), // Unique session ID

  // Metadata
  createdAt: z.union([z.date(), z.any()]),
});

export type LoginHistory = z.infer<typeof LoginHistorySchema>;

// ---------------------------------------------------------
// 2. LOGIN SESSION SCHEMA
// ---------------------------------------------------------

/**
 * Schema untuk tracking active sessions
 * Digunakan untuk force re-auth setelah 24 jam
 */
export const LoginSessionSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  createdAt: z.union([z.date(), z.any()]),
  lastActivityAt: z.union([z.date(), z.any()]),
  expiresAt: z.union([z.date(), z.any()]), // 24 jam dari createdAt

  // Device info
  device: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),

  // Status
  isActive: z.boolean().default(true),
  revokedAt: z.union([z.date(), z.any()]).optional(),
  revokedReason: z.string().optional(),
});

export type LoginSession = z.infer<typeof LoginSessionSchema>;

// ---------------------------------------------------------
// 3. HELPER TYPES
// ---------------------------------------------------------

export type LoginStatus = "success" | "failed";

export interface LoginAttemptInfo {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

// Login fail reasons
export const LoginFailReasons = {
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  ACCOUNT_DISABLED: "account_disabled",
  ACCOUNT_BLACKLISTED: "account_blacklisted",
  RATE_LIMITED: "rate_limited",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type LoginFailReason =
  (typeof LoginFailReasons)[keyof typeof LoginFailReasons];
