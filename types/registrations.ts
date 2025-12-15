import { PaymentMethod, RegistrationStatus } from "@/types/enum";
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

export interface RegistrationDocuments {
  photoUrl?: string;
  ktmUrl?: string;
  igRobotikFollowUrl?: string;
  igMrcFollowUrl?: string;
  youtubeSubscribeUrl?: string;
  uploadedAt?: Timestamp;
  allUploaded: boolean;
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

export interface VerificationData {
  verified: boolean;
  verifiedBy: string;
  verifiedAt: Timestamp;
  notes?: string;
  rejectionReason?: string;
}