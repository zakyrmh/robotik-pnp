import { supabase } from "./supabase";

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with public URL or error
 */
export const uploadFileToSupabase = async (
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!file) {
      return {
        success: false,
        error: "File tidak ditemukan",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}_${Date.now()}.${fileExt}`;

    // Simulate progress for small files (Supabase doesn't provide native upload progress)
    if (onProgress) {
      onProgress(10);
    }

    // Upload file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (onProgress) {
      onProgress(80);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
};

/**
 * Delete file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - File path to delete
 * @returns Promise with success status or error
 */
export const deleteFileFromSupabase = async (
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract filename from URL if full URL is provided
    let fileName = filePath;
    if (filePath.includes("supabase")) {
      const urlParts = filePath.split("/");
      fileName = urlParts[urlParts.length - 1];
    }

    const { error } = await supabase.storage.from(bucket).remove([fileName]);

    if (error) {
      console.error("Error deleting file:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
};

/**
 * Update file in Supabase Storage (delete old, upload new)
 * @param file - New file to upload
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param oldFileUrl - Old file URL to delete (optional)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise with public URL or error
 */
export const updateFileInSupabase = async (
  file: File,
  bucket: string,
  path: string,
  oldFileUrl?: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Delete old file if exists
    if (oldFileUrl) {
      await deleteFileFromSupabase(bucket, oldFileUrl);
    }

    // Upload new file with progress tracking
    return await uploadFileToSupabase(file, bucket, path, onProgress);
  } catch (error) {
    console.error("Error updating file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update file",
    };
  }
};
