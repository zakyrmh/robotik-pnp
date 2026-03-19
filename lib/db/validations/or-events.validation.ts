/**
 * Validasi Zod untuk Modul Kegiatan OR
 *
 * Digunakan untuk memvalidasi input saat membuat atau memperbarui
 * kegiatan Open Recruitment.
 */

import { z } from "zod";

export const orEventUpsertSchema = z
  .object({
    title: z.string().min(5, "Judul minimal 5 karakter").max(255),
    description: z.string().nullable().optional(),
    event_type: z.enum([
      "demo",
      "pelatihan",
      "wawancara",
      "project",
      "pelantikan",
      "lainnya",
    ]),

    // Jadwal
    event_date: z.string().min(1, "Tanggal kegiatan wajib diisi"),
    start_time: z.string().min(1, "Waktu mulai wajib diisi"),
    end_time: z.string().nullable().optional(),

    // Lokasi & Mode
    execution_mode: z.enum(["offline", "online", "hybrid"]),
    location: z.string().max(255).nullable().optional(),
    meeting_link: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val))
      .refine(
        (val) => {
          if (!val) return true;
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Format Link Meeting tidak valid" },
      ),

    // Konfigurasi
    status: z.enum(["draft", "published", "completed"]),
    allow_attendance: z.boolean().default(true),
    late_tolerance: z
      .number()
      .int()
      .min(0, "Toleransi tidak boleh negatif")
      .default(15),

    // Poin
    points_present: z
      .number()
      .int()
      .min(0, "Poin tidak boleh negatif")
      .default(10),
    points_late: z.number().int().min(0, "Poin tidak boleh negatif").default(5),
    points_excused: z
      .number()
      .int()
      .min(0, "Poin tidak boleh negatif")
      .default(2),
    points_sick: z.number().int().min(0, "Poin tidak boleh negatif").default(2),
    points_absent: z
      .number()
      .int()
      .min(0, "Poin tidak boleh negatif")
      .default(0),
  })
  .refine(
    (data) => {
      // Jika offline atau hybrid, lokasi wajib ada
      if (
        (data.execution_mode === "offline" ||
          data.execution_mode === "hybrid") &&
        !data.location
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Lokasi/Tempat wajib diisi untuk mode pelaksanaan Offline atau Hybrid.",
      path: ["location"],
    },
  )
  .refine(
    (data) => {
      // Jika online atau hybrid, meeting link wajib ada
      if (
        (data.execution_mode === "online" ||
          data.execution_mode === "hybrid") &&
        !data.meeting_link
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Link Meeting wajib diisi untuk mode pelaksanaan Online atau Hybrid.",
      path: ["meeting_link"],
    },
  );

export type OrEventUpsert = z.infer<typeof orEventUpsertSchema>;
