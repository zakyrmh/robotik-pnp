import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------
// 1. HELPER (Timestamp Schema)
// ---------------------------------------------------------

// Helper standar (sama seperti sebelumnya)
const TimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
  ])
  .transform((data) => {
    if (data instanceof Timestamp) return data.toDate();
    if (typeof data === "string") return new Date(data);
    return data;
  });

// Optional Timestamp (untuk field audit/null)
const OptionalTimestampSchema = z
  .union([
    z.custom<Timestamp>((data) => data instanceof Timestamp),
    z.date(),
    z.string().datetime(),
    z.null(),
    z.undefined(),
  ])
  .transform((data) => {
    if (data === null || data === undefined) return null;
    if (data instanceof Timestamp) return data.toDate();
    if (typeof data === "string") return new Date(data);
    return data;
  })
  .nullable()
  .optional();

// ---------------------------------------------------------
// 2. SUB-SCHEMAS
// ---------------------------------------------------------

export const ScheduleSchema = z.object({
  openDate: TimestampSchema,
  closeDate: TimestampSchema,
});

export const ContactPersonSchema = z.object({
  name: z.string().min(1, "Nama kontak wajib diisi"),
  whatsapp: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 karakter")
    .regex(/^[0-9+]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
});

// [BARU] Schema untuk Akun Bank
export const BankAccountSchema = z.object({
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  accountHolder: z.string().min(1, "Nama pemilik rekening wajib diisi"),
});

// [BARU] Schema untuk E-Wallet
export const EWalletSchema = z.object({
  provider: z.string().min(1, "Nama e-wallet wajib diisi"), // e.g. OVO, DANA
  number: z.string().min(1, "Nomor e-wallet wajib diisi"),
  accountHolder: z.string().min(1, "Nama pemilik e-wallet wajib diisi"),
});

// [BARU] Schema untuk Link Eksternal (Grup WA, Guidebook)
export const ExternalLinksSchema = z.object({
  groupChatUrl: z
    .string()
    .url("Link grup tidak valid")
    .optional()
    .or(z.literal("")),
  guidebookUrl: z
    .string()
    .url("Link guidebook tidak valid")
    .optional()
    .or(z.literal("")),
  faqUrl: z.string().url("Link FAQ tidak valid").optional().or(z.literal("")),
  instagramRobotikUrl: z
    .string()
    .url("Link Instagram tidak valid")
    .optional()
    .or(z.literal("")),
  instagramMrcUrl: z
    .string()
    .url("Link Instagram MRC tidak valid")
    .optional()
    .or(z.literal("")),
  youtubeRobotikUrl: z
    .string()
    .url("Link YouTube tidak valid")
    .optional()
    .or(z.literal("")),
});

// ---------------------------------------------------------
// 3. MAIN SCHEMA (Recruitment Settings)
// ---------------------------------------------------------

export const RecruitmentSettingsSchema = z.object({
  // Identitas Periode
  activePeriod: z.string().min(1, "Periode aktif wajib diisi"),
  activeYear: z.string().min(1, "Tahun aktif wajib diisi"),

  // Keuangan
  registrationFee: z.number().min(0).default(0),

  // Metode Pembayaran (Multiple)
  bankAccounts: z.array(BankAccountSchema).default([]),
  eWallets: z.array(EWalletSchema).default([]),

  // Jadwal
  schedule: ScheduleSchema,

  // Komunikasi
  contactPerson: z.array(ContactPersonSchema).default([]),

  // [BARU] Link Penting
  externalLinks: ExternalLinksSchema.optional(),

  // Kontrol Sistem
  isRegistrationOpen: z.boolean().default(false),
  announcementMessage: z.string().optional().default(""),

  // Audit
  updatedAt: OptionalTimestampSchema,
  updatedBy: z.string().optional(),
});

// ---------------------------------------------------------
// 4. FORM SCHEMA (Untuk React Hook Form)
// ---------------------------------------------------------

/**
 * PERBAIKAN UTAMA:
 * Menggunakan z.coerce.number() dan z.coerce.date()
 * Ini memperbaiki error type dan masalah input HTML string
 */
export const RecruitmentSettingsFormSchema = z
  .object({
    activePeriod: z.string().min(1, "Periode aktif wajib diisi"),
    activeYear: z.string().min(1, "Tahun aktif wajib diisi"),

    // Gunakan coerce agar string "10000" dari input form otomatis jadi number 10000
    registrationFee: z.coerce.number().min(0, "Biaya tidak boleh negatif"),

    schedule: z.object({
      // Gunakan coerce agar string "2024-01-01" dari datepicker otomatis jadi Date object
      openDate: z.coerce.date(),
      closeDate: z.coerce.date(),
    }),

    contactPerson: z
      .array(
        z.object({
          name: z.string().min(1, "Nama kontak wajib diisi"),
          whatsapp: z
            .string()
            .min(10, "Nomor WhatsApp minimal 10 karakter")
            .regex(/^[0-9+]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
        }),
      )
      .min(1, "Minimal satu kontak person harus ditambahkan"),

    // [BARU] Field Form untuk Link
    externalLinks: z.object({
      groupChatUrl: z.string().optional(),
      guidebookUrl: z.string().optional(),
      faqUrl: z.string().optional(),
      instagramRobotikUrl: z.string().optional(),
      instagramMrcUrl: z.string().optional(),
      youtubeRobotikUrl: z.string().optional(),
    }),

    // Bank Accounts (array of objects)
    bankAccounts: z.array(BankAccountSchema).default([]),
    // .min(1, "Minimal satu akun bank harus ditambahkan"), // Optional: bisa juga kosong jika e-wallet ada

    // E-Wallets (array of objects)
    eWallets: z.array(EWalletSchema).default([]),

    isRegistrationOpen: z.boolean(),

    announcementMessage: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validasi tanggal di level parent untuk menjaga type inference
    if (data.schedule.closeDate < data.schedule.openDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal tutup tidak boleh sebelum tanggal buka",
        path: ["schedule", "closeDate"],
      });
    }
  });

// ---------------------------------------------------------
// 5. EXPORT TYPES
// ---------------------------------------------------------

export type Schedule = z.infer<typeof ScheduleSchema>;
export type ContactPerson = z.infer<typeof ContactPersonSchema>;
export type BankAccount = z.infer<typeof BankAccountSchema>;
export type EWallet = z.infer<typeof EWalletSchema>;
export type ExternalLinks = z.infer<typeof ExternalLinksSchema>;
export type RecruitmentSettings = z.infer<typeof RecruitmentSettingsSchema>;
export type RecruitmentSettingsFormData = z.infer<
  typeof RecruitmentSettingsFormSchema
>;

// ---------------------------------------------------------
// 6. DEFAULT VALUES
// ---------------------------------------------------------

export const DEFAULT_RECRUITMENT_SETTINGS: RecruitmentSettingsFormData = {
  activePeriod: "",
  activeYear: "",
  registrationFee: 0,
  schedule: {
    openDate: new Date(),
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  contactPerson: [
    {
      name: "",
      whatsapp: "",
    },
  ],
  externalLinks: {
    groupChatUrl: "",
    guidebookUrl: "",
    faqUrl: "",
    instagramRobotikUrl: "",
    instagramMrcUrl: "",
    youtubeRobotikUrl: "",
  },
  bankAccounts: [
    {
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    },
  ],
  eWallets: [
    {
      provider: "",
      number: "",
      accountHolder: "",
    },
  ],
  isRegistrationOpen: false,
  announcementMessage: "",
};
