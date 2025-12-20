import { Timestamp } from "firebase/firestore";

export interface Registration {
  id: string;
  orPeriod: string;
  orYear: string;
  registrationId: string;
  status: RegistrationStatus;

  documents: RegistrationDocuments;

  payment: PaymentData;

  verification?: VerificationData;

  motivation: string;
  experience?: string;
  achievement?: string;

  canEdit: boolean;

  submittedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum RegistrationStatus {
  DRAFT = "draft",
  FORM_SUBMITTED = "form_submitted",
  FORM_VERIFIED = "form_verified",
  DOCUMENTS_UPLOADED = "documents_uploaded",
  PAYMENT_PENDING = "payment_pending",
  SUBMITTED = "submitted",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export interface RegistrationDocuments {
  photoUrl?: string;
  ktmUrl?: string;
  igRobotikFollowUrl?: string;
  igMrcFollowUrl?: string;
  youtubeSubscribeUrl?: string;
  uploadedAt?: Timestamp;
  allUploaded: boolean;

  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  rejectionReason?: string;
}

export interface PaymentData {
  method: PaymentMethod;

  bankName?: string;
  accountNumber?: string;
  accountName?: string;

  ewalletProvider?: string;
  ewalletNumber?: string;

  proofUrl?: string;
  proofUploadedAt?: Timestamp;

  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  rejectionReason?: string;
}

export enum PaymentMethod {
  TRANSFER = "transfer",
  E_WALLET = "e_wallet",
  CASH = "cash",
}

export interface VerificationData {
  verified: boolean;
  verifiedBy: string;
  verifiedAt: Timestamp;
  notes?: string;
  rejectionReason?: string;
}

export interface PaymentFormState {
  method: PaymentMethod;
  bankName: string;
  accountNumber: string;
  accountName: string;
  ewalletProvider: string;
  ewalletNumber: string;
  proofUrl: string;
}
