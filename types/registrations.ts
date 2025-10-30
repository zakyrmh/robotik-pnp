import { PaymentMethod, RegistrationStatus } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Registration {
  // Samakan dengan uid document lama
  id: string;
  // Isi semua document dengan "OR 21"
  orPeriod: string;
  // Isi semuam document dengn "2025/2026"
  orYear: string;
  // Isi dengan format "CAANG-OR21-xxxx" (xxxx buat nomor urut)
  registrationId: string;
  // Isi "verified" jika field "payment_verification" di document lama bernilai true, selain itu "rejected"
  status: RegistrationStatus;

  documents: RegistrationDocuments;
  
  payment: PaymentData;
  
  verification?: VerificationData;
  
  // Isi dengan field tujuanMasuk di document lama
  motivation: string;
  // Isi dengan field riwayatOrganisasi di document lama
  experience?: string;
  // Isi dengan field riwayatPrestasi di document lama
  achievement?: string;
  
  // Isi semua dengan nilai false
  canEdit: boolean;
  
  // Kosongkan
  submittedAt?: Timestamp;
  // Isi dengan field createdAt di document lama
  createdAt: Timestamp;
  // Isi dengan field createdAt di document lama
  updatedAt: Timestamp;
}

export interface RegistrationDocuments {
  // Ambil dari field pasFoto di document lama
  photoUrl?: string;
  // Kosongkan semuanya
  ktmUrl?: string;
  // Ambil dari field followIgRobotik di document lama
  igRobotikFollowUrl?: string;
  // Ambil dari field followIgMrc di document lama
  igMrcFollowUrl?: string;
  // Ambil dari field youtubeRobotik di document lama
  youtubeSubscribeUrl?: string;
  // Kosongkan
  uploadedAt?: Timestamp;
  // true jika semua dokumen sudah diupload, false jika belum
  allUploaded: boolean;
}

export interface PaymentData {
  // Isi semua dengan "e_wallet"
  method: PaymentMethod;
  
  // Kosongkan
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  // Kosongkan
  ewalletProvider?: string;
  ewalletNumber?: string;
  
  // Ambil dari field pembayaran di document lama
  proofUrl?: string;
  // Kosongkan
  proofUploadedAt?: Timestamp;
  
  // Isi true jika field payment_verification di document lama bernilai true
  verified: boolean;
  // Isi semua dengan "l3aKAeBnV6VcJK3yCY7DXzO018Z2"
  verifiedBy?: string;
  // Kosongkan
  verifiedAt?: Timestamp;
  // Kosongkan
  rejectionReason?: string;
}

export interface VerificationData {
  // Isi true jika field payment_verification di document lama bernilai true, selain itu false
  verified: boolean;
  // Isi semua dengan "l3aKAeBnV6VcJK3yCY7DXzO018Z2"
  verifiedBy: string;
  // Isi dengan tanggal 20 September 2025 00:00:00 GMT+7
  verifiedAt: Timestamp;
  // Kosongkan
  notes?: string;
  // Kosongkans
  rejectionReason?: string;
}