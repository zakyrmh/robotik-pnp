/**
 * Cloud Function: loginUser
 *
 * Pre-login validation dengan fitur:
 * - Rate Limiting (5x per 15 menit per IP)
 * - Email Verification Check (blokir jika belum verifikasi)
 * - Account Status Check (blokir jika disabled/blacklisted)
 * - Audit Logging (simpan login history)
 * - Session Tracking (untuk force re-auth setelah 24 jam)
 *
 * Flow baru (tanpa Custom Token):
 * 1. Cloud Function validasi semua
 * 2. Jika berhasil, return success + sessionId
 * 3. Client kemudian panggil signInWithEmailAndPassword
 *
 * @version 1.5.1
 */

import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { z } from "zod";

// Initialize Firebase Admin jika belum
if (!getApps().length) {
  initializeApp();
}

const adminDb = getFirestore();
const adminAuth = getAuth();
const adminRtdb = getDatabase();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Rate Limiting
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 menit
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 jam
    COLLECTION: "login_rate_limits",
  },

  // Session
  SESSION: {
    EXPIRES_MS: 24 * 60 * 60 * 1000, // 24 jam
    COLLECTION: "login_sessions",
  },

  // Audit Log
  AUDIT: {
    COLLECTION: "login_history",
    RETENTION_DAYS: 30,
  },

  // Presence
  PRESENCE: {
    PATH: "/status",
  },
};

// ============================================
// INPUT SCHEMA
// ============================================

const LoginInputSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  device: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

type LoginInput = z.infer<typeof LoginInputSchema>;

// ============================================
// RESPONSE TYPES
// ============================================

interface LoginSuccessResponse {
  success: true;
  message: string;
  canProceed: true; // Indicates client can proceed with signInWithEmailAndPassword
  user: {
    uid: string;
    email: string;
    displayName: string | undefined;
    emailVerified: boolean;
    roles: Record<string, boolean>;
  };
  sessionId: string;
}

interface LoginFailResponse {
  success: false;
  error: string;
  code: string;
  requiresEmailVerification?: boolean;
  email?: string;
}

type LoginResponse = LoginSuccessResponse | LoginFailResponse;

// ============================================
// CLOUD FUNCTION: loginUser
// ============================================

export const loginUser = onCall(
  {
    region: "asia-southeast2",
    memory: "256MiB",
    timeoutSeconds: 30,
    cors: true,
  },
  async (request: CallableRequest<LoginInput>): Promise<LoginResponse> => {
    const now = Timestamp.now();
    const clientIp = request.rawRequest?.ip || "unknown";

    // ----------------------------------------
    // Step 1: Validate Input
    // ----------------------------------------
    const validation = LoginInputSchema.safeParse(request.data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Data tidak valid",
        code: "invalid_input",
      };
    }

    const { email, device } = validation.data;
    // Note: password tidak di-validate di server, akan di-validate oleh Firebase Auth di client

    // ----------------------------------------
    // Step 2: Rate Limiting Check
    // ----------------------------------------
    const rateLimitResult = await checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      await logLoginAttempt({
        email,
        ipAddress: clientIp,
        device,
        status: "failed",
        failReason: "rate_limited",
        userId: undefined,
      });

      return {
        success: false,
        error: rateLimitResult.message,
        code: "rate_limited",
      };
    }

    // ----------------------------------------
    // Step 3: Get User by Email
    // ----------------------------------------
    let userRecord: UserRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      // Increment rate limit
      await incrementRateLimit(clientIp);

      // Log failed attempt (hide email to prevent enumeration)
      await logLoginAttempt({
        email: "***hidden***",
        ipAddress: clientIp,
        device,
        status: "failed",
        failReason: "invalid_credentials",
        userId: undefined,
      });

      return {
        success: false,
        error: "Email atau password salah.",
        code: "invalid_credentials",
      };
    }

    // ----------------------------------------
    // Step 4: Check Account Status
    // ----------------------------------------

    // 4a. Check if account is disabled
    if (userRecord.disabled) {
      await logLoginAttempt({
        email,
        ipAddress: clientIp,
        device,
        status: "failed",
        failReason: "account_disabled",
        userId: userRecord.uid,
      });

      return {
        success: false,
        error: "Akun Anda telah dinonaktifkan. Hubungi admin.",
        code: "account_disabled",
      };
    }

    // 4b. Check email verification
    if (!userRecord.emailVerified) {
      await logLoginAttempt({
        email,
        ipAddress: clientIp,
        device,
        status: "failed",
        failReason: "email_not_verified",
        userId: userRecord.uid,
      });

      return {
        success: false,
        error: "Email belum diverifikasi. Silakan cek inbox email Anda.",
        code: "email_not_verified",
        requiresEmailVerification: true,
        email: email,
      };
    }

    // 4c. Check blacklist in Firestore
    const userDoc = await adminDb
      .collection("users_new")
      .doc(userRecord.uid)
      .get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Check isActive
      if (userData?.isActive === false) {
        await logLoginAttempt({
          email,
          ipAddress: clientIp,
          device,
          status: "failed",
          failReason: "account_disabled",
          userId: userRecord.uid,
        });

        return {
          success: false,
          error: "Akun Anda tidak aktif. Hubungi admin.",
          code: "account_disabled",
        };
      }

      // Check blacklist
      if (userData?.blacklistInfo?.isBlacklisted === true) {
        await logLoginAttempt({
          email,
          ipAddress: clientIp,
          device,
          status: "failed",
          failReason: "account_blacklisted",
          userId: userRecord.uid,
        });

        return {
          success: false,
          error: `Akun Anda diblokir. Alasan: ${userData.blacklistInfo.reason || "Tidak disebutkan"}`,
          code: "account_blacklisted",
        };
      }
    }

    // ----------------------------------------
    // Step 5: All checks passed! Generate session
    // ----------------------------------------
    const sessionId = generateSessionId();

    // ----------------------------------------
    // Step 6: Create Session Record
    // ----------------------------------------
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + CONFIG.SESSION.EXPIRES_MS,
    );

    await adminDb
      .collection(CONFIG.SESSION.COLLECTION)
      .doc(sessionId)
      .set({
        userId: userRecord.uid,
        sessionId,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        device: device || "Unknown",
        ipAddress: clientIp,
        isActive: true,
      });

    // ----------------------------------------
    // Step 7: Log Successful Pre-validation
    // Note: Actual login success will be confirmed when client calls signInWithEmailAndPassword
    // ----------------------------------------
    await logLoginAttempt({
      email,
      ipAddress: clientIp,
      device,
      status: "success",
      userId: userRecord.uid,
      sessionId,
    });

    // ----------------------------------------
    // Step 8: Clear Rate Limit on Success
    // ----------------------------------------
    await clearRateLimit(clientIp);

    // ----------------------------------------
    // Step 9: Set Online Presence
    // ----------------------------------------
    try {
      const presenceRef = adminRtdb.ref(
        `${CONFIG.PRESENCE.PATH}/${userRecord.uid}`,
      );
      const nowTimestamp = Date.now();
      await presenceRef.set({
        state: "online",
        lastChanged: nowTimestamp,
        lastOnline: nowTimestamp,
        device: device || "Unknown",
        sessionId: sessionId,
        isIdle: false,
      });
    } catch (presenceError) {
      console.warn("Failed to set presence:", presenceError);
      // Don't fail login if presence fails
    }

    // ----------------------------------------
    // Step 10: Return Success
    // Client should now call signInWithEmailAndPassword
    // ----------------------------------------
    const userData = userDoc.exists ? userDoc.data() : {};

    return {
      success: true,
      message: "Validasi berhasil! Melanjutkan login...",
      canProceed: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        roles: userData?.roles || {},
      },
      sessionId,
    };
  },
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check rate limit for IP
 */
async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; message: string }> {
  const docRef = adminDb.collection(CONFIG.RATE_LIMIT.COLLECTION).doc(ip);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { allowed: true, message: "" };
  }

  const data = doc.data();
  const now = Date.now();

  // Check if blocked
  if (data?.blockedUntil) {
    const blockedUntil = data.blockedUntil.toMillis();
    if (now < blockedUntil) {
      const remainingMinutes = Math.ceil((blockedUntil - now) / 60000);
      return {
        allowed: false,
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingMinutes} menit.`,
      };
    }
  }

  // Check window
  if (data?.windowStart) {
    const windowStart = data.windowStart.toMillis();
    if (now - windowStart < CONFIG.RATE_LIMIT.WINDOW_MS) {
      if (data.attempts >= CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
        // Block the IP
        await docRef.update({
          blockedUntil: Timestamp.fromMillis(
            now + CONFIG.RATE_LIMIT.BLOCK_DURATION_MS,
          ),
        });

        return {
          allowed: false,
          message: "Terlalu banyak percobaan login. Coba lagi dalam 1 jam.",
        };
      }
    }
  }

  return { allowed: true, message: "" };
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(ip: string): Promise<void> {
  const docRef = adminDb.collection(CONFIG.RATE_LIMIT.COLLECTION).doc(ip);
  const doc = await docRef.get();
  const now = Timestamp.now();

  if (!doc.exists) {
    await docRef.set({
      attempts: 1,
      windowStart: now,
    });
    return;
  }

  const data = doc.data();

  // Check if window expired
  if (data?.windowStart) {
    const windowStart = data.windowStart.toMillis();
    if (Date.now() - windowStart >= CONFIG.RATE_LIMIT.WINDOW_MS) {
      // Reset window
      await docRef.set({
        attempts: 1,
        windowStart: now,
      });
      return;
    }
  }

  // Increment attempts
  await docRef.update({
    attempts: FieldValue.increment(1),
  });
}

/**
 * Clear rate limit on successful login
 */
async function clearRateLimit(ip: string): Promise<void> {
  const docRef = adminDb.collection(CONFIG.RATE_LIMIT.COLLECTION).doc(ip);
  await docRef.delete();
}

/**
 * Log login attempt
 */
async function logLoginAttempt(data: {
  email: string;
  ipAddress?: string;
  device?: string;
  status: "success" | "failed";
  failReason?: string;
  userId?: string;
  sessionId?: string;
}): Promise<void> {
  const now = Timestamp.now();
  const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await adminDb
    .collection(CONFIG.AUDIT.COLLECTION)
    .doc(logId)
    .set({
      id: logId,
      userId: data.userId || "unknown",
      email: data.email,
      timestamp: now,
      ipAddress: data.ipAddress || "unknown",
      device: data.device || "unknown",
      status: data.status,
      failReason: data.failReason || null,
      sessionId: data.sessionId || null,
      createdAt: now,
    });
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `sess_${timestamp}_${randomPart}`;
}
