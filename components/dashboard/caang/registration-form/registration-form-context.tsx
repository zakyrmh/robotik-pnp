"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Registration } from "@/schemas/registrations";

// =========================================================
// TYPES
// =========================================================

export type RegistrationStep = 1 | 2 | 3 | 4;

export interface RegistrationFormContextType {
  // Current state
  currentStep: RegistrationStep;
  setCurrentStep: (step: RegistrationStep) => void;
  registration: Registration | null;
  isLoading: boolean;
  isSaving: boolean;

  // Progress flags
  canAccessStep: (step: RegistrationStep) => boolean;
  isStepCompleted: (step: RegistrationStep) => boolean;

  // Actions
  refreshRegistration: () => Promise<void>;
  updatePersonalData: (data: PersonalDataInput) => Promise<void>;
  updateDocuments: (data: DocumentsInput) => Promise<void>;
  updatePayment: (data: PaymentInput) => Promise<void>;
  submitForVerification: () => Promise<void>;
}

export interface PersonalDataInput {
  nickname: string;
  nim: string;
  phone: string;
  gender: "male" | "female";
  birthDate: Date;
  birthPlace: string;
  address: string;
  major: string;
  department: string;
  jurusanId?: string; // ID jurusan for pre-selection
  entryYear: number;
  motivation: string;
  experience?: string;
  achievement?: string;
}

export interface DocumentsInput {
  photoUrl: string;
  ktmUrl?: string;
  igRobotikFollowUrl: string;
  igMrcFollowUrl: string;
  youtubeSubscribeUrl: string;
}

export interface PaymentInput {
  method: "transfer" | "e_wallet" | "cash";
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletProvider?: string;
  ewalletNumber?: string;
  proofUrl: string;
}

// =========================================================
// CONTEXT
// =========================================================

const RegistrationFormContext = createContext<
  RegistrationFormContextType | undefined
>(undefined);

// =========================================================
// PROVIDER
// =========================================================

interface RegistrationFormProviderProps {
  children: ReactNode;
}

export function RegistrationFormProvider({
  children,
}: RegistrationFormProviderProps) {
  const { user } = useDashboard();

  // State
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch registration data
  const refreshRegistration = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const regRef = doc(db, "registrations", user.uid);
      const regSnap = await getDoc(regRef);

      if (regSnap.exists()) {
        const regData = { id: regSnap.id, ...regSnap.data() } as Registration;
        setRegistration(regData);

        // Determine current step based on progress
        const progress = regData.progress;
        if (!progress?.personalDataCompleted) {
          setCurrentStep(1);
        } else if (!progress?.documentsUploaded) {
          setCurrentStep(2);
        } else if (!progress?.paymentUploaded) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.error("Error fetching registration:", error);
    }
  }, [user?.uid]);

  // Initial fetch
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await refreshRegistration();
      setIsLoading(false);
    }
    init();
  }, [refreshRegistration]);

  // Check if step is accessible
  const canAccessStep = (step: RegistrationStep): boolean => {
    if (!registration) return step === 1;

    const progress = registration.progress;

    switch (step) {
      case 1:
        return true;
      case 2:
        return progress?.personalDataCompleted ?? false;
      case 3:
        return (
          (progress?.personalDataCompleted && progress?.documentsUploaded) ??
          false
        );
      case 4:
        return (
          (progress?.personalDataCompleted &&
            progress?.documentsUploaded &&
            progress?.paymentUploaded) ??
          false
        );
      default:
        return false;
    }
  };

  // Check if step is completed
  const isStepCompleted = (step: RegistrationStep): boolean => {
    if (!registration) return false;

    const progress = registration.progress;

    switch (step) {
      case 1:
        return progress?.personalDataCompleted ?? false;
      case 2:
        return progress?.documentsUploaded ?? false;
      case 3:
        return progress?.paymentUploaded ?? false;
      case 4:
        return (
          registration.status === "submitted" ||
          registration.status === "verified"
        );
      default:
        return false;
    }
  };

  // Update personal data (Step 1)
  const updatePersonalData = async (data: PersonalDataInput) => {
    if (!user?.uid) throw new Error("User not found");

    setIsSaving(true);

    try {
      // 1. Fetch Global Settings
      const { getRecruitmentSettings } =
        await import("@/lib/firebase/services/settings-service");
      const settings = await getRecruitmentSettings();

      if (!settings) {
        console.warn(
          "Recruitment settings not found. Using default values for period/year.",
        );
      }

      const activePeriod = settings?.activePeriod || "OR 21"; // Fallback to avoid hard failure
      const activeYear = settings?.activeYear || "2024-2025"; // Fallback

      const now = Timestamp.now();
      const regRef = doc(db, "registrations", user.uid);
      const userRef = doc(db, "users_new", user.uid);

      // Check if registration exists
      const regSnap = await getDoc(regRef);

      if (!regSnap.exists()) {
        // Create new registration
        await setDoc(regRef, {
          id: user.uid,
          orPeriod: activePeriod,
          orYear: activeYear,
          registrationId: `REG-${Date.now()}`,
          status: "draft",
          progress: {
            personalDataCompleted: true,
            personalDataAt: now,
            documentsUploaded: false,
            paymentUploaded: false,
          },
          motivation: data.motivation,
          experience: data.experience || "",
          achievement: data.achievement || "",
          canEdit: true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // Update existing registration
        // Note: orPeriod/orYear usually don't change once created, so we don't update them here
        await updateDoc(regRef, {
          "progress.personalDataCompleted": true,
          "progress.personalDataAt": now,
          motivation: data.motivation,
          experience: data.experience || "",
          achievement: data.achievement || "",
          updatedAt: now,
        });
      }

      // Update user profile
      await updateDoc(userRef, {
        "profile.nickname": data.nickname,
        "profile.nim": data.nim,
        "profile.phone": data.phone,
        "profile.gender": data.gender,
        "profile.birthDate": Timestamp.fromDate(data.birthDate),
        "profile.birthPlace": data.birthPlace,
        "profile.address": data.address,
        "profile.major": data.major,
        "profile.department": data.department,
        "profile.jurusanId": data.jurusanId || "",
        "profile.entryYear": data.entryYear,
        updatedAt: now,
      });

      await refreshRegistration();
      setCurrentStep(2);
    } finally {
      setIsSaving(false);
    }
  };

  // Update documents (Step 2)
  const updateDocuments = async (data: DocumentsInput) => {
    if (!user?.uid) throw new Error("User not found");

    setIsSaving(true);

    try {
      const now = Timestamp.now();
      const regRef = doc(db, "registrations", user.uid);

      await updateDoc(regRef, {
        documents: {
          photoUrl: data.photoUrl,
          ktmUrl: data.ktmUrl || "",
          igRobotikFollowUrl: data.igRobotikFollowUrl,
          igMrcFollowUrl: data.igMrcFollowUrl,
          youtubeSubscribeUrl: data.youtubeSubscribeUrl,
          uploadedAt: now,
          allUploaded: true,
        },
        "progress.documentsUploaded": true,
        "progress.documentsUploadedAt": now,
        status: "in_progress",
        updatedAt: now,
      });

      await refreshRegistration();
      setCurrentStep(3);
    } finally {
      setIsSaving(false);
    }
  };

  // Update payment (Step 3)
  const updatePayment = async (data: PaymentInput) => {
    if (!user?.uid) throw new Error("User not found");

    setIsSaving(true);

    try {
      const now = Timestamp.now();
      const regRef = doc(db, "registrations", user.uid);

      await updateDoc(regRef, {
        payment: {
          method: data.method,
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountName: data.accountName || "",
          ewalletProvider: data.ewalletProvider || "",
          ewalletNumber: data.ewalletNumber || "",
          proofUrl: data.proofUrl,
          proofUploadedAt: now,
          verified: false,
        },
        "progress.paymentUploaded": true,
        "progress.paymentUploadedAt": now,
        updatedAt: now,
      });

      await refreshRegistration();
      setCurrentStep(4);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for verification (Step 4)
  const submitForVerification = async () => {
    if (!user?.uid) throw new Error("User not found");

    setIsSaving(true);

    try {
      const now = Timestamp.now();
      const regRef = doc(db, "registrations", user.uid);

      await updateDoc(regRef, {
        status: "submitted",
        canEdit: false,
        submittedAt: now,
        updatedAt: now,
      });

      await refreshRegistration();
    } finally {
      setIsSaving(false);
    }
  };

  const value: RegistrationFormContextType = {
    currentStep,
    setCurrentStep,
    registration,
    isLoading,
    isSaving,
    canAccessStep,
    isStepCompleted,
    refreshRegistration,
    updatePersonalData,
    updateDocuments,
    updatePayment,
    submitForVerification,
  };

  return (
    <RegistrationFormContext.Provider value={value}>
      {children}
    </RegistrationFormContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useRegistrationForm() {
  const context = useContext(RegistrationFormContext);
  if (context === undefined) {
    throw new Error(
      "useRegistrationForm must be used within a RegistrationFormProvider",
    );
  }
  return context;
}
