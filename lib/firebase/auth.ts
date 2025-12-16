import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
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
      createdAt: serverTimestamp() as unknown as Timestamp, // Cast because serverTimestamp return type is slightly different
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
    
    // Type guard basic or casting
    const err = error as { code?: string };

    if (err.code === 'auth/email-already-in-use') {
      errorMessage = "Email sudah terdaftar.";
    } else if (err.code === 'auth/weak-password') {
      errorMessage = "Password terlalu lemah.";
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = "Email tidak valid.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
