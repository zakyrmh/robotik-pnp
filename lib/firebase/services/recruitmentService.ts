// @/lib/services/recruitmentService.ts
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";

// Service khusus untuk urusan data Caang
export const RecruitmentService = {
  // 1. Ambil User Caang
  async getCaangUsers(): Promise<User[]> {
    const usersRef = collection(db, "users_new");
    const q = query(usersRef, where("roles.isCaang", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  },

  // 2. Ambil Registrasi berdasarkan ID (Batch/All)
  async getRegistrations(regIds: string[]): Promise<Map<string, Registration>> {
    const regMap = new Map<string, Registration>();
    if (regIds.length === 0) return regMap;

    // Note: Firebase 'in' query limit is 10/30. Jika data banyak, fetch all atau chunking.
    // Disini kita fetch all untuk simplifikasi sesuai kode lama
    const regRef = collection(db, "registrations");
    const snap = await getDocs(regRef);

    snap.forEach((doc) => {
      if (regIds.includes(doc.id)) {
        regMap.set(doc.id, { id: doc.id, ...doc.data() } as Registration);
      }
    });
    return regMap;
  },

  // 3. Action Verify
  async verifyPayment(regId: string) {
    const regRef = doc(db, "registrations", regId);
    return updateDoc(regRef, {
      "payment.verified": true,
      "payment.verifiedAt": Timestamp.now(),
      status: "verified",
    });
  },

  // 4. Action Blacklist
  async blacklistUser(
    userId: string,
    adminId: string,
    reason: string,
    period: string
  ) {
    const userRef = doc(db, "users_new", userId);
    return updateDoc(userRef, {
      isActive: false,
      blacklistInfo: {
        isBlacklisted: true,
        reason,
        bannedAt: Timestamp.now(),
        bannedBy: adminId,
        period,
      },
    });
  },

  // 5. Bulk Verify Payment
  async bulkVerifyPayments(regIds: string[]) {
    const batch = writeBatch(db);

    regIds.forEach((id) => {
      const ref = doc(db, "registrations", id);
      batch.update(ref, {
        "payment.verified": true,
        "payment.verifiedAt": Timestamp.now(),
        status: "verified",
      });
    });

    await batch.commit();
  },

  // 6. Bulk Blacklist Users
  async bulkBlacklistUsers(
    userIds: string[],
    adminId: string,
    reason: string,
    period: string
  ) {
    const batch = writeBatch(db);
    const bannedAt = Timestamp.now();

    userIds.forEach((id) => {
      const ref = doc(db, "users_new", id);
      batch.update(ref, {
        isActive: false,
        blacklistInfo: {
          isBlacklisted: true,
          reason: reason,
          bannedAt: bannedAt,
          bannedBy: adminId,
          period: period,
        },
      });
    });

    await batch.commit();
  },
  // 7. Verify Form Data (Step 1 - Personal Data)
  async verifyFormData(regId: string, adminId: string) {
    const regRef = doc(db, "registrations", regId);
    return updateDoc(regRef, {
      "stepVerifications.step1FormData.verified": true,
      "stepVerifications.step1FormData.verifiedAt": Timestamp.now(),
      "stepVerifications.step1FormData.verifiedBy": adminId,
      status: "form_verified", // Update status agar caang bisa upload dokumen
    });
  },

  // 8. Verify Documents (Step 2 - Documents Upload)
  async verifyDocuments(regId: string, adminId: string) {
    const regRef = doc(db, "registrations", regId);
    return updateDoc(regRef, {
      "stepVerifications.step2Documents.verified": true,
      "stepVerifications.step2Documents.verifiedAt": Timestamp.now(),
      "stepVerifications.step2Documents.verifiedBy": adminId,
      status: "documents_uploaded", // Update status agar caang bisa upload pembayaran
    });
  },

  // 9. Bulk Verify Form Data (Step 1 - Personal Data)
  async bulkVerifyFormData(regIds: string[], adminId: string) {
    const batch = writeBatch(db);
    const verifiedAt = Timestamp.now();

    regIds.forEach((id) => {
      const ref = doc(db, "registrations", id);
      batch.update(ref, {
        "stepVerifications.step1FormData.verified": true,
        "stepVerifications.step1FormData.verifiedAt": verifiedAt,
        "stepVerifications.step1FormData.verifiedBy": adminId,
        status: "form_verified",
      });
    });

    await batch.commit();
  },
};
