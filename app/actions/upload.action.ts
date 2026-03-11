"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Nama bucket di Supabase Storage.
 * Bucket ini harus sudah dibuat manual via Supabase Dashboard
 * dengan setting: Private, max 5MB, MIME types: image/*
 */
const BUCKET = "or-documents";

/**
 * Mengupload gambar ke Supabase Storage (bucket: or-documents).
 *
 * Alur:
 * 1. Validasi auth, ukuran, dan tipe file
 * 2. Upload ke path: {folder}/{timestamp}-{cleanFilename}
 * 3. Generate Signed URL dengan masa berlaku 1 tahun
 * 4. Kembalikan signed URL — inilah yang disimpan ke database
 *
 * Catatan: Bucket bersifat private. File tidak bisa diakses
 * tanpa Signed URL yang dibuat server-side. Signed URL berlaku
 * 1 tahun (cukup untuk satu periode OR).
 *
 * @param formData FormData berisi key "file" dengan File object
 * @param folder   Path folder di dalam bucket, contoh: "caang/2026/{userId}"
 */
export async function uploadImageToSupabase(
  formData: FormData,
  folder: string,
) {
  try {
    const supabase = await createClient();

    // ── Langkah 1: Autentikasi ──
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // ── Langkah 2: Ambil dan validasi file ──
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "Tidak ada file yang dikirim." };

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "Ukuran file terlalu besar (Maksimal 5MB).",
      };
    }

    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Hanya file gambar yang diperbolehkan (JPG, PNG, WebP).",
      };
    }

    // ── Langkah 3: Bangun path unik di dalam bucket ──
    // Format: {folder}/{userId}-{timestamp}-{cleanFilename}
    // Contoh: caang/2026/abc-123/abc-123-1741234567890-pas_foto.jpg
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${user.id}-${Date.now()}-${cleanFileName}`;
    const storagePath = `${folder}/${filename}`;

    // ── Langkah 4: Upload ke Supabase Storage ──
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false, // Jangan timpa file yang sudah ada
      });

    if (uploadError) {
      console.error("[uploadImageToSupabase] Upload error:", uploadError);
      return {
        success: false,
        error: `Gagal mengupload file: ${uploadError.message}`,
      };
    }

    // ── Langkah 5: Buat Signed URL (berlaku 1 tahun) ──
    // 365 hari × 24 jam × 60 menit × 60 detik = 31.536.000 detik
    const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, ONE_YEAR_IN_SECONDS);

    if (signedError || !signedData?.signedUrl) {
      console.error("[uploadImageToSupabase] Signed URL error:", signedError);
      // File sudah terupload tapi URL gagal dibuat — hapus file agar tidak ada orphan
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return {
        success: false,
        error: "File terupload tapi gagal membuat URL akses. Coba ulangi.",
      };
    }

    return {
      success: true,
      url: signedData.signedUrl,
    };
  } catch (error) {
    console.error("[uploadImageToSupabase] Unexpected error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan tak terduga saat mengupload file.",
    };
  }
}
