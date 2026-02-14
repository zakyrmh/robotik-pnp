import {
  ref,
  uploadBytesResumable,
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
 * Upload gambar ke Firebase Storage dengan compression, progress, dan delete old file
 */
export function uploadRegistrationImage(
  file: File,
  type: StorageFileType,
  userId: string,
  period: string,
  oldUrl?: string,
  onProgress?: (progress: number, stage: "compressing" | "uploading") => void,
): Promise<string> {
  // Return Promise agar bisa async await
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Delete Old File (Fire & Forget)
      if (oldUrl && oldUrl.includes("firebasestorage.googleapis.com")) {
        deleteObject(ref(storage, oldUrl)).catch((err) =>
          console.warn("[Storage] Failed to delete old file:", err),
        );
      }

      // 2. Compress
      if (onProgress) onProgress(0, "compressing");
      const fileToUpload = await compressImage(file);

      // 3. Upload New File
      if (onProgress) onProgress(0, "uploading");
      const path = getStoragePath(type, userId, period);
      const storageRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress, "uploading");
        },
        (error) => {
          console.error("[Storage] Upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Storage] Upload success: ${path}`);
          resolve(downloadUrl);
        },
      );
    } catch (error) {
      reject(error);
    }
  });
}
/**
 * Upload logbook documentation image to Firebase Storage
 * Path: internship/documentations/{userId}/{timestamp}.jpg
 */
export async function uploadInternshipDocumentation(
  file: File,
  userId: string,
  onProgress?: (progress: number, stage: "compressing" | "uploading") => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Compress image
      if (onProgress) onProgress(0, "compressing");
      const imageCompression = (await import("browser-image-compression"))
        .default;

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5, // 500KB max
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      if (onProgress) onProgress(100, "compressing");

      // 2. Upload to Firebase Storage
      if (onProgress) onProgress(0, "uploading");
      const timestamp = Date.now();
      const path = `internship/documentations/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, path);

      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress, "uploading");
        },
        (error) => {
          console.error("[Storage] Upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Storage] Upload success: ${path}`);
          resolve(downloadUrl);
        },
      );
    } catch (error) {
      console.error("[Storage] Upload failed:", error);
      reject(error);
    }
  });
}

/**
 * Delete multiple storage files (for batch deletion)
 */
export async function deleteStorageFiles(urls: string[]): Promise<void> {
  const deletePromises = urls.map((url) => deleteStorageFile(url));
  await Promise.allSettled(deletePromises);
}

export async function deleteStorageFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log(`[Storage] Deleted file: ${url}`);
  } catch (error) {
    console.warn(`[Storage] Failed to delete file ${url}:`, error);
    // Ignore error if file not found, etc.
  }
}
