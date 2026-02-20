import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { KriTeamEnum } from "./users";

// ---------------------------------------------------------
// 1. HELPER (Same as in registrations.ts/users.ts)
// ---------------------------------------------------------

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

export const InternshipRoleEnum = z.enum([
  "mechanic", // Mekanik
  "wiring", // Wiring
  "programmer", // Program
]);

export const InternshipConfidenceEnum = z.enum([
  "confident", // Yakin
  "doubtful", // Ragu-ragu
]);

// Bidang Magang Departemen sesuai prompt
export const InternshipDepartmentFieldEnum = z.enum([
  // Kestari
  "kestari", // Bidang Kestari

  // Metrolap (Maintenance, Produksi)
  "maintenance",
  "production",

  // Infokom (Humas, Infokom)
  "humas",
  "infokom_field", // "infokom" might conflict with Dept name, naming it infokom_field or just infokom

  // Litbang (KPSDM, Ristek)
  "kpsdm",
  "ristek",
]);

export const InternshipStatusEnum = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

// ---------------------------------------------------------
// 3. ROLLING DIVISION INTERNSHIP SCHEMA
// ---------------------------------------------------------

// Base object schema (without refinements) to allow .omit() usage in forms
export const RollingInternshipBaseSchema = z.object({
  id: z.string().optional(), // Firestore ID
  userId: z.string(), // ID Caang

  // Pilihan Role (Urutan 1-3)
  // Validation: Must be array of length 3 with unique InternshipRoleEnum values
  roleChoices: z
    .array(InternshipRoleEnum)
    .min(3, "Harus memilih 3 role")
    .max(3, "Harus memilih 3 role")
    .refine((items) => new Set(items).size === items.length, {
      message: "Role pilihan tidak boleh sama",
    }),

  roleReason: z
    .string()
    .min(10, "Alasan memilih role wajib diisi (min 10 karakter)"),
  roleSkills: z
    .string()
    .min(10, "Kemampuan/Skill wajib diisi (min 10 karakter)"),

  // Pilihan Divisi 1
  divisionChoice1: KriTeamEnum,
  divisionChoice1Confidence: InternshipConfidenceEnum,
  divisionChoice1Reason: z
    .string()
    .min(10, "Alasan pihan divisi 1 wajib diisi"),

  // Pilihan Divisi 2
  divisionChoice2: KriTeamEnum,
  divisionChoice2Confidence: InternshipConfidenceEnum,
  divisionChoice2Reason: z
    .string()
    .min(10, "Alasan pihan divisi 2 wajib diisi"),

  status: InternshipStatusEnum.default("draft"),

  submittedAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Full schema with refinements
export const RollingInternshipRegistrationSchema =
  RollingInternshipBaseSchema.refine(
    (data) => data.divisionChoice1 !== data.divisionChoice2,
    {
      message: "Divisi pilihan 1 dan 2 tidak boleh sama",
      path: ["divisionChoice2"],
    },
  );

// ---------------------------------------------------------
// 4. DEPARTMENT INTERNSHIP SCHEMA
// ---------------------------------------------------------

export const DepartmentInternshipRegistrationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),

  // Pilihan Bidang (Satu saja)
  fieldChoice: InternshipDepartmentFieldEnum,

  reason: z.string().min(10, "Alasan memilih departemen/bidang wajib diisi"),

  status: InternshipStatusEnum.default("draft"),

  submittedAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// ---------------------------------------------------------
// 5. ROLLING INTERNSHIP SCHEDULE SCHEMA
//    Collection: "internship_rolling_schedules"
//    Menyimpan jadwal rotasi divisi per user caang.
//
//    SOP Magang Rolling:
//    - Setiap caang harus magang di SEMUA 5 divisi KRI
//    - Default 2 divisi per minggu (configurable oleh admin)
//    - Minggu 1: divisi yang dipilih caang saat pendaftaran
//    - Sisa divisi di-rotate otomatis ke minggu berikutnya
//    - 1 divisi = 1 hari magang
//    - Logbook = absensi magang
// ---------------------------------------------------------

/** Satu entri jadwal per minggu */
export const RollingScheduleWeekEntrySchema = z.object({
  weekNumber: z.number().int().min(1), // Minggu ke-N (1-indexed)
  divisions: z.array(KriTeamEnum).min(1).max(5), // Daftar divisi minggu ini
  startDate: TimestampSchema.optional(), // Tanggal mulai minggu ini
  endDate: TimestampSchema.optional(), // Tanggal berakhir minggu ini
});

/** Schema utama jadwal rolling per user */
export const RollingInternshipScheduleSchema = z.object({
  id: z.string().optional(), // Firestore document ID (= userId)
  userId: z.string(), // ID Caang

  // Jadwal mingguan - berisi daftar divisi per minggu
  // Contoh: Minggu 1 -> [krai, krsbi_b], Minggu 2 -> [krsbi_h, krsti], Minggu 3 -> [krsri]
  weeks: z
    .array(RollingScheduleWeekEntrySchema)
    .min(1, "Minimal 1 minggu jadwal"),

  // Total minggu (dihitung otomatis dari ceil(5 / divisionsPerWeek))
  totalWeeks: z.number().int().min(1),

  // Jumlah divisi per minggu (default 2, bisa diubah admin menjadi 3)
  divisionsPerWeek: z.number().int().min(1).max(5).default(2),

  // Divisi pilihan caang saat pendaftaran (dari RollingInternshipRegistration)
  // Digunakan untuk menempatkan divisi pilihan di Minggu 1
  primaryDivisionChoice: KriTeamEnum, // divisionChoice1
  secondaryDivisionChoice: KriTeamEnum, // divisionChoice2

  // Siapa yang generate jadwal
  generatedBy: z.enum(["system", "admin"]).default("system"),
  // Jika admin, simpan ID admin yang mengubah
  modifiedByAdminId: z.string().optional(),

  // Status jadwal
  scheduleStatus: z
    .enum([
      "draft", // Jadwal belum final
      "active", // Jadwal aktif/berjalan
      "completed", // Semua minggu selesai
    ])
    .default("draft"),

  // Minggu saat ini yang sedang berjalan (1-indexed, null jika belum mulai)
  currentWeek: z.number().int().min(0).optional(),

  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

/** Konfigurasi jadwal rolling (singleton document di collection settings) */
export const RollingScheduleConfigSchema = z.object({
  // Jumlah divisi per minggu (default 2)
  divisionsPerWeek: z.number().int().min(1).max(5).default(2),

  // Tanggal mulai magang rolling
  internshipStartDate: TimestampSchema.optional(),

  // Apakah jadwal sudah di-generate untuk batch saat ini
  isScheduleGenerated: z.boolean().default(false),

  // Apakah jadwal visible/terlihat oleh caang (default false, admin harus aktifkan)
  isScheduleVisible: z.boolean().default(false),

  // Daftar divisi yang ikut rolling (default semua 5)
  activeDivisions: z
    .array(KriTeamEnum)
    .default(["krai", "krsbi_h", "krsbi_b", "krsti", "krsri"]),

  updatedAt: TimestampSchema,
  updatedBy: z.string().optional(),
});

// ---------------------------------------------------------
// 6. INTERNSHIP LOGBOOK SCHEMA (Basic structure)
// ---------------------------------------------------------

export const InternshipLogbookEntrySchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  internshipType: z.enum(["rolling", "department", "fixed"]),

  // [BARU] Konteks & Detail
  targetDivision: z.string().min(1, "Divisi kegiatan wajib diisi"),
  activityType: z.string().min(1, "Jenis kegiatan wajib diisi"), // e.g., "Mekanik", "Wiring", "Programming"

  date: TimestampSchema,
  duration: z.coerce.number().min(1, "Durasi (menit) wajib diisi"),

  activity: z.string().min(10, "Uraian kegiatan wajib diisi (min 10 karakter)"),
  outcome: z.string().min(5, "Hasil/Capaian wajib diisi"),

  documentationUrls: z
    .array(z.string().url())
    .min(1, "Minimal 1 foto dokumentasi")
    .max(5, "Maksimal 5 foto dokumentasi"),

  status: z
    .enum(["draft", "submitted", "approved", "rejected"])
    .default("draft"),
  statusReason: z.string().optional(),

  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  deletedAt: TimestampSchema.optional(), // For soft delete
});

// ---------------------------------------------------------
// 7. HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Mendapatkan nama jenis magang yang readable
 */
export function getInternshipTypeDisplayName(type: string): string {
  switch (type) {
    case "rolling":
      return "Divisi (Rolling)";
    case "department":
      return "Departemen";
    case "fixed":
      return "Tetap";
    default:
      return type;
  }
}

/**
 * Mendapatkan nama divisi/bidang target yang readable
 */
export function getDivisionDisplayName(type: string, division: string): string {
  if (type === "rolling") {
    const names: Record<string, string> = {
      krai: "KRAI",
      krsbi_h: "KRSBI Humanoid",
      krsbi_b: "KRSBI Beroda",
      krsti: "KRSTI",
      krsri: "KRSRI",
    };
    return names[division] || division;
  }

  if (type === "department") {
    const names: Record<string, string> = {
      kestari: "Kestari",
      maintenance: "Maintenance",
      production: "Produksi",
      humas: "Humas",
      infokom_field: "Infokom",
      kpsdm: "KPSDM",
      ristek: "Ristek",
    };
    return names[division] || division;
  }

  return division;
}

// ---------------------------------------------------------
// 8. EXPORT TYPES
// ---------------------------------------------------------

export type InternshipRole = z.infer<typeof InternshipRoleEnum>;
export type InternshipConfidence = z.infer<typeof InternshipConfidenceEnum>;
export type InternshipDepartmentField = z.infer<
  typeof InternshipDepartmentFieldEnum
>;
export type InternshipStatus = z.infer<typeof InternshipStatusEnum>;

export type RollingInternshipRegistration = z.infer<
  typeof RollingInternshipRegistrationSchema
>;
export type DepartmentInternshipRegistration = z.infer<
  typeof DepartmentInternshipRegistrationSchema
>;
export type InternshipLogbookEntry = z.infer<
  typeof InternshipLogbookEntrySchema
>;

// Rolling Schedule Types
export type RollingScheduleWeekEntry = z.infer<
  typeof RollingScheduleWeekEntrySchema
>;
export type RollingInternshipSchedule = z.infer<
  typeof RollingInternshipScheduleSchema
>;
export type RollingScheduleConfig = z.infer<typeof RollingScheduleConfigSchema>;
