import { z } from "zod";

export const eventMemberSchema = z.object({
  full_name: z.string().min(2, "Nama anggota minimal 2 karakter"),
  photo_url: z.string().url("URL foto anggota harus valid"),
  role_in_team: z.string().default("Anggota"),
});

export const eventRegistrationSchema = z.object({
  category_id: z.string().uuid("Kategori lomba tidak valid"),
  team_name: z.string().min(2, "Nama tim minimal 2 karakter"),
  institution: z.string().min(2, "Nama instansi minimal 2 karakter"),
  origin_city: z.string().min(2, "Kota asal minimal 2 karakter"),
  advisor_name: z.string().optional(),
  team_email: z.string().email("Email tim tidak valid"),
  team_whatsapp: z.string().min(9, "Nomor WhatsApp tidak valid"),
  rules_version_id: z.string().uuid("Versi aturan tidak valid").optional(),
  accept_rules: z.literal(true, {
    message: "Anda harus menyetujui aturan perlombaan",
  }),
  members: z.array(eventMemberSchema).min(1, "Minimal harus ada 1 anggota tim"),
});

export const eventCategorySchema = z.object({
  slug: z.string().min(2, "Slug minimal 2 karakter"),
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional(),
  registration_fee: z.number().min(0, "Biaya registrasi tidak boleh negatif"),
  max_team_members: z.number().min(1, "Maksimal anggota minimal 1"),
  quota: z.number().min(1, "Kuota minimal 1"),
  is_active: z.boolean().default(true),
});

export const manualPaymentVerificationSchema = z.object({
  registration_id: z.string().uuid("ID Pendaftaran tidak valid"),
  manual_payment_proof_url: z.string().url("URL bukti pembayaran harus valid"),
});

export const faceVerificationSchema = z.object({
  member_qr_token: z.string().uuid("QR Token anggota tidak valid"),
  result: z.enum(["verified", "mismatch"]),
  notes: z.string().optional(),
});

export const eventViolationSchema = z.object({
  registration_id: z.string().uuid("ID Pendaftaran tidak valid"),
  violation_type: z.string().min(2, "Jenis pelanggaran harus diisi"),
  description: z.string().optional(),
  warning_number: z.number().min(1, "Nomor peringatan minimal 1"),
  status: z.enum(["active", "dq_confirmed", "appealed"]).default("active"),
});

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type EventMemberInput = z.infer<typeof eventMemberSchema>;
export type EventCategoryInput = z.infer<typeof eventCategorySchema>;
export type ManualPaymentVerificationInput = z.infer<typeof manualPaymentVerificationSchema>;
export type FaceVerificationInput = z.infer<typeof faceVerificationSchema>;
export type EventViolationInput = z.infer<typeof eventViolationSchema>;
