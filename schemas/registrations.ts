import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Sama seperti di users.ts)
// ---------------------------------------------------------

// Menerima Timestamp (Firebase), Date (JS), atau ISO String
// Output akhirnya selalu JavaScript Date agar aman untuk Client Component
const TimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
  ])
  .transform((data) => {
    if (data instanceof Timestamp) {
      return data.toDate();
    }
    if (typeof data === "string") {
      return new Date(data);
    }
    return data;
  });

// ---------------------------------------------------------
// 2. ENUMS
// ---------------------------------------------------------

export const RegistrationStatusEnum = z.enum([
  "draft", // Data diri sudah diisi, dokumen/pembayaran belum lengkap
  "in_progress", // Sedang mengisi dokumen/pembayaran
  "submitted", // Sudah submit, menunggu verifikasi admin
  "verified", // Diterima oleh admin
  "rejected", // Ditolak oleh admin (tidak memenuhi syarat)
]);

// Progress tracking untuk setiap step pendaftaran
export const RegistrationProgressSchema = z.object({
  personalDataCompleted: z.boolean().default(false),
  personalDataAt: TimestampSchema.optional(),

  documentsUploaded: z.boolean().default(false),
  documentsUploadedAt: TimestampSchema.optional(),

  paymentUploaded: z.boolean().default(false),
  paymentUploadedAt: TimestampSchema.optional(),
});

export const PaymentMethodEnum = z.enum(["transfer", "e_wallet", "cash"]);

// ---------------------------------------------------------
// 3. SUB-SCHEMAS
// ---------------------------------------------------------

export const RegistrationDocumentsSchema = z.object({
  // Kita gunakan z.string().optional() saja (jangan .url())
  // agar support path internal Firebase Storage
  photoUrl: z.string().optional(),
  ktmUrl: z.string().optional(),
  igRobotikFollowUrl: z.string().optional(),
  igMrcFollowUrl: z.string().optional(),
  youtubeSubscribeUrl: z.string().optional(),

  uploadedAt: TimestampSchema.optional(),
  allUploaded: z.boolean().default(false),

  verified: z.boolean().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: TimestampSchema.optional(),
  rejectionReason: z.string().optional(),
});

export const PaymentDataSchema = z.object({
  method: PaymentMethodEnum,

  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),

  ewalletProvider: z.string().optional(),
  ewalletNumber: z.string().optional(),

  proofUrl: z.string().optional(), // Path storage bukti bayar
  proofUploadedAt: TimestampSchema.optional(),

  verified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
  verifiedAt: TimestampSchema.optional(),
  rejectionReason: z.string().optional(),
});

export const VerificationDataSchema = z.object({
  verified: z.boolean(),
  verifiedBy: z.string(),
  verifiedAt: TimestampSchema,
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Schema untuk Form State di Client (biasanya tanpa timestamp)
export const PaymentFormStateSchema = z.object({
  method: PaymentMethodEnum,
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  ewalletProvider: z.string(),
  ewalletNumber: z.string(),
  proofUrl: z.string(),
});

// ---------------------------------------------------------
// 4. MAIN SCHEMA
// ---------------------------------------------------------

export const RegistrationSchema = z.object({
  id: z.string(),
  orPeriod: z.string(), // e.g., "OR 21"
  orYear: z.string(), // e.g., "2025-2026"
  registrationId: z.string(), // e.g., "REG-001"
  status: RegistrationStatusEnum,
  progress: RegistrationProgressSchema.optional(),

  documents: RegistrationDocumentsSchema.optional(),
  payment: PaymentDataSchema.optional(),
  verification: VerificationDataSchema.optional(),

  motivation: z.string().default(""),
  experience: z.string().optional(),
  achievement: z.string().optional(),

  canEdit: z.boolean().default(true),

  submittedAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 5. EXPORT TYPES (Inferensi Otomatis)
// ---------------------------------------------------------

export type RegistrationStatus = z.infer<typeof RegistrationStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export type RegistrationProgress = z.infer<typeof RegistrationProgressSchema>;
export type RegistrationDocuments = z.infer<typeof RegistrationDocumentsSchema>;
export type PaymentData = z.infer<typeof PaymentDataSchema>;
export type VerificationData = z.infer<typeof VerificationDataSchema>;
export type PaymentFormState = z.infer<typeof PaymentFormStateSchema>;

export type Registration = z.infer<typeof RegistrationSchema>;
