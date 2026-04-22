"use server";

/**
 * Server Actions — Upload File
 *
 * Upload gambar ke Supabase Storage.
 * Menyimpan storage path ke database (bukan signed URL)
 * agar URL bisa di-generate on-demand dan tidak kadaluarsa.
 *
 * Bucket yang tersedia:
 * - or-documents  : dokumen pendaftaran caang
 * - piket-proofs  : bukti piket anggota
 * - fine-payments : bukti pembayaran denda
 * - point-proofs  : bukti penebusan poin komdis
 */

import { createClient } from "@/lib/supabase/server";
import { requireAuth, isActionError, ok, fail } from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";

// ── Bucket yang diizinkan ──
const ALLOWED_BUCKETS = [
  "or-documents",
  "piket-proofs",
  "fine-payments",
  "point-proofs",
  "profiles",
] as const;

type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload gambar ke Supabase Storage.
 * Mengembalikan storage path (bukan signed URL) untuk disimpan ke database.
 * Gunakan `getSignedUrl()` untuk mendapatkan URL akses saat diperlukan.
 *
 * @param formData FormData berisi key "file"
 * @param bucket   Nama bucket tujuan
 * @param folder   Subfolder di dalam bucket
 */
export async function uploadImage(
  formData: FormData,
  bucket: AllowedBucket,
  folder: string,
): Promise<ActionResult<{ path: string; signedUrl: string }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    // Validasi bucket
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return fail("Bucket tidak valid.");
    }

    // Validasi folder (hindari path traversal)
    if (folder.includes("..") || folder.startsWith("/")) {
      return fail("Folder tidak valid.");
    }

    // Ambil dan validasi file
    const file = formData.get("file") as File | null;
    if (!file) return fail("Tidak ada file yang dikirim.");

    if (file.size > MAX_FILE_SIZE) {
      return fail("Ukuran file terlalu besar (Maksimal 5MB).");
    }

    if (!file.type.startsWith("image/")) {
      return fail("Hanya file gambar yang diperbolehkan (JPG, PNG, WebP).");
    }

    // Bangun path unik
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${auth.userId}-${Date.now()}-${cleanFileName}`;
    const storagePath = `${folder}/${filename}`;

    const supabase = await createClient();

    // Upload ke Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadImage] Upload error:", uploadError);
      return fail(`Gagal mengupload file: ${uploadError.message}`);
    }

    // Generate signed URL untuk ditampilkan langsung setelah upload
    // (berlaku 1 jam — hanya untuk preview, path yang disimpan ke DB)
    const ONE_HOUR = 60 * 60;
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, ONE_HOUR);

    if (signedError || !signedData?.signedUrl) {
      // File sudah terupload — hapus agar tidak ada orphan
      await supabase.storage.from(bucket).remove([storagePath]);
      return fail("File terupload tapi gagal membuat URL akses. Coba ulangi.");
    }

    // Kembalikan KEDUANYA:
    // - path: untuk disimpan ke database
    // - signedUrl: untuk ditampilkan langsung di UI (preview)
    return ok({
      path: storagePath,
      signedUrl: signedData.signedUrl,
    });
  } catch (err) {
    console.error("[uploadImage]", err);
    return fail("Terjadi kesalahan saat mengupload file.");
  }
}

/**
 * Generate signed URL dari storage path yang disimpan di database.
 * Panggil ini setiap kali perlu menampilkan gambar dari storage.
 * Signed URL berlaku 1 jam.
 *
 * @param bucket      Nama bucket
 * @param storagePath Path yang tersimpan di database
 */
export async function getSignedUrl(
  bucket: AllowedBucket,
  storagePath: string,
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return fail("Bucket tidak valid.");
    }

    const supabase = await createClient();
    const ONE_HOUR = 60 * 60;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, ONE_HOUR);

    if (error || !data?.signedUrl) return fail("Gagal membuat URL akses.");
    return ok({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error("[getSignedUrl]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Hapus file dari storage — dipanggil saat data dihapus dari database.
 *
 * @param bucket      Nama bucket
 * @param storagePath Path file yang akan dihapus
 */
export async function deleteFile(
  bucket: AllowedBucket,
  storagePath: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return fail("Bucket tidak valid.");
    }

    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[deleteFile]", err);
    return fail("Terjadi kesalahan.");
  }
}
