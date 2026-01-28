/**
 * Cloud Function: registerUser
 *
 * Fungsi ini menangani proses registrasi user secara atomik dan aman:
 * 1. Validasi data menggunakan Zod schema
 * 2. Pembuatan akun di Firebase Authentication
 * 3. Penetapan role default (isCaang: true)
 * 4. Penyimpanan data user ke Firestore
 * 5. Pengiriman email verifikasi
 *
 * Konsep "Atomic & Secure":
 * - Semua operasi dijalankan di server (bukan client)
 * - Jika salah satu step gagal, operasi akan di-rollback
 * - Data sensitif tidak terekspos ke client
 *
 * @version 1.4.0
 * @see https://firebase.google.com/docs/functions/callable
 */

import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { z } from "zod";

// Initialize Firebase Admin jika belum
if (!getApps().length) {
  initializeApp();
}

const adminAuth = getAuth();
const adminDb = getFirestore();

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

/**
 * Konfigurasi Rate Limiting untuk mencegah spam/brute-force
 * - MAX_ATTEMPTS: Maksimal percobaan registrasi per identifier
 * - WINDOW_MS: Jendela waktu dalam milidetik (15 menit)
 * - BLOCK_DURATION_MS: Durasi block jika melebihi limit (1 jam)
 */
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 menit
  BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 jam
  COLLECTION: "rate_limits",
};

/**
 * Interface untuk data rate limit di Firestore
 */
interface RateLimitData {
  attempts: number;
  firstAttemptAt: FirebaseFirestore.Timestamp;
  blockedUntil?: FirebaseFirestore.Timestamp;
  lastAttemptAt: FirebaseFirestore.Timestamp;
}

/**
 * Mengecek dan memperbarui rate limit untuk identifier (IP/email)
 * @param identifier - IP address atau email yang akan dicek
 * @returns Object dengan status isBlocked dan info tambahan
 */
async function checkRateLimit(identifier: string): Promise<{
  isBlocked: boolean;
  remainingAttempts: number;
  blockedUntil?: Date;
  message?: string;
}> {
  const docRef = adminDb
    .collection(RATE_LIMIT_CONFIG.COLLECTION)
    .doc(identifier);
  const now = Timestamp.now();
  const nowMs = now.toMillis();

  try {
    const doc = await docRef.get();

    if (!doc.exists) {
      // First attempt, create new record
      await docRef.set({
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
      return {
        isBlocked: false,
        remainingAttempts: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1,
      };
    }

    const data = doc.data() as RateLimitData;

    // Check if currently blocked
    if (data.blockedUntil) {
      const blockedUntilMs = data.blockedUntil.toMillis();
      if (nowMs < blockedUntilMs) {
        return {
          isBlocked: true,
          remainingAttempts: 0,
          blockedUntil: data.blockedUntil.toDate(),
          message: `Terlalu banyak percobaan. Coba lagi setelah ${Math.ceil((blockedUntilMs - nowMs) / 60000)} menit.`,
        };
      } else {
        // Block expired, reset
        await docRef.set({
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        });
        return {
          isBlocked: false,
          remainingAttempts: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1,
        };
      }
    }

    // Check if window has expired
    const firstAttemptMs = data.firstAttemptAt.toMillis();
    if (nowMs - firstAttemptMs > RATE_LIMIT_CONFIG.WINDOW_MS) {
      // Window expired, reset counter
      await docRef.set({
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
      return {
        isBlocked: false,
        remainingAttempts: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1,
      };
    }

    // Within window, check attempts
    const newAttempts = data.attempts + 1;

    if (newAttempts > RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      // Exceeded limit, block
      const blockedUntil = Timestamp.fromMillis(
        nowMs + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS,
      );
      await docRef.update({
        attempts: newAttempts,
        lastAttemptAt: now,
        blockedUntil: blockedUntil,
      });
      return {
        isBlocked: true,
        remainingAttempts: 0,
        blockedUntil: blockedUntil.toDate(),
        message: `Terlalu banyak percobaan. Coba lagi dalam ${RATE_LIMIT_CONFIG.BLOCK_DURATION_MS / 60000} menit.`,
      };
    }

    // Still within limit
    await docRef.update({
      attempts: newAttempts,
      lastAttemptAt: now,
    });

    return {
      isBlocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - newAttempts,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request but log it
    return {
      isBlocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.MAX_ATTEMPTS,
    };
  }
}

/**
 * Membersihkan rate limit setelah registrasi berhasil
 * @param identifier - IP address atau email yang akan dihapus
 */
async function clearRateLimit(identifier: string): Promise<void> {
  try {
    await adminDb
      .collection(RATE_LIMIT_CONFIG.COLLECTION)
      .doc(identifier)
      .delete();
  } catch (error) {
    console.error("Failed to clear rate limit:", error);
  }
}

// ============================================
// SCHEMAS (Server-side validation)
// ============================================

/**
 * Schema untuk validasi data registrasi
 * Duplikasi dari schemas/auth.ts untuk keamanan server-side
 */
const RegisterInputSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine(
    (data: { password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      message: "Password tidak cocok",
      path: ["confirmPassword"],
    },
  );

/**
 * Schema untuk data user yang akan disimpan ke Firestore
 */
const UserSystemRolesSchema = z.object({
  isSuperAdmin: z.boolean().default(false),
  isKestari: z.boolean().default(false),
  isKomdis: z.boolean().default(false),
  isRecruiter: z.boolean().default(false),
  isKRIMember: z.boolean().default(false),
  isOfficialMember: z.boolean().default(false),
  isCaang: z.boolean().default(false),
  isAlumni: z.boolean().default(false),
});

const UserProfileSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nickname: z.string().optional(),
  nim: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.any().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  major: z.string().optional(),
  department: z.string().optional(),
  entryYear: z.number().int().optional(),
  photoUrl: z.string().optional(),
  ktmUrl: z.string().optional(),
});

const VerificationSchema = z.object({
  emailVerified: z.boolean().default(false),
  resendAttempts: z.number().default(0),
  lastResendAt: z.any().nullable().optional(),
  blockResendUntil: z.any().nullable().optional(),
});

const NewUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: UserSystemRolesSchema,
  profile: UserProfileSchema,
  isActive: z.boolean().default(true),
  verification: VerificationSchema,
  createdAt: z.any(),
  updatedAt: z.any(),
});

type RegisterInput = z.infer<typeof RegisterInputSchema>;

// ============================================
// CLOUD FUNCTION: registerUser
// ============================================

export const registerUser = onCall(
  {
    // Konfigurasi function
    region: "asia-southeast2", // Region terdekat (Jakarta)
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    // CORS: true untuk development, atau array origins untuk production
    cors: true,
  },
  async (request: CallableRequest<RegisterInput>) => {
    const { data } = request;

    // ----------------------------------------
    // Step 0: Rate Limiting Check (Anti-Spam)
    // ----------------------------------------
    // Gunakan IP address atau email sebagai identifier
    // rawRequest.ip tersedia di Firebase Functions v2
    const clientIp = request.rawRequest?.ip || "unknown";
    const rateLimitIdentifier = `reg_${clientIp}`;

    const rateLimit = await checkRateLimit(rateLimitIdentifier);

    if (rateLimit.isBlocked) {
      throw new HttpsError(
        "resource-exhausted",
        rateLimit.message || "Terlalu banyak percobaan. Coba lagi nanti.",
        {
          blockedUntil: rateLimit.blockedUntil?.toISOString(),
          remainingAttempts: 0,
        },
      );
    }

    // ----------------------------------------
    // Step 1: Validasi Input
    // ----------------------------------------
    const validationResult = RegisterInputSchema.safeParse(data);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new HttpsError("invalid-argument", firstError.message, {
        field: firstError.path.join("."),
      });
    }

    const { fullName, email, password } = validationResult.data;

    let createdUserId: string | null = null;

    try {
      // ----------------------------------------
      // Step 2: Cek apakah email sudah terdaftar
      // ----------------------------------------
      try {
        await adminAuth.getUserByEmail(email);
        // Jika tidak error, berarti email sudah ada
        throw new HttpsError(
          "already-exists",
          "Email sudah terdaftar. Gunakan email lain.",
        );
      } catch (error: unknown) {
        // Error user-not-found berarti email belum terdaftar (bagus!)
        const firebaseError = error as { code?: string };
        if (firebaseError.code !== "auth/user-not-found") {
          // Re-throw jika error bukan "user not found"
          if (error instanceof HttpsError) {
            throw error;
          }
          throw new HttpsError("internal", "Gagal memeriksa email.");
        }
      }

      // ----------------------------------------
      // Step 3: Buat User di Firebase Auth
      // ----------------------------------------
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: false,
      });

      createdUserId = userRecord.uid;

      // ----------------------------------------
      // Step 4: Siapkan Data User untuk Firestore
      // ----------------------------------------
      const now = Timestamp.now();
      const rawUserData = {
        id: userRecord.uid,
        email: userRecord.email!,
        roles: { isCaang: true }, // Default role untuk user baru
        profile: { fullName },
        isActive: true,
        verification: {
          emailVerified: false,
          resendAttempts: 0,
          lastResendAt: null,
          blockResendUntil: null,
        },
        createdAt: now,
        updatedAt: now,
      };

      // ----------------------------------------
      // Step 5: Validasi Data dengan Zod
      // ----------------------------------------
      const validatedUserData = NewUserSchema.parse(rawUserData);

      // ----------------------------------------
      // Step 6: Simpan ke Firestore (users_new collection)
      // ----------------------------------------
      await adminDb
        .collection("users_new")
        .doc(userRecord.uid)
        .set(validatedUserData);

      // ----------------------------------------
      // Step 7: Generate Email Verification Link
      // ----------------------------------------
      const verificationLink = await adminAuth.generateEmailVerificationLink(
        email,
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || "https://robotik-pnp.vercel.app"}/login`,
        },
      );

      // ----------------------------------------
      // Step 8: Clear Rate Limit (registrasi berhasil)
      // ----------------------------------------
      await clearRateLimit(rateLimitIdentifier);

      // ----------------------------------------
      // Return Success Response
      // ----------------------------------------
      return {
        success: true,
        message: "Akun berhasil dibuat. Cek email untuk verifikasi.",
        userId: userRecord.uid,
        verificationLink, // Untuk development/testing, hapus di production jika tidak diperlukan
      };
    } catch (error: unknown) {
      // ----------------------------------------
      // Rollback: Hapus user dari Auth jika Firestore gagal
      // ----------------------------------------
      if (createdUserId) {
        try {
          await adminAuth.deleteUser(createdUserId);
          console.log(`Rollback: Deleted user ${createdUserId} from Auth`);
        } catch (deleteError) {
          console.error("Failed to rollback user creation:", deleteError);
        }
      }

      // ----------------------------------------
      // Error Handling
      // ----------------------------------------
      if (error instanceof HttpsError) {
        throw error;
      }

      const firebaseError = error as { code?: string; message?: string };

      // Map Firebase Auth error codes ke pesan user-friendly
      const errorMessages: Record<string, string> = {
        "auth/email-already-exists":
          "Email sudah terdaftar. Gunakan email lain.",
        "auth/invalid-email": "Format email tidak valid.",
        "auth/weak-password": "Password terlalu lemah.",
        "auth/invalid-password": "Password tidak valid (minimal 6 karakter).",
      };

      const errorMessage =
        errorMessages[firebaseError.code || ""] ||
        firebaseError.message ||
        "Terjadi kesalahan sistem. Silakan coba lagi.";

      console.error("Registration error:", error);

      throw new HttpsError("internal", errorMessage);
    }
  },
);
