import { z } from "zod";

export const CreateKomdisActivitySchema = z.object({
  title: z.string().min(3, "Judul kegiatan minimal 3 karakter"),
  description: z.string().optional(),
  start_date: z.string().datetime("Format tanggal mulai tidak valid"),
  end_date: z.string().datetime("Format tanggal selesai tidak valid"),
  location: z.string().min(2, "Lokasi wajib diisi"),
  checkin_open_at: z.string().datetime("Waktu buka absensi wajib diisi"),
  checkin_close_at: z.string().datetime("Waktu tutup absensi wajib diisi"),
  late_tolerance_minutes: z.number().int().nonnegative().default(15),
});

export type CreateKomdisActivityInput = z.infer<
  typeof CreateKomdisActivitySchema
>;

export const UpdateKomdisActivitySchema = CreateKomdisActivitySchema.extend({
  activityId: z.string().uuid("ID kegiatan tidak valid"),
});

export type UpdateKomdisActivityInput = z.infer<
  typeof UpdateKomdisActivitySchema
>;

export const ReviewLeaveSchema = z.object({
  attendanceId: z.string().uuid("ID presensi tidak valid"),
  approvalStatus: z.enum(["approved", "rejected"]),
  pointsAwarded: z.number().int().nonnegative(),
  rejectionReason: z.string().optional(),
});

export type ReviewLeaveInput = z.infer<typeof ReviewLeaveSchema>;

export const ManualAttendanceSchema = z.object({
  activityId: z.string().uuid("ID kegiatan tidak valid"),
  profileId: z.string().uuid("ID profil tidak valid"),
  status: z.enum(["hadir", "telat", "izin", "sakit", "alfa", "magang"]),
  pointsAwarded: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

export type ManualAttendanceInput = z.infer<typeof ManualAttendanceSchema>;

export const LogPointReductionSchema = z.object({
  profileId: z.string().uuid("ID profil tidak valid"),
  category: z.enum(["goro_sp1", "goro_sp2", "penyesuaian_komdis"]),
  points: z.number().int().negative("Poin pemutihan harus bernilai negatif"),
  description: z.string().min(5, "Deskripsi pemutihan wajib diisi"),
});

export type LogPointReductionInput = z.infer<typeof LogPointReductionSchema>;

export const LogLegacyDisciplinePointSchema = z.object({
  profileId: z.string().uuid("ID profil tidak valid"),
  category: z.enum([
    "poin_awal_periode20",
    "transfer_periode",
    "penyesuaian_komdis",
  ]),
  points: z.number().int().positive("Poin sanksi awal harus bernilai positif"),
  description: z.string().min(5, "Deskripsi/keterangan poin awal wajib diisi"),
});

export type LogLegacyDisciplinePointInput = z.infer<
  typeof LogLegacyDisciplinePointSchema
>;

export const IssueSanctionSchema = z.object({
  profileId: z.string().uuid("ID profil tidak valid"),
  spLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pointsAtIssuance: z
    .number()
    .int()
    .positive("Poin penerbitan harus bernilai positif"),
  notes: z.string().optional(),
});

export type IssueSanctionInput = z.infer<typeof IssueSanctionSchema>;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const UpdateMemberInternshipSchema = z
  .object({
    profileId: z.string().uuid("ID profil tidak valid"),
    isOnInternship: z.boolean(),
    internshipStartDate: z
      .string()
      .regex(ISO_DATE_REGEX, "Format tanggal mulai harus YYYY-MM-DD")
      .nullable()
      .optional(),
    internshipEndDate: z
      .string()
      .regex(ISO_DATE_REGEX, "Format tanggal selesai harus YYYY-MM-DD")
      .nullable()
      .optional(),
  })
  // Validasi konsistensi periode magang. Tanpa ini, status magang bisa
  // tersimpan dengan rentang kosong / terbalik / nol-hari, yang membuat
  // deteksi magang di modul piket (isMemberOnInternship) gagal.
  .superRefine((data, ctx) => {
    if (!data.isOnInternship) return;

    const start = data.internshipStartDate || null;
    const end = data.internshipEndDate || null;

    if (!start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["internshipStartDate"],
        message:
          "Tanggal mulai magang wajib diisi saat status magang diaktifkan.",
      });
    }
    if (!end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["internshipEndDate"],
        message:
          "Tanggal selesai magang wajib diisi saat status magang diaktifkan.",
      });
    }
    if (start && end && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["internshipEndDate"],
        message: "Tanggal selesai magang tidak boleh lebih awal dari mulai.",
      });
    }
  });

export type UpdateMemberInternshipInput = z.infer<
  typeof UpdateMemberInternshipSchema
>;
