import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { User } from "@/schemas/users";
import { Registration } from "@/schemas/registrations";

// =========================================================
// TYPES
// =========================================================

export interface CaangData {
  user: User;
  registration: Registration | null;
}

export interface CaangStats {
  total: number;
  pendingVerification: number;
  verified: number;
  blacklisted: number;
}

// =========================================================
// SERVICES
// =========================================================

/**
 * Mengambil semua user dengan role isCaang = true
 */
export async function getAllCaangUsers(): Promise<CaangData[]> {
  try {
    // Query users where roles.isCaang = true
    const usersRef = collection(db, "users_new");
    const q = query(usersRef, where("roles.isCaang", "==", true));
    const querySnapshot = await getDocs(q);

    const caangDataList: CaangData[] = [];

    for (const userDoc of querySnapshot.docs) {
      const userData = { id: userDoc.id, ...userDoc.data() } as User;

      // Fetch registration data for this user
      let registrationData: Registration | null = null;
      try {
        const regRef = doc(db, "registrations", userDoc.id);
        const regSnap = await getDoc(regRef);
        if (regSnap.exists()) {
          registrationData = {
            id: regSnap.id,
            ...regSnap.data(),
          } as Registration;
        }
      } catch {
        console.warn(`Registration not found for user: ${userDoc.id}`);
      }

      caangDataList.push({
        user: userData,
        registration: registrationData,
      });
    }

    return caangDataList;
  } catch (error) {
    console.error("Error fetching caang users:", error);
    throw error;
  }
}

/**
 * Menghitung statistik caang
 */
export function calculateCaangStats(caangList: CaangData[]): CaangStats {
  const total = caangList.length;
  let pendingVerification = 0;
  let verified = 0;
  let blacklisted = 0;

  for (const caang of caangList) {
    // Check blacklist status
    if (caang.user.blacklistInfo?.isBlacklisted) {
      blacklisted++;
      continue;
    }

    // Check registration status
    if (caang.registration) {
      if (caang.registration.status === "verified") {
        verified++;
      } else if (caang.registration.status === "submitted") {
        pendingVerification++;
      }
    }
  }

  return {
    total,
    pendingVerification,
    verified,
    blacklisted,
  };
}

/**
 * Mengambil detail Caang berdasarkan user ID
 */
export async function getCaangDetail(
  userId: string,
): Promise<CaangData | null> {
  try {
    // Fetch user
    const userRef = doc(db, "users_new", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = { id: userSnap.id, ...userSnap.data() } as User;

    // Fetch registration
    let registrationData: Registration | null = null;
    try {
      const regRef = doc(db, "registrations", userId);
      const regSnap = await getDoc(regRef);
      if (regSnap.exists()) {
        registrationData = {
          id: regSnap.id,
          ...regSnap.data(),
        } as Registration;
      }
    } catch {
      console.warn(`Registration not found for user: ${userId}`);
    }

    return {
      user: userData,
      registration: registrationData,
    };
  } catch (error) {
    console.error("Error fetching caang detail:", error);
    throw error;
  }
}

/**
 * Blacklist user caang
 */
export async function blacklistCaang(
  userId: string,
  reason: string,
  bannedBy: string,
): Promise<void> {
  try {
    const userRef = doc(db, "users_new", userId);

    await updateDoc(userRef, {
      "blacklistInfo.isBlacklisted": true,
      "blacklistInfo.reason": reason,
      "blacklistInfo.bannedAt": Timestamp.now(),
      "blacklistInfo.bannedBy": bannedBy,
      "blacklistInfo.period": "permanent",
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error blacklisting caang:", error);
    throw error;
  }
}

/**
 * Unblacklist user caang
 */
export async function unblacklistCaang(userId: string): Promise<void> {
  try {
    const userRef = doc(db, "users_new", userId);

    await updateDoc(userRef, {
      "blacklistInfo.isBlacklisted": false,
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error unblacklisting caang:", error);
    throw error;
  }
}

/**
 * Verifikasi registrasi caang (status: submitted -> verified)
 */
export async function verifyRegistration(
  userId: string,
  verifiedBy: string,
): Promise<void> {
  try {
    const regRef = doc(db, "registrations", userId);

    await updateDoc(regRef, {
      status: "verified",
      "verification.verified": true,
      "verification.verifiedBy": verifiedBy,
      "verification.verifiedAt": Timestamp.now(),
      canEdit: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error verifying registration:", error);
    throw error;
  }
}

/**
 * Reject registrasi caang (status: submitted -> rejected)
 */
export async function rejectRegistration(
  userId: string,
  rejectedBy: string,
  reason: string,
): Promise<void> {
  try {
    const regRef = doc(db, "registrations", userId);

    await updateDoc(regRef, {
      status: "rejected",
      "verification.verified": false,
      "verification.verifiedBy": rejectedBy,
      "verification.verifiedAt": Timestamp.now(),
      "verification.rejectionReason": reason,
      canEdit: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error rejecting registration:", error);
    throw error;
  }
}

/**
 * Request revision - Kembalikan ke caang untuk diperbaiki (status: submitted -> in_progress)
 * Caang akan bisa mengedit datanya kembali
 */
export async function requestRevision(
  userId: string,
  reviewedBy: string,
  reason: string,
): Promise<void> {
  try {
    const regRef = doc(db, "registrations", userId);

    await updateDoc(regRef, {
      status: "in_progress",
      "verification.verified": false,
      "verification.verifiedBy": reviewedBy,
      "verification.verifiedAt": Timestamp.now(),
      "verification.rejectionReason": reason,
      "verification.notes":
        "Perlu revisi - silakan perbaiki data dan submit ulang",
      canEdit: true,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error requesting revision:", error);
    throw error;
  }
}
