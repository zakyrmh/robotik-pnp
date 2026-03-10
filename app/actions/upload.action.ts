"use server";

import { uploadToR2, getR2PublicUrl } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

export async function uploadImageToR2(formData: FormData, folder: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    // Validasi ukuran (maksimal 5MB, meski client sudah compress)
    if (file.size > 5 * 1024 * 1024)
      return {
        success: false,
        error: "Ukuran file terlalu besar (Maksimal 5MB)",
      };

    // Validasi tipe file
    if (!file.type.startsWith("image/"))
      return { success: false, error: "Hanya file gambar yang diperbolehkan" };

    // Pastikan env public URL sudah diset SEBELUM upload agar tidak ada file
    // terupload ke R2 namun URL-nya tidak bisa disimpan ke database dengan benar.
    const publicR2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!publicR2Url) {
      return {
        success: false,
        error:
          "Konfigurasi server tidak lengkap: NEXT_PUBLIC_R2_PUBLIC_URL belum diset. Hubungi administrator.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Hilangkan karakter spesial dari nama file dan buat unik dengan userId & timestamp
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${user.id}-${Date.now()}-${cleanFileName}`;
    const key = `${folder}/${filename}`;

    const result = await uploadToR2(key, buffer, {
      contentType: file.type,
    });

    if (!result.success) return { success: false, error: result.error };

    // Selalu kembalikan URL publik (r2.dev atau custom domain) — inilah yang disimpan ke database.
    // URL ini bisa diakses langsung oleh browser tanpa autentikasi AWS Signature.
    return {
      success: true,
      url: getR2PublicUrl(key, publicR2Url),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Gagal mengupload file ke storage server" };
  }
}
