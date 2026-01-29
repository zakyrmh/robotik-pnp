import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  RecruitmentSettings,
  RecruitmentSettingsFormData,
  RecruitmentSettingsSchema,
} from "@/schemas/recruitment-settings";

// ---------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------

// Collection dan Document ID untuk singleton pattern
const COLLECTION_NAME = "configs";
const DOCUMENT_ID = "recruitment_settings";

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Konversi Date ke Firestore Timestamp
 */
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Konversi form data ke format Firestore
 */
function formDataToFirestore(
  data: RecruitmentSettingsFormData,
  userId: string,
): Record<string, unknown> {
  return {
    activePeriod: data.activePeriod,
    activeYear: data.activeYear,
    registrationFee: data.registrationFee,
    schedule: {
      openDate: dateToTimestamp(data.schedule.openDate),
      closeDate: dateToTimestamp(data.schedule.closeDate),
    },
    contactPerson: data.contactPerson.map((cp) => ({
      name: cp.name,
      whatsapp: cp.whatsapp,
    })),
    // [BARU] External Links
    externalLinks: {
      groupChatUrl: data.externalLinks?.groupChatUrl || "",
      guidebookUrl: data.externalLinks?.guidebookUrl || "",
      faqUrl: data.externalLinks?.faqUrl || "",
      instagramRobotikUrl: data.externalLinks?.instagramRobotikUrl || "",
      instagramMrcUrl: data.externalLinks?.instagramMrcUrl || "",
      youtubeRobotikUrl: data.externalLinks?.youtubeRobotikUrl || "",
    },
    bankAccounts: data.bankAccounts.map((acc) => ({
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      accountHolder: acc.accountHolder,
    })),
    eWallets: data.eWallets.map((wallet) => ({
      provider: wallet.provider,
      number: wallet.number,
      accountHolder: wallet.accountHolder,
    })),
    isRegistrationOpen: data.isRegistrationOpen,
    announcementMessage: data.announcementMessage || "",
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
}

// ---------------------------------------------------------
// SERVICE FUNCTIONS
// ---------------------------------------------------------

/**
 * Mengambil pengaturan recruitment dari Firestore.
 * Menggunakan singleton pattern dengan document ID tetap.
 *
 * @returns RecruitmentSettings | null
 */
export async function getRecruitmentSettings(): Promise<RecruitmentSettings | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("[SettingsService] No recruitment settings found");
      return null;
    }

    const rawData = docSnap.data();

    // Migration: Handle legacy contactPerson (object -> array)
    if (rawData.contactPerson && !Array.isArray(rawData.contactPerson)) {
      rawData.contactPerson = [rawData.contactPerson];
    }

    // Parse dan validasi dengan Zod schema
    const parseResult = RecruitmentSettingsSchema.safeParse(rawData);

    if (!parseResult.success) {
      console.error(
        "[SettingsService] Invalid data format:",
        parseResult.error.flatten(),
      );
      return null;
    }

    return parseResult.data;
  } catch (error) {
    console.error(
      "[SettingsService] Error fetching recruitment settings:",
      error,
    );
    throw error;
  }
}

/**
 * Menyimpan atau memperbarui pengaturan recruitment ke Firestore.
 * Menggunakan setDoc dengan merge: true untuk update parsial.
 *
 * @param data - Data form yang sudah divalidasi
 * @param userId - ID user yang melakukan update (untuk audit)
 * @returns Promise<void>
 */
export async function updateRecruitmentSettings(
  data: RecruitmentSettingsFormData,
  userId: string,
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const firestoreData = formDataToFirestore(data, userId);

    // Gunakan setDoc dengan merge untuk create or update
    await setDoc(docRef, firestoreData, { merge: true });

    console.log("[SettingsService] Recruitment settings updated successfully");
  } catch (error) {
    console.error(
      "[SettingsService] Error updating recruitment settings:",
      error,
    );
    throw error;
  }
}

/**
 * Mengecek apakah pendaftaran sedang dibuka.
 * Kombinasi dari isRegistrationOpen dan jadwal.
 *
 * @returns boolean
 */
export async function isRegistrationCurrentlyOpen(): Promise<boolean> {
  try {
    const settings = await getRecruitmentSettings();

    if (!settings) {
      return false;
    }

    // Cek master switch
    if (!settings.isRegistrationOpen) {
      return false;
    }

    // Cek jadwal
    const now = new Date();
    const openDate = settings.schedule.openDate;
    const closeDate = settings.schedule.closeDate;

    return now >= openDate && now <= closeDate;
  } catch (error) {
    console.error(
      "[SettingsService] Error checking registration status:",
      error,
    );
    return false;
  }
}

/**
 * Mengambil daftar metode pembayaran aktif.
 * Berguna untuk form pendaftaran caang.
 *
 * @returns PaymentMethod[] | null
 */
export async function getActivePaymentMethods(): Promise<{
  bankAccounts: RecruitmentSettings["bankAccounts"];
  eWallets: RecruitmentSettings["eWallets"];
} | null> {
  try {
    const settings = await getRecruitmentSettings();

    if (!settings) {
      return null;
    }

    return {
      bankAccounts: settings.bankAccounts,
      eWallets: settings.eWallets,
    };
  } catch (error) {
    console.error("[SettingsService] Error fetching payment methods:", error);
    return null;
  }
}
