import { createClient } from "@/lib/supabase/client";

export interface DirectUploadOptions {
  file: File;
  bucket: string;
  path: string;
  upsert?: boolean;
}

export interface DirectUploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Memunggah file secara langsung dari browser client ke Supabase Storage Bucket.
 * Mengurangi beban Serverless Function Vercel (memory, execution time, & bandwidth).
 */
export async function uploadDirectToSupabase({
  file,
  bucket,
  path,
  upsert = true,
}: DirectUploadOptions): Promise<DirectUploadResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert,
        contentType: file.type,
      });

    if (error) {
      console.error("[DirectUpload] Gagal mengunggah file ke Supabase:", error.message);
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      publicUrl,
      path: data.path,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Gagal mengunggah file.";
    console.error("[DirectUpload] Error tak terduga:", errMsg);
    return { success: false, error: errMsg };
  }
}
