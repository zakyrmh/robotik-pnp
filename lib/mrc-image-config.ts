/**
 * Konfigurasi validasi gambar MRC — SINGLE SOURCE OF TRUTH.
 *
 * Dipakai oleh:
 * - Client (`components/event/registration-form.tsx`): validasi awal tipe/ukuran
 *   + konversi HEIC via `heic2any` + kompresi ringan via `browser-image-compression`.
 * - Server (`lib/server/mrc-image-pipeline.ts`): validasi ulang otoritatif berbasis
 *   magic bytes (`file-type`), proses final via `sharp`, upload ke Cloudflare R2.
 *
 * JANGAN pernah memercayai `File.type` dari browser di server — nilai tersebut
 * diisi oleh client dan mudah dipalsukan. Server selalu memakai hasil
 * `fileTypeFromBuffer()` (inspeksi file signature / magic bytes).
 */

/** MIME yang dapat diproses `sharp` menjadi WebP di server. */
export const MRC_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type MrcAllowedMime = (typeof MRC_ALLOWED_MIMES)[number];

/**
 * MIME HEIC/HEIF: dideteksi di kedua sisi.
 * - Client mengonversinya ke JPEG via `heic2any` SEBELUM upload.
 * - Server MENOLAK bytes HEIC mentah dengan pesan yang jelas, karena build
 *   `sharp`/libvips standar umumnya tanpa decoder HEIF — menerimanya diam-diam
 *   hanya akan menghasilkan error buram / file rusak.
 */
export const MRC_HEIC_MIMES = ["image/heic", "image/heif"] as const;

/** Ekstensi yang diterima input file (dipakai atribut `accept`). */
export const MRC_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
] as const;

export const MRC_ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.heic,.heif";

/** Batas ukuran file MENTAH (sebelum diproses server), dalam bytes. */
export const MRC_MAX_RAW_BYTES = {
  photo: 6 * 1024 * 1024, // 6 MB — pas foto
  identityCard: 8 * 1024 * 1024, // 8 MB — kartu pelajar/KK butuh resolusi lebih tinggi
} as const;

export type MrcImageKind = keyof typeof MRC_MAX_RAW_BYTES;

/** Proteksi decompression-bomb untuk `sharp.metadata()`. */
export const MRC_MAX_IMAGE_DIMENSION = 8000;
export const MRC_MAX_IMAGE_PIXELS = 30_000_000; // ~30 MP

/** Varian output WebP yang dihasilkan server via `sharp`. */
export const MRC_VARIANT_CONFIG = {
  photo: { maxDim: 960, quality: 80, thumbDim: 256, thumbQuality: 70 },
  identityCard: { maxDim: 1600, quality: 82, thumbDim: 320, thumbQuality: 70 },
} as const satisfies Record<
  MrcImageKind,
  { maxDim: number; quality: number; thumbDim: number; thumbQuality: number }
>;

const MB = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb.toString() : mb.toFixed(1)} MB`;
};

export function mrcMaxRawLabel(kind: MrcImageKind): string {
  return MB(MRC_MAX_RAW_BYTES[kind]);
}
