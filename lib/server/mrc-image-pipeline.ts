import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { uploadToR2 } from "@/lib/storage/r2";
import {
  MRC_ALLOWED_MIMES,
  MRC_HEIC_MIMES,
  MRC_MAX_IMAGE_DIMENSION,
  MRC_MAX_IMAGE_PIXELS,
  MRC_MAX_RAW_BYTES,
  MRC_VARIANT_CONFIG,
  mrcMaxRawLabel,
  type MrcImageKind,
} from "@/lib/mrc-image-config";

export interface MrcProcessedImage {
  /** URL publik varian utama (WebP, via proxy `/api/r2/...`). */
  url: string;
  /** URL publik thumbnail (WebP). */
  thumbUrl: string;
  key: string;
  thumbKey: string;
  width: number;
  height: number;
  bytes: number;
}

export class MrcImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MrcImageValidationError";
  }
}

const ALLOWED_SET = new Set<string>(MRC_ALLOWED_MIMES);
const HEIC_SET = new Set<string>(MRC_HEIC_MIMES);

function kindLabel(kind: MrcImageKind): string {
  return kind === "photo" ? "Pas foto" : "Foto kartu identitas";
}

/**
 * Validasi otoritatif berbasis magic bytes + batas dimensi.
 * Mengembalikan buffer yang sama (lolos) atau throw `MrcImageValidationError`.
 *
 * Catatan: `claimedMime` (yakni `File.type` dari browser) sengaja TIDAK dipakai
 * untuk keputusan — hanya dicatat untuk pesan error. Keputusan memakai 100%
 * hasil inspeksi signature via `file-type`.
 */
export async function assertTrustedImageBuffer(
  buffer: Buffer,
  kind: MrcImageKind,
): Promise<{ mime: string; ext: string }> {
  if (buffer.length === 0) {
    throw new MrcImageValidationError(`${kindLabel(kind)} kosong atau rusak.`);
  }
  if (buffer.length > MRC_MAX_RAW_BYTES[kind]) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} melebihi batas ${mrcMaxRawLabel(kind)}. Silakan unggah file yang lebih kecil.`,
    );
  }

  // Normalisasi ke Uint8Array realm-agnostik: `Buffer` Node adalah subclass
  // `Uint8Array` realm Node, sedangkan `file-type` memakai `instanceof`
  // terhadap realm tempat ia dieksekusi (relevan saat dijalankan di jsdom/vitest).
  const bytes = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} tidak dikenali sebagai file gambar yang valid (signature tidak cocok). ` +
        `Pastikan file adalah JPG, PNG, atau WebP asli — bukan dokumen yang diganti ekstensinya.`,
    );
  }

  if (HEIC_SET.has(detected.mime)) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} berformat HEIC/HEIF yang tidak dapat diproses server. ` +
        `Silakan unggah ulang sebagai JPG/PNG, atau ulangi dari form (form otomatis mengonversi foto iPhone via heic2any sebelum upload).`,
    );
  }

  if (!ALLOWED_SET.has(detected.mime)) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} berformat "${detected.mime}" yang tidak didukung. ` +
        `Format yang diterima: JPG, PNG, WebP (terdeteksi dari isi file, bukan dari nama file).`,
    );
  }

  return { mime: detected.mime, ext: detected.ext };
}

/**
 * Pipeline server penuh:
 *  1. Validasi ukuran + magic bytes (`file-type`)
 *  2. Proteksi decompression-bomb via `sharp.metadata()`
 *  3. Normalisasi: auto-orient EXIF → resize → WebP (varian utama + thumbnail)
 *  4. Upload kedua varian ke Cloudflare R2 (S3-compatible)
 *
 * Input HEIC mentah DITOLAK dengan pesan jelas (lihat `assertTrustedImageBuffer`).
 * Alur normal: client sudah mengonversi HEIC→JPEG via `heic2any` + kompresi
 * ringan via `browser-image-compression` agar upload cepat/hemat bandwidth,
 * lalu server melakukan validasi ulang + kompresi final yang kanonis.
 */
export async function processAndUploadMrcImage(
  file: File,
  kind: MrcImageKind,
): Promise<MrcProcessedImage> {
  if (!(file instanceof File) || file.size === 0) {
    throw new MrcImageValidationError(`${kindLabel(kind)} tidak boleh kosong.`);
  }
  if (file.size > MRC_MAX_RAW_BYTES[kind]) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} melebihi batas ${mrcMaxRawLabel(kind)}.`,
    );
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  await assertTrustedImageBuffer(rawBuffer, kind);

  const folder = kind === "photo" ? "mrc/photos" : "mrc/id-cards";
  const cfg = MRC_VARIANT_CONFIG[kind];

  let metadata;
  try {
    metadata = await sharp(rawBuffer).metadata();
  } catch {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} rusak atau tidak dapat dibaca sebagai gambar.`,
    );
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} memiliki dimensi yang tidak valid.`,
    );
  }
  if (
    width > MRC_MAX_IMAGE_DIMENSION ||
    height > MRC_MAX_IMAGE_DIMENSION ||
    width * height > MRC_MAX_IMAGE_PIXELS
  ) {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} beresolusi terlalu besar (${width}×${height}px). Maksimal sisi ${MRC_MAX_IMAGE_DIMENSION}px / ${MRC_MAX_IMAGE_PIXELS / 1_000_000} MP.`,
    );
  }

  let main: {
    data: Buffer;
    info: { width: number; height: number; size: number };
  };
  let thumb: {
    data: Buffer;
    info: { width: number; height: number; size: number };
  };
  try {
    [main, thumb] = await Promise.all([
      sharp(rawBuffer)
        .rotate() // auto-orient berdasar EXIF, lalu EXIF dibuang (output WebP bersih)
        .resize({
          width: cfg.maxDim,
          height: cfg.maxDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: cfg.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true }),
      sharp(rawBuffer)
        .rotate()
        .resize({
          width: cfg.thumbDim,
          height: cfg.thumbDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: cfg.thumbQuality, effort: 4 })
        .toBuffer({ resolveWithObject: true }),
    ]);
  } catch {
    throw new MrcImageValidationError(
      `${kindLabel(kind)} gagal diproses. Pastikan file gambar tidak rusak.`,
    );
  }

  const id = randomUUID();
  const key = `${folder}/${id}.webp`;
  const thumbKey = `${folder}/${id}-thumb.webp`;

  try {
    const [url, thumbUrl] = await Promise.all([
      uploadToR2({ fileBuffer: main.data, key, contentType: "image/webp" }),
      uploadToR2({
        fileBuffer: thumb.data,
        key: thumbKey,
        contentType: "image/webp",
      }),
    ]);

    return {
      url,
      thumbUrl,
      key,
      thumbKey,
      width: main.info.width,
      height: main.info.height,
      bytes: main.info.size,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Gagal menyimpan ${kindLabel(kind).toLowerCase()} ke penyimpanan: ${detail}`,
    );
  }
}
