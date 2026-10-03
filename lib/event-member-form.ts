"use client";

import imageCompression from "browser-image-compression";
import {
  uploadMemberPhotoAction,
  uploadMemberIdentityCardAction,
} from "@/lib/actions/mrc-image-upload";
import {
  MRC_ALLOWED_EXTENSIONS,
  MRC_MAX_RAW_BYTES,
  mrcMaxRawLabel,
  type MrcImageKind,
} from "@/lib/mrc-image-config";

/**
 * Logika bersama untuk form anggota tim MRC (dipakai form pendaftaran &
 * form permohonan perbaikan data). Murni behavior — tanpa JSX — sehingga
 * aman dibagikan tanpa menyentuh markup form yang sudah stabil.
 */

export interface MemberFormState {
  full_name: string;
  photo_url: string;
  identity_card_url: string;
  birth_date: string;
  role_in_team: string;
  isUploading: boolean;
  uploadError?: string;
  isUploadingIdCard: boolean;
  uploadIdCardError?: string;
}

/** Anggota kosong baru (default role "Anggota"). */
export function createEmptyMember(role: string = "Anggota"): MemberFormState {
  return {
    full_name: "",
    photo_url: "",
    identity_card_url: "",
    birth_date: "",
    role_in_team: role,
    isUploading: false,
    isUploadingIdCard: false,
  };
}

/** Bentuk anggota awal form pendaftaran (Ketua + 1 Anggota). */
export function createInitialMembers(): MemberFormState[] {
  return [createEmptyMember("Ketua Tim"), createEmptyMember("Anggota")];
}

function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

function isHeicFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  const type = (file.type || "").toLowerCase();
  return (
    ext === ".heic" ||
    ext === ".heif" ||
    type.includes("heic") ||
    type.includes("heif")
  );
}

export function validateImageFileClient(
  file: File,
  kind: MrcImageKind,
): string | null {
  const label = kind === "photo" ? "Pas foto" : "Foto kartu identitas";
  if (file.size === 0) return `${label} kosong atau tidak terbaca.`;
  if (file.size > MRC_MAX_RAW_BYTES[kind]) {
    return `${label} melebihi batas ${mrcMaxRawLabel(kind)}. Silakan pilih file yang lebih kecil.`;
  }
  if (file.type && !file.type.toLowerCase().startsWith("image/")) {
    return `${label} harus berupa file gambar (JPG, PNG, WebP, atau HEIC).`;
  }
  const ext = getFileExtension(file.name);
  if (ext && !(MRC_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `${label} berekstensi "${ext}" yang tidak didukung. Gunakan JPG, PNG, WebP, atau HEIC.`;
  }
  return null;
}

/** Konversi HEIC/HEIF (foto iPhone) → JPEG via `heic2any` sebelum kompresi. */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    throw new Error(
      "Gagal mengonversi foto iPhone (HEIC). Silakan pilih file JPG/PNG manual.",
    );
  }
}

/** Kompresi + konversi ke WebP di client-side. Server hanya upload buffer ke R2. */
export async function compressToWebp(
  file: File,
  kind: MrcImageKind,
): Promise<File> {
  const normalized = await convertHeicToJpegIfNeeded(file);
  try {
    const compressed = await imageCompression(normalized, {
      maxSizeMB: kind === "photo" ? 1 : 1.5,
      maxWidthOrHeight: kind === "photo" ? 1280 : 1920,
      useWebWorker: true,
      fileType: "image/webp",
    });
    const baseName =
      (compressed as File)?.name?.replace(/\.[^.]+$/, "") ||
      normalized.name?.replace(/\.[^.]+$/, "") ||
      "photo";
    return new File([compressed], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return normalized;
  }
}

/**
 * Unggah satu berkas (foto atau kartu identitas) untuk seorang anggota.
 * Mengembalikan URL publik, atau melempar Error dengan pesan ramah.
 */
export async function uploadMemberImage(
  file: File,
  kind: MrcImageKind,
): Promise<string> {
  const clientError = validateImageFileClient(file, kind);
  if (clientError) throw new Error(clientError);

  const lightFile = await compressToWebp(file, kind);
  const formData = new FormData();
  formData.append("file", lightFile);

  const res =
    kind === "photo"
      ? await uploadMemberPhotoAction(formData)
      : await uploadMemberIdentityCardAction(formData);

  if (!res.success) {
    throw new Error(res.error || "Gagal mengunggah file.");
  }
  return res.data;
}
