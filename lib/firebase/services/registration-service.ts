import { db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { Registration, StepVerificationData, VerificationData } from "@/types/registrations";
import { RegistrationStatus, PaymentMethod } from "@/types/enum";

/**
 * Get registration data by user ID
 */
export const getRegistration = async (
  uid: string
): Promise<Registration | null> => {
  try {
    const registRef = doc(db, "registrations", uid);
    const registSnap = await getDoc(registRef);

    if (!registSnap.exists()) {
      return null;
    }

    return { id: registSnap.id, ...registSnap.data() } as Registration;
  } catch (error) {
    console.error("Error getting registration:", error);
    throw error;
  }
};

/**
 * Initialize registration document for new user
 */
export const initializeRegistration = async (
  uid: string,
  orPeriod: string,
  orYear: string
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);
    const registSnap = await getDoc(registRef);

    if (registSnap.exists()) {
      return; // Already initialized
    }

    const initialData: Partial<Registration> = {
      id: uid,
      orPeriod,
      orYear,
      registrationId: `REG-${orYear}-${uid.substring(0, 8).toUpperCase()}`,
      status: RegistrationStatus.DRAFT,
      stepVerifications: {
        step1FormData: { verified: false },
        step2Documents: { verified: false },
        step3Payment: { verified: false },
      },
      documents: {
        allUploaded: false,
      },
      payment: {
        method: PaymentMethod.TRANSFER,
        verified: false,
      },
      motivation: "",
      canEdit: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(registRef, initialData);
  } catch (error) {
    console.error("Error initializing registration:", error);
    throw error;
  }
};

/**
 * Check if a step can be edited based on its verification status
 */
export const canEditStep = (
  stepVerification: StepVerificationData | undefined
): boolean => {
  if (!stepVerification) return true;
  return !stepVerification.verified;
};

/**
 * Update step 1 (form data) submission status
 * This is called when user submits the fill-data form
 */
export const submitStep1FormData = async (uid: string): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);
    
    await updateDoc(registRef, {
      status: RegistrationStatus.FORM_SUBMITTED,
      submittedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error submitting step 1:", error);
    throw error;
  }
};

/**
 * Update documents upload status (Step 2)
 */
export const submitStep2Documents = async (
  uid: string,
  documents: {
    photoUrl?: string;
    ktmUrl?: string;
    igRobotikFollowUrl?: string;
    igMrcFollowUrl?: string;
    youtubeSubscribeUrl?: string;
  }
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);

    // Check if all required documents are uploaded (KTM is now optional)
    const allUploaded = !!(
      documents.photoUrl &&
      documents.igRobotikFollowUrl &&
      documents.igMrcFollowUrl &&
      documents.youtubeSubscribeUrl
    );

    await updateDoc(registRef, {
      "documents.photoUrl": documents.photoUrl,
      "documents.ktmUrl": documents.ktmUrl,
      "documents.igRobotikFollowUrl": documents.igRobotikFollowUrl,
      "documents.igMrcFollowUrl": documents.igMrcFollowUrl,
      "documents.youtubeSubscribeUrl": documents.youtubeSubscribeUrl,
      "documents.uploadedAt": Timestamp.now(),
      "documents.allUploaded": allUploaded,
      status: RegistrationStatus.DOCUMENTS_UPLOADED,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error submitting step 2:", error);
    throw error;
  }
};


/**
 * Update payment proof upload status (Step 3)
 */
export const submitStep3Payment = async (
  uid: string,
  paymentData: {
    method: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    ewalletProvider?: string;
    ewalletNumber?: string;
    proofUrl: string;
  }
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);

    await updateDoc(registRef, {
      "payment.method": paymentData.method,
      "payment.bankName": paymentData.bankName,
      "payment.accountNumber": paymentData.accountNumber,
      "payment.accountName": paymentData.accountName,
      "payment.ewalletProvider": paymentData.ewalletProvider,
      "payment.ewalletNumber": paymentData.ewalletNumber,
      "payment.proofUrl": paymentData.proofUrl,
      "payment.proofUploadedAt": Timestamp.now(),
      status: RegistrationStatus.PAYMENT_PENDING,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error submitting step 3:", error);
    throw error;
  }
};

/**
 * Admin: Verify step 1 (form data)
 */
export const verifyStep1ByAdmin = async (
  uid: string,
  adminUid: string,
  verified: boolean,
  notes?: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);

    const stepVerification: StepVerificationData = {
      verified,
      verifiedBy: adminUid,
      verifiedAt: Timestamp.now(),
      notes,
      rejectionReason,
    };

    await updateDoc(registRef, {
      "stepVerifications.step1FormData": stepVerification,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error verifying step 1:", error);
    throw error;
  }
};

/**
 * Admin: Verify step 2 (documents)
 */
export const verifyStep2ByAdmin = async (
  uid: string,
  adminUid: string,
  verified: boolean,
  notes?: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);

    const stepVerification: StepVerificationData = {
      verified,
      verifiedBy: adminUid,
      verifiedAt: Timestamp.now(),
      notes,
      rejectionReason,
    };

    await updateDoc(registRef, {
      "stepVerifications.step2Documents": stepVerification,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error verifying step 2:", error);
    throw error;
  }
};

/**
 * Admin: Verify step 3 (payment)
 */
export const verifyStep3ByAdmin = async (
  uid: string,
  adminUid: string,
  verified: boolean,
  notes?: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const registRef = doc(db, "registrations", uid);

    const stepVerification: StepVerificationData = {
      verified,
      verifiedBy: adminUid,
      verifiedAt: Timestamp.now(),
      notes,
      rejectionReason,
    };

    const updateData: Record<string, Timestamp | boolean | string | StepVerificationData | VerificationData | RegistrationStatus> = {
      "stepVerifications.step3Payment": stepVerification,
      "payment.verified": verified,
      "payment.verifiedBy": adminUid,
      "payment.verifiedAt": Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // If payment is verified, mark entire registration as verified
    if (verified) {
      updateData.status = RegistrationStatus.VERIFIED;
      updateData.verification = {
        verified: true,
        verifiedBy: adminUid,
        verifiedAt: Timestamp.now(),
        notes,
      };
    } else if (rejectionReason) {
      updateData["payment.rejectionReason"] = rejectionReason;
    }

    await updateDoc(registRef, updateData);
  } catch (error) {
    console.error("Error verifying step 3:", error);
    throw error;
  }
};

/**
 * Check if all steps are completed and verified
 */
export const areAllStepsVerified = (
  registration: Registration | null
): boolean => {
  if (!registration) return false;

  const { stepVerifications } = registration;
  return (
    stepVerifications.step1FormData.verified &&
    stepVerifications.step2Documents.verified &&
    stepVerifications.step3Payment.verified
  );
};
