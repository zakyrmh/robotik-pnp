import imageCompression from "browser-image-compression";

export interface CompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

/**
 * Mengonversi gambar ke format WebP dan mengompres ukuran filenya secara client-side
 * sebelum dikirim ke server / R2.
 */
export async function compressAndConvertToWebp(
  file: File,
  options?: CompressOptions,
): Promise<File> {
  // Jika bukan file gambar (misal PDF atau dokumen lain), kembalikan file asli
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: options?.maxSizeMB ?? 0.8, // Target maksimal ~800KB
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1600, // Resolusi maksimal 1600px
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedBlob = await imageCompression(file, defaultOptions);

    // Ubah ekstensi nama file ke .webp
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const webpFileName = `${baseName || "attachment"}.webp`;

    return new File([compressedBlob], webpFileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn(
      "Gagal mengonversi/mengompres gambar ke WebP, menggunakan file asli:",
      error,
    );
    return file;
  }
}
