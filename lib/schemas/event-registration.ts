import { z } from "zod";

/**
 * Host internal/metadata cloud yang TIDAK boleh dijadikan URL gambar.
 *
 * Tujuan: mencegah SSRF — penyerang menitipkan URL yang menunjuk ke
 * layanan internal (metadata cloud, localhost, jaringan privat) agar
 * dibaca server saat menampilkan foto.
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  // IPv4 privat / loopback / link-local (termasuk 169.254.169.254 metadata cloud)
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }
  // Host tanpa titik (mis. "intranet") tidak mungkin domain publik valid
  if (!host.includes(".")) return true;
  return false;
}

/**
 * URL gambar MRC: relatif via proxy internal `/api/r2/...` ATAU absolut `http(s)`
 * ke host publik yang tidak diblokir.
 *
 * Catatan: validasi ini bersifat *pertahanan berlapis*, bukan pengganti
 * verifikasi bahwa berkas benar-benar ada di bucket R2 milik sendiri —
 * hal itu tetap dipastikan oleh pipeline upload di server.
 */
export function isMrcImageUrl(value: string): boolean {
  if (value.startsWith("/api/r2/")) {
    return value.length > "/api/r2/".length;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return !isBlockedHost(parsed.hostname);
  } catch {
    return false;
  }
}

const mrcImageUrlSchema = (label: string) =>
  z
    .string()
    .min(1, `URL ${label} wajib diisi`)
    .refine(isMrcImageUrl, `URL ${label} harus valid`);

/**
 * Batas maksimal anggota per tim — pertahanan berlapis.
 *
 * Batas sesungguhnya berasal dari `category.max_team_members` dan diverifikasi
 * ulang di `registerEventAction` (server action). Nilai di sini adalah plafon
 * keras untuk mencegah payload raksasa (ratusan anggota) menghabiskan memori
 * server sebelum kode sempat membandingkan dengan `max_team_members`.
 */
export const HARD_MAX_TEAM_MEMBERS = 20;

export const eventMemberSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nama anggota minimal 2 karakter")
    .max(100, "Nama anggota maksimal 100 karakter"),
  photo_url: mrcImageUrlSchema("foto anggota"),
  identity_card_url: z
    .string()
    .optional()
    .refine(
      (val) => !val || isMrcImageUrl(val),
      "URL kartu pelajar / KK harus valid",
    ),
  birth_date: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      "Format tanggal lahir tidak valid",
    ),
  role_in_team: z
    .string()
    .max(50, "Peran anggota maksimal 50 karakter")
    .default("Anggota"),
});

export const eventRegistrationSchema = z.object({
  category_id: z.string().uuid("Kategori lomba tidak valid"),
  team_name: z
    .string()
    .min(2, "Nama tim minimal 2 karakter")
    .max(100, "Nama tim maksimal 100 karakter"),
  institution: z
    .string()
    .min(2, "Nama instansi minimal 2 karakter")
    .max(150, "Nama instansi maksimal 150 karakter"),
  origin_city: z
    .string()
    .min(2, "Kota asal minimal 2 karakter")
    .max(100, "Kota asal maksimal 100 karakter"),
  advisor_name: z
    .string()
    .max(100, "Nama pembimbing maksimal 100 karakter")
    .optional(),
  team_email: z
    .string()
    .email("Email tim tidak valid")
    .max(254, "Email terlalu panjang"),
  team_whatsapp: z
    .string()
    .trim()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,11}$/,
      "Nomor WhatsApp tidak valid (contoh: 08123456789)",
    ),
  rules_version_id: z.string().uuid("Versi aturan tidak valid").optional(),
  accept_rules: z.literal(true, {
    message: "Anda harus menyetujui aturan perlombaan",
  }),
  /** Token Cloudflare Turnstile dari widget di form. Diverifikasi di server. */
  captcha_token: z.string().optional(),
  /**
   * Honeypot anti-bot. Field ini tersembunyi via CSS dan TIDAK boleh diisi
   * manusia. Skema tetap mengizinkan string kosong (undefined); penolakan
   * dilakukan di server action agar bot tidak tahu ia terdeteksi.
   */
  website: z.string().optional(),
  /** Waktu form dirender (epoch ms) untuk deteksi submit terlalu cepat. */
  form_rendered_at: z.coerce.number().optional(),
  members: z
    .array(eventMemberSchema)
    .min(1, "Minimal harus ada 1 anggota tim")
    .max(
      HARD_MAX_TEAM_MEMBERS,
      `Jumlah anggota tim tidak boleh melebihi ${HARD_MAX_TEAM_MEMBERS} orang`,
    ),
});

export const eventCategorySchema = z.object({
  slug: z.string().min(2, "Slug minimal 2 karakter"),
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional(),
  registration_fee: z.number().min(0, "Biaya registrasi tidak boleh negatif"),
  registration_fee_batch1: z
    .number()
    .min(0, "Biaya batch 1 tidak boleh negatif")
    .optional(),
  registration_fee_batch2: z
    .number()
    .min(0, "Biaya batch 2 tidak boleh negatif")
    .optional(),
  max_team_members: z.number().min(1, "Maksimal anggota minimal 1"),
  quota: z.number().min(1, "Kuota minimal 1"),
  is_active: z.boolean().default(true),
  whatsapp_group_url: z
    .string()
    .url("Link grup WhatsApp tidak valid")
    .or(z.literal(""))
    .optional(),
});

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "Nama bank wajib diisi"),
  account_number: z.string().min(1, "Nomor rekening wajib diisi"),
  account_holder: z.string().min(1, "Nama pemilik rekening wajib diisi"),
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

const optionalDatetime = z
  .string()
  .min(1, "Tanggal wajib diisi")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Format tanggal tidak valid")
  .nullish();

export const eventSettingsSchema = z
  .object({
    timeline_release_date: optionalDatetime,
    batch1_start: optionalDatetime,
    batch1_end: optionalDatetime,
    batch2_start: optionalDatetime,
    batch2_end: optionalDatetime,
    technical_meeting_start: optionalDatetime,
    technical_meeting_end: optionalDatetime,
    event_start: optionalDatetime,
    event_end: optionalDatetime,
    payment_mode: z.enum(["midtrans", "manual_bank"]).default("midtrans"),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_account_holder: z.string().optional(),
    bank_accounts: z.array(bankAccountSchema).optional(),
  })
  .superRefine((v, ctx) => {
    const pairs: [unknown, unknown, string][] = [
      [v.batch1_start, v.batch1_end, "batch1"],
      [v.batch2_start, v.batch2_end, "batch2"],
      [v.technical_meeting_start, v.technical_meeting_end, "technical meeting"],
      [v.event_start, v.event_end, "acara"],
    ];
    for (const [start, end, label] of pairs) {
      if (
        start &&
        end &&
        Date.parse(start as string) >= Date.parse(end as string)
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Tanggal mulai ${label} harus sebelum tanggal selesai.`,
        });
      }
    }
    if (
      v.batch1_end &&
      v.batch2_start &&
      Date.parse(v.batch1_end) > Date.parse(v.batch2_start)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Batch 1 harus selesai sebelum Batch 2 dimulai.",
      });
    }
    if (
      v.batch2_end &&
      v.event_start &&
      Date.parse(v.batch2_end) > Date.parse(v.event_start)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Pendaftaran Batch 2 harus selesai sebelum acara dimulai.",
      });
    }
    if (v.payment_mode === "manual_bank") {
      if (!v.bank_accounts || v.bank_accounts.length === 0) {
        if (!v.bank_name || v.bank_name.trim().length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["bank_name"],
            message:
              "Minimal 1 rekening bank penerima wajib diisi untuk pembayaran manual bank.",
          });
        }
      }
    }
  });

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type EventMemberInput = z.infer<typeof eventMemberSchema>;
export type EventCategoryInput = z.infer<typeof eventCategorySchema>;
export type EventSettingsInput = z.infer<typeof eventSettingsSchema>;
export type EventSettingsPartialInput = Partial<EventSettingsInput>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type ManualPaymentVerificationInput = z.infer<
  typeof manualPaymentVerificationSchema
>;
export type FaceVerificationInput = z.infer<typeof faceVerificationSchema>;
export type EventViolationInput = z.infer<typeof eventViolationSchema>;
