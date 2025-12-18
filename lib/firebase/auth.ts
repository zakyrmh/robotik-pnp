import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { User, UserSystemRoles } from "@/types/users";

const USERS_COLLECTION = "users_new";

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  try {
    // 1. Create User in Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const firebaseUser = userCredential.user;

    // 2. Update Profile (DisplayName)
    await updateProfile(firebaseUser, {
      displayName: data.fullName,
    });

    // 3. Send Verification Email
    await sendEmailVerification(firebaseUser);

    // 3. Create User Document in Firestore
    const defaultRoles: UserSystemRoles = {
      isSuperAdmin: false,
      isKestari: false,
      isKomdis: false,
      isRecruiter: false,
      isKRIMember: false,
      isOfficialMember: false,
      isCaang: true, // Default role for new registration
      isAlumni: false,
    };

    const newUser: User = {
      id: firebaseUser.uid,
      email: data.email,
      emailVerified: firebaseUser.emailVerified,
      roles: defaultRoles,
      profile: {
        fullName: data.fullName,
      },
      isActive: true,
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
    };

    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), newUser);

    return {
      success: true,
      user: newUser,
    };
  } catch (error: unknown) {
    console.error("Registration error:", error);
    let errorMessage = "Terjadi kesalahan saat registrasi.";

    const err = error as { code?: string };

    if (err.code === "auth/email-already-in-use") {
      errorMessage = "Email sudah terdaftar.";
    } else if (err.code === "auth/weak-password") {
      errorMessage = "Password terlalu lemah.";
    } else if (err.code === "auth/invalid-email") {
      errorMessage = "Email tidak valid.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();

    return {
      success: true,
      user: userCredential.user,
      idToken,
    };
  } catch (error: unknown) {
    console.error("Login error:", error);
    let errorMessage = "Terjadi kesalahan saat login";
    const err = error as { code?: string; message?: string };

    switch (err.code) {
      case "auth/user-not-found":
        errorMessage = "Email tidak terdaftar";
        break;
      case "auth/wrong-password":
        errorMessage = "Password salah";
        break;
      case "auth/invalid-email":
        errorMessage = "Format email tidak valid";
        break;
      case "auth/user-disabled":
        errorMessage = "Akun Anda telah dinonaktifkan";
        break;
      case "auth/too-many-requests":
        errorMessage = "Terlalu banyak percobaan login. Coba lagi nanti";
        break;
      case "auth/network-request-failed":
        errorMessage = "Koneksi internet bermasalah";
        break;
      case "auth/invalid-credential":
        errorMessage = "Email atau password salah";
        break;
      default:
        errorMessage = err.message || "Terjadi kesalahan saat login";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
