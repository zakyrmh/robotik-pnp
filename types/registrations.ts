import { Division, PaymentMethod, RegistrationStatus } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Registration {
  id: string;
  userId: string;
  
  // OR Info
  orPeriod: string; // e.g., "OR 21"
  orYear: string; // e.g., "2025-2026"
  batch: number; // Gelombang 1, 2, dst
  
  // Registration ID
  registrationNumber: number; // Auto-increment per OR period
  registrationId: string; // e.g., "CAANG-OR21-0042"
  
  // Status
  status: RegistrationStatus;
  
  // Documents
  documents: RegistrationDocuments;
  
  // Payment
  payment: PaymentData;
  
  // Verification
  verification?: VerificationData;
  
  // Motivation & Experience
  motivation: string;
  experience?: string;
  preferredDivision?: Division;
  
  // Editable
  canEdit: boolean; // Bisa edit atau sudah locked
  
  // Timestamps
  submittedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RegistrationDocuments {
  photoUrl?: string; // Pas foto
  ktmUrl?: string; // KTM
  igRobotikFollowUrl?: string; // Screenshot follow IG Robotik
  igMrcFollowUrl?: string; // Screenshot follow IG MRC
  youtubeSubscribeUrl?: string; // Screenshot subscribe YouTube
  uploadedAt?: Timestamp;
  allUploaded: boolean;
}

export interface PaymentData {
  amount: number; // e.g., 10000
  method: PaymentMethod;
  
  // Bank Transfer
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  // E-Wallet
  ewalletProvider?: string; // GoPay, OVO, Dana, dll
  ewalletNumber?: string;
  
  // Proof
  proofUrl?: string; // Bukti pembayaran
  proofUploadedAt?: Timestamp;
  
  // Verification
  verified: boolean;
  verifiedBy?: string; // Admin user ID
  verifiedAt?: Timestamp;
  rejectionReason?: string;
}

export interface VerificationData {
  verified: boolean;
  verifiedBy: string; // Admin user ID
  verifiedAt: Timestamp;
  notes?: string;
  rejectionReason?: string;
}