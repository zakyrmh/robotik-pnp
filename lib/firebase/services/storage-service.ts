import { storage } from "@/lib/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";

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
  userId: string,
  file: File,
  fieldName: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create storage reference
    const storageRef = ref(
      storage,
      `registrations/${userId}/${fieldName}/${Date.now()}_${file.name}`
    );

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Listen to state changes, errors, and completion
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
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
          resolve(downloadURL);
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
export function validateFileType(file: File, allowedTypes: string[] = ["image/*"]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const baseType = type.split("/")[0];
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
}
