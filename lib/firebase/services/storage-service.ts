import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase/config";

// --- Types ---

export type StorageFileType =
  | "photo"
  | "ktm"
  | "ig_robotik"
  | "ig_mrc"
  | "yt_subscribe"
  | "payment_proof";

// --- Helpers ---

/**
 * Mengompres gambar di client-side menggunakan browser-image-compression
 * Target: JPEG, Max 300KB
 */
export async function compressImage(file: File): Promise<File | Blob> {
  try {
    // Dynamic import library browser-only
    const imageCompression = (await import("browser-image-compression"))
      .default;

    const options = {
      maxSizeMB: 0.3, // 300KB
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    // Hanya compress jika > 300KB
    if (file.size > 300 * 1024) {
      console.log(
        `[Storage] Compressing image: ${(file.size / 1024).toFixed(0)} KB`,
      );
      const compressed = await imageCompression(file, options);
      console.log(
        `[Storage] Compressed to: ${(compressed.size / 1024).toFixed(0)} KB`,
      );
      return compressed;
    }

    return file;
  } catch (error) {
    console.error("[Storage] Compression failed, using original file:", error);
    return file;
  }
}

/**
 * Menghasilkan path penyimpanan sesuai aturan bisnis
 * - Photo/KTM: users/{userId}/{type}_{timestamp}.jpg
 * - Lainnya: registration_docs/{period}/{userId}/{type}_{timestamp}.jpg
 */
export function getStoragePath(
  type: StorageFileType,
  userId: string,
  period: string,
): string {
  const timestamp = Date.now();
  // Ganti spasi dengan underscore (e.g., "OR 22" -> "OR_22")
  const safePeriod = period.replace(/\s+/g, "_");

  switch (type) {
    case "photo":
    case "ktm":
      return `users/${userId}/${type}_${timestamp}.jpg`;
    case "ig_robotik":
    case "ig_mrc":
    case "yt_subscribe":
    case "payment_proof":
      return `registration_docs/${safePeriod}/${userId}/${type}_${timestamp}.jpg`;
    default:
      console.warn("[Storage] Unknown file type, using default path");
      return `registration_docs/${safePeriod}/${userId}/${type}_${timestamp}.jpg`;
  }
}

// --- Main Functions ---

/**
 * Upload gambar ke Firebase Storage dengan compression dan delete old file
 * @param file - File asli dari input
 * @param type - Jenis file untuk penentuan path
 * @param userId - ID User
 * @param period - Periode OR (e.g. "OR 22")
 * @param oldUrl - URL file lama (untuk dihapus)
 */
export async function uploadRegistrationImage(
  file: File,
  type: StorageFileType,
  userId: string,
  period: string,
  oldUrl?: string,
): Promise<string> {
  // 1. Compress Image
  const fileToUpload = await compressImage(file);

  // 2. Determine Path
  const path = getStoragePath(type, userId, period);

  // 3. Delete Old File (if exists and is valid storage URL)
  if (oldUrl && oldUrl.includes("firebasestorage.googleapis.com")) {
    try {
      const oldRef = ref(storage, oldUrl);
      await deleteObject(oldRef);
      console.log("[Storage] Old file deleted");
    } catch (error) {
      // Ignore "object not found" error, log others
      console.warn("[Storage] Failed to delete old file:", error);
    }
  }

  // 4. Upload New File
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, fileToUpload);
  const downloadUrl = await getDownloadURL(storageRef);

  console.log(`[Storage] Upload success: ${path}`);
  return downloadUrl;
}
