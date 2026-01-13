import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  AuthError,
  User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { LoginValues, RegisterValues } from "@/schemas/auth";
import { UserSchema } from "@/schemas/users";

// Separation of Concerns:
// This file handles Firebase Authentication logic AND initial User Document creation.
// It returns a standard result object that the UI can easily consume.

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Backward compatibility alias
export type LoginResult = AuthResult;

/**
 * Login with Email and Password
 * @param {LoginValues} values - Validated email, password, and rememberMe preference
 * @returns {Promise<AuthResult>} - Structured result with user or error message
 */
export const loginWithEmail = async (
  values: LoginValues
): Promise<AuthResult> => {
  try {
    // 1. Set Persistence type based on "Remember Me"
    await setPersistence(
      auth,
      values.rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    // 2. Perform Login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      values.email,
      values.password
    );

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    return handleAuthError(error);
  }
};

/**
 * Register User
 * Creates Auth user AND Firestore User Document in 'users_new' collection.
 * Also sends verification email.
 * @param {RegisterValues} values
 * @returns {Promise<AuthResult>}
 */
export const registerUser = async (
  values: RegisterValues
): Promise<AuthResult> => {
  try {
    const { fullName, email, password } = values;

    // 1. Create User in Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Update Auth Profile (Display Name)
    await updateProfile(user, {
      displayName: fullName,
    });

    // 3. Send Verification Email
    await sendEmailVerification(user);

    // 4. Prepare User Data for Firestore (users_new)
    const now = Timestamp.now();
    const rawUserData = {
      id: user.uid,
      email: user.email!,
      roles: { isCaang: true },
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

    // 5. Validate Data with Zod Schema
    // Note: We are validating against UserSchema but saving to users_new for now.
    // Ensure UserSchema accepts the new fields (we added verification field).
    const validatedData = UserSchema.parse(rawUserData);

    // 6. Save to Firestore (users_new)
    await setDoc(doc(db, "users_new", user.uid), validatedData);

    return {
      success: true,
      user: user,
    };
  } catch (error) {
    return handleAuthError(error);
  }
};

/**
 * Resend Verification Email with Limit Logic
 * User Limit: 3 attempts. Block for 24 hours if exceeded.
 * @param {User} user - The currently logged-in user
 * @returns {Promise<AuthResult & { nextAvailable?: Date }>}
 */
export const resendVerificationEmail = async (
  user: User
): Promise<AuthResult & { nextAvailable?: Date }> => {
  try {
    const userDocRef = doc(db, "users_new", user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      return { success: false, error: "User data not found." };
    }

    const userData = userSnapshot.data();
    const verification = userData.verification || { resendAttempts: 0 };
    const now = Timestamp.now();

    // Check Block logic
    if (verification.blockResendUntil) {
      const blockUntil = verification.blockResendUntil as Timestamp;
      if (now.toMillis() < blockUntil.toMillis()) {
        return {
          success: false,
          error: "Batas pengiriman ulang tercapai. Coba lagi nanti.",
          nextAvailable: blockUntil.toDate(),
        };
      } else {
        // Block expired, reset attempts
        verification.resendAttempts = 0;
        verification.blockResendUntil = null;
      }
    }

    // Check Attempts logic
    if (verification.resendAttempts >= 3) {
      // Set block for 24 hours
      const blockUntilDate = new Date();
      blockUntilDate.setHours(blockUntilDate.getHours() + 24);
      const blockUntilTimestamp = Timestamp.fromDate(blockUntilDate);

      await updateDoc(userDocRef, {
        "verification.blockResendUntil": blockUntilTimestamp,
        "verification.resendAttempts": verification.resendAttempts, // Keep count or reset? Usually keep to show history, but here effectively blocking.
        // Actually, logic said "jika tidak ada email (attempts exhausted)... tunggu 1x24jam".
        // So this attempt (the 4th one essentially) fails and we set the block.
      });

      return {
        success: false,
        error: "Kesempatan habis. Tunggu 1x24 jam.",
        nextAvailable: blockUntilDate,
      };
    }

    // If all good, send email
    await sendEmailVerification(user);

    // Update attempts
    await updateDoc(userDocRef, {
      "verification.resendAttempts": (verification.resendAttempts || 0) + 1,
      "verification.lastResendAt": now,
      // If block expiration passed, we should have cleared it locally, now save cleared state if needed
      // But Firestore update is merge, so we just update what we change.
      // If we reset above, we need to save that reset state.
      ...(verification.blockResendUntil === null
        ? { "verification.blockResendUntil": null }
        : {}),
    });

    return { success: true };
  } catch (error) {
    return handleAuthError(error);
  }
};

// Helper: Standardized Error Handling
const handleAuthError = (error: unknown): AuthResult => {
  const authError = error as AuthError;
  let errorMessage = "Terjadi kesalahan sistem.";

  // Zod Error Handling check
  if (error instanceof Error && error.name === "ZodError") {
    console.error("Validation Error:", error);
    return {
      success: false,
      error: "Data user tidak valid (Validation Error).",
    };
  }

  // Firebase Auth Errors
  switch (authError.code) {
    case "auth/email-already-in-use":
      errorMessage = "Email sudah terdaftar. Gunakan email lain.";
      break;
    case "auth/weak-password":
      errorMessage = "Password terlalu lemah.";
      break;
    case "auth/invalid-email":
      errorMessage = "Format email tidak valid.";
      break;
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      errorMessage = "Email atau password salah.";
      break;
    case "auth/user-disabled":
      errorMessage = "Akun ini telah dinonaktifkan.";
      break;
    case "auth/too-many-requests":
      errorMessage = "Terlalu banyak request. Silakan coba lagi nanti.";
      break;
    case "auth/network-request-failed":
      errorMessage = "Koneksi jaringan bermasalah.";
      break;
    default:
      console.error("Auth Error:", authError.code, authError.message);
      if (authError.message) errorMessage = authError.message;
  }

  return {
    success: false,
    error: errorMessage,
  };
};
