import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { db, storage, auth } from "@/lib/firebase/config";
import { User } from "@/schemas/users";

// =========================================================
// TYPES
// =========================================================

export interface UpdateProfileData {
  fullName: string;
  nickname?: string;
  nim?: string;
  phone?: string;
  gender?: "male" | "female";
  birthDate?: Date | null;
  birthPlace?: string;
  address?: string;
  major?: string;
  department?: string;
  entryYear?: number;
  photoUrl?: string;
  ktmUrl?: string;
}

export interface UpdateEmailData {
  newEmail: string;
  currentPassword: string;
}

export interface UpdatePasswordData {
  newPassword: string;
  currentPassword: string;
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Transform Firestore Timestamp to Date
 */
const transformTimestamp = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;

  if (data instanceof Timestamp) {
    return data.toDate();
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "toDate" in data &&
    typeof (data as { toDate: unknown }).toDate === "function"
  ) {
    return (data as { toDate: () => Date }).toDate();
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformTimestamp(item));
  }

  if (typeof data === "object") {
    const transformed: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        transformed[key] = transformTimestamp(obj[key]);
      }
    }
    return transformed;
  }

  return data;
};

// =========================================================
// PROFILE SERVICE FUNCTIONS
// =========================================================

/**
 * Fetch current user profile data
 */
export const getUserProfile = async (
  uid: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const userRef = doc(db, "users_new", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { user: null, error: "User tidak ditemukan" };
    }

    const rawData = userSnap.data();
    const transformedData = transformTimestamp(rawData) as User;
    transformedData.id = uid;

    return { user: transformedData, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { user: null, error: "Gagal mengambil data profil" };
  }
};

/**
 * Upload image to Firebase Storage
 * Returns the storage path (not download URL) for flexibility
 */
export const uploadProfileImage = async (
  uid: string,
  file: File,
  type: "profile" | "ktm"
): Promise<{ path: string | null; error: string | null }> => {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { path: null, error: "Format file harus JPG, PNG, atau WebP" };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { path: null, error: "Ukuran file maksimal 5MB" };
    }

    // Create storage path
    const extension = file.name.split(".").pop() || "jpg";
    const fileName =
      type === "profile" ? `profile.${extension}` : `ktm.${extension}`;
    const storagePath = `users/${uid}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    await uploadBytes(storageRef, file);

    // Return the storage path (not download URL)
    return { path: storagePath, error: null };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { path: null, error: "Gagal mengunggah gambar" };
  }
};

/**
 * Delete image from Firebase Storage
 */
export const deleteProfileImage = async (
  uid: string,
  type: "profile" | "ktm"
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Try common extensions
    const extensions = ["jpg", "jpeg", "png", "webp"];

    for (const ext of extensions) {
      const fileName = type === "profile" ? `profile.${ext}` : `ktm.${ext}`;
      const storagePath = `users/${uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      try {
        await deleteObject(storageRef);
        return { success: true, error: null };
      } catch {
        // File doesn't exist with this extension, try next
        continue;
      }
    }

    return { success: true, error: null }; // No file to delete
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: "Gagal menghapus gambar" };
  }
};

/**
 * Update user profile data in Firestore
 */
export const updateUserProfile = async (
  uid: string,
  data: UpdateProfileData
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const userRef = doc(db, "users_new", uid);

    // Build profile update object
    const profileUpdate: Record<string, unknown> = {
      fullName: data.fullName,
    };

    // Only add optional fields if they have values
    if (data.nickname) profileUpdate.nickname = data.nickname;
    if (data.nim) profileUpdate.nim = data.nim;
    if (data.phone) profileUpdate.phone = data.phone;
    if (data.gender) profileUpdate.gender = data.gender;
    if (data.birthPlace) profileUpdate.birthPlace = data.birthPlace;
    if (data.address) profileUpdate.address = data.address;
    if (data.major) profileUpdate.major = data.major;
    if (data.department) profileUpdate.department = data.department;
    if (data.entryYear) profileUpdate.entryYear = data.entryYear;
    if (data.photoUrl) profileUpdate.photoUrl = data.photoUrl;
    if (data.ktmUrl) profileUpdate.ktmUrl = data.ktmUrl;

    // Convert Date to Timestamp for Firestore
    if (data.birthDate) {
      profileUpdate.birthDate = Timestamp.fromDate(data.birthDate);
    }
    // Note: If birthDate is null/undefined, we don't include it in the update
    // to avoid type issues with Firestore. The field will remain as is.

    await updateDoc(userRef, {
      profile: profileUpdate,
      updatedAt: serverTimestamp(),
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
};

// =========================================================
// AUTHENTICATION SERVICE FUNCTIONS
// =========================================================

/**
 * Reauthenticate user with password
 */
const reauthenticateUser = async (
  user: FirebaseUser,
  password: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Reauthentication error:", error);
    const firebaseError = error as { code?: string };
    if (
      firebaseError.code === "auth/wrong-password" ||
      firebaseError.code === "auth/invalid-credential"
    ) {
      return { success: false, error: "Password salah" };
    }
    return { success: false, error: "Gagal memverifikasi kredensial" };
  }
};

/**
 * Update user email with verification
 */
export const updateUserEmail = async (
  data: UpdateEmailData
): Promise<{
  success: boolean;
  error: string | null;
  requiresVerification: boolean;
}> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: "User tidak login",
        requiresVerification: false,
      };
    }

    // Reauthenticate first
    const reauth = await reauthenticateUser(user, data.currentPassword);
    if (!reauth.success) {
      return {
        success: false,
        error: reauth.error,
        requiresVerification: false,
      };
    }

    // Send verification to new email
    await verifyBeforeUpdateEmail(user, data.newEmail);

    return {
      success: true,
      error: null,
      requiresVerification: true,
    };
  } catch (error: unknown) {
    console.error("Error updating email:", error);
    const firebaseError = error as { code?: string };

    if (firebaseError.code === "auth/email-already-in-use") {
      return {
        success: false,
        error: "Email sudah digunakan",
        requiresVerification: false,
      };
    }
    if (firebaseError.code === "auth/invalid-email") {
      return {
        success: false,
        error: "Format email tidak valid",
        requiresVerification: false,
      };
    }
    if (firebaseError.code === "auth/requires-recent-login") {
      return {
        success: false,
        error: "Silakan login ulang untuk mengubah email",
        requiresVerification: false,
      };
    }

    return {
      success: false,
      error: "Gagal mengubah email",
      requiresVerification: false,
    };
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (
  data: UpdatePasswordData
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User tidak login" };
    }

    // Reauthenticate first
    const reauth = await reauthenticateUser(user, data.currentPassword);
    if (!reauth.success) {
      return { success: false, error: reauth.error };
    }

    // Update password
    await updatePassword(user, data.newPassword);

    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("Error updating password:", error);
    const firebaseError = error as { code?: string };

    if (firebaseError.code === "auth/weak-password") {
      return {
        success: false,
        error: "Password terlalu lemah (minimal 6 karakter)",
      };
    }
    if (firebaseError.code === "auth/requires-recent-login") {
      return {
        success: false,
        error: "Silakan login ulang untuk mengubah password",
      };
    }

    return { success: false, error: "Gagal mengubah password" };
  }
};
