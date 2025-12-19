import { storage } from "@/lib/firebaseConfig";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
  deleteObject,
} from "firebase/storage";

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log(`File deleted successfully: ${storagePath}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "storage/object-not-found"
    ) {
      console.warn(`File not found during deletion (ignored): ${storagePath}`);
      return;
    }
    console.error(`Error deleting file: ${storagePath}`, error);
    throw error;
  }
}

/**
 * Get download URL for a file path
 * @param storagePath - Path of the file
 * @returns Download URL
 */
export async function getFileUrl(storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.warn(`Error getting download URL for ${storagePath}:`, error);
    return "";
  }
}

export type UploadProgressCallback = (progress: number) => void;

export interface UploadResult {
  downloadURL: string;
  uploadTask: UploadTask;
}

/**
 * Upload file to Firebase Storage with progress tracking
 * @param userId - User ID for organizing files
 * @param file - File to upload
 * @param fieldName - Field name to categorize the file
 * @param onProgress - Callback for progress updates (0-100)
 * @returns Download URL of the uploaded file
 */
export async function uploadFileWithProgress(
  storagePath: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    // Create storage reference
    const storageRef = ref(storage, storagePath);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Listen to state changes, errors, and completion
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate progress percentage
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        // Call progress callback if provided
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        // Handle successful uploads
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, path: storagePath });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File, maxSizeMB: number = 2): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ["image/*"]
): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const baseType = type.split("/")[0];
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
}
