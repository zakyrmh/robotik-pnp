"use server";

import { headers } from "next/headers";
import { uploadToR2 } from "@/lib/storage/r2";
import {
  MRC_ALLOWED_MIMES,
  MRC_MAX_RAW_BYTES,
  mrcMaxRawLabel,
  type MrcImageKind,
} from "@/lib/mrc-image-config";
import { mrcUploadRateLimiter } from "@/lib/redis";
import type { ActionResult } from "@/types/event-registration";

function kindLabel(kind: MrcImageKind): string {
  switch (kind) {
    case "photo":
      return "Pas foto";
    case "identityCard":
      return "Foto kartu identitas";
    case "paymentProof":
      return "Bukti pembayaran";
  }
}

async function getUploadClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

const ALLOWED_MIME_SET = new Set<string>(MRC_ALLOWED_MIMES);

/**
 * Upload gambar MRC yang sudah diproses di client (WebP, compressed).
 * Server hanya validasi ukuran/MIME dan upload ke R2 — TANPA sharp/file-type.
 */
export async function uploadMrcImageAction(
  formData: FormData,
  kind: MrcImageKind,
): Promise<ActionResult<string>> {
  const emptyMessage =
    kind === "photo"
      ? "File foto tidak boleh kosong."
      : kind === "paymentProof"
        ? "File bukti pembayaran tidak boleh kosong."
        : "File kartu identitas tidak boleh kosong.";

  const clientIp = await getUploadClientIp();
  const { success: withinLimit } = await mrcUploadRateLimiter.limit(clientIp);
  if (!withinLimit) {
    return {
      success: false,
      error:
        "Terlalu banyak upaya upload. Silakan coba lagi dalam beberapa menit.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: emptyMessage };
  }

  // Validasi ukuran (client sudah kompres, tapi cek safety margin)
  const maxBytes = MRC_MAX_RAW_BYTES[kind];
  if (file.size > maxBytes) {
    return {
      success: false,
      error: `${kindLabel(kind)} melebihi batas ${mrcMaxRawLabel(kind)}.`,
    };
  }

  // Validasi MIME type — client sudah konversi ke WebP, tapi cek keamanan
  if (!ALLOWED_MIME_SET.has(file.type)) {
    return {
      success: false,
      error: `${kindLabel(kind)} harus berformat WebP/JPEG/PNG.`,
    };
  }

  try {
    const folder =
      kind === "photo"
        ? "mrc/photos"
        : kind === "paymentProof"
          ? "mrc/payment-proofs"
          : "mrc/id-cards";

    const timestamp = Date.now();
    const ext =
      file.type === "image/webp"
        ? "webp"
        : file.type === "image/jpeg"
          ? "jpg"
          : "png";
    const key = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const publicUrl = await uploadToR2({
      fileBuffer,
      key,
      contentType: file.type,
    });

    return { success: true, data: publicUrl };
  } catch (err) {
    console.error("[MRC_UPLOAD_ERROR]", err);
    return {
      success: false,
      error: "Gagal mengunggah file. Silakan coba lagi.",
    };
  }
}

export async function uploadMemberPhotoAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  return uploadMrcImageAction(formData, "photo");
}

export async function uploadMemberIdentityCardAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  return uploadMrcImageAction(formData, "identityCard");
}

export async function uploadPaymentProofAction(
  formData: FormData,
): Promise<ActionResult<string>> {
  return uploadMrcImageAction(formData, "paymentProof");
}
