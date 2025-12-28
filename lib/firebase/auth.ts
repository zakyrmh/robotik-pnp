import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError,
  User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { LoginValues } from "@/schemas/auth";
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
 * Creates Auth user and Firestore User Document
 * @param {string} fullName
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResult>}
 */
export const registerUser = async ({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> => {
  try {
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

    // 3. Prepare User Data for Firestore
    const now = Timestamp.now();
    const rawUserData = {
      id: user.uid,
      email: user.email!,
      roles: { isCaang: true }, // Default role set to Caang (Calon Anggota) only
      profile: { fullName },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Validate Data with Zod Schema
    // Note: Zod schema defaults (false for other roles) will be applied here
    const validatedData = UserSchema.parse(rawUserData);

    // 5. Save to Firestore
    await setDoc(doc(db, "users", user.uid), validatedData);

    return {
      success: true,
      user: user,
    };
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
