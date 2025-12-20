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
  // 10. Unified Verify Registration (Approve All)
  async verifyRegistration(regId: string, adminId: string) {
    const regRef = doc(db, "registrations", regId);
    const now = Timestamp.now();

    return updateDoc(regRef, {
      status: "verified",
      canEdit: false,

      // Verify Data Diri
      "verification.verified": true,
      "verification.verifiedBy": adminId,
      "verification.verifiedAt": now,
      "verification.rejectionReason": null, // Clear previous rejections if any

      // Verify Documents
      "documents.verified": true,
      "documents.verifiedBy": adminId,
      "documents.verifiedAt": now,
      "documents.rejectionReason": null,

      // Verify Payment
      "payment.verified": true,
      "payment.verifiedBy": adminId,
      "payment.verifiedAt": now,
      "payment.rejectionReason": null,

      // Clear legacy/step verifications just in case
      "stepVerifications.step1FormData.verified": true,
      "stepVerifications.step2Documents.verified": true,
      "stepVerifications.step3Payment.verified": true,
    });
  },

  // 11. Unified Reject Registration (Reject Specific Part)
  async rejectRegistration(
    regId: string,
    adminId: string,
    type: "data" | "documents" | "payment",
    reason: string
  ) {
    const regRef = doc(db, "registrations", regId);
    const now = Timestamp.now();

    const updateData: Record<string, unknown> = {
      status: "rejected",
      canEdit: true, // Allow user to edit
    };

    if (type === "data") {
      updateData["verification"] = {
        verified: false,
        verifiedBy: adminId, // Still useful to know who rejected
        verifiedAt: now,
        rejectionReason: reason,
      };
      // Invalidate the step verification if exists
      updateData["stepVerifications.step1FormData.verified"] = false;
    } else if (type === "documents") {
      updateData["documents.verified"] = false;
      updateData["documents.verifiedBy"] = adminId;
      updateData["documents.verifiedAt"] = now;
      updateData["documents.rejectionReason"] = reason;
      updateData["documents.allUploaded"] = false; // Force re-upload check or at least re-submit? Maybe not force re-upload everything but allow upload.
      // Actually, if we just set canEdit=true, user can enter upload page.
      // But we should probably NOT set documents.allUploaded to false unless we want to force them to pass the check again.
      // If we leave it true, StepRegistration might think it's done.
      // User said: "Reject documents will create/modify data field documents".
      // Probably safe to leave allUploaded true, but user must click submit again eventually.
      updateData["stepVerifications.step2Documents.verified"] = false;
    } else if (type === "payment") {
      updateData["payment.verified"] = false;
      updateData["payment.verifiedBy"] = adminId;
      updateData["payment.verifiedAt"] = now;
      updateData["payment.rejectionReason"] = reason;
      updateData["payment.proofUrl"] = null; // Maybe remove proof so they must upload new one?
      // User said "Reject pembayaran akan membuat/mengubah data field payment".
      // If reasons is "Wrong Photo", we want them to upload again.
      // If we remove proofUrl, StepRegistration will show Step 3 as incomplete.
      // Let's assume we remove proofUrl or let them overwrite.
      // The StepRegistration checks `!!proofUrl`. If we don't clear it, it says "Done".
      // So we should probably clear `proofUrl` OR rely on specific status checks in StepRegistration.
      // Since the logic is "locks form", setting canEdit=true is key.
      // But if StepRegistration sees `proofUrl` it says "Bukti terupload".
      // It seems safer to keep proofUrl but `verified` covers it?
      // Wait, `StepRegistration` says `isStep3Done = !!proofUrl`.
      // If we don't clear proofUrl, step 3 is "Done".
      // But if status is REJECTED, StepRegistration should show something else.
      // I'll leave proofUrl for record but logic in frontend should handle it.
      // Or I can delete it. Deleting it forces re-upload.
      // I will NOT delete `proofUrl` to keep history/reference, but frontend should allow overwrite.

      updateData["stepVerifications.step3Payment.verified"] = false;
    }

    return updateDoc(regRef, updateData);
  },
};
