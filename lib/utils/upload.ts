import imageCompression from "browser-image-compression";

export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return file;
  }
}

/**
 * Mengompresi dan mengonversi gambar ke format WebP di sisi browser/client.
 * Menghasilkan file WebP yang berukuran jauh lebih kecil namun tetap jelas.
 */
export async function compressImageToWebp(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // Ganti ekstensi file asli menjadi .webp jika belum
    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf(".");
    const baseName =
      lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
    const webpName = `${baseName}.webp`;

    return new File([compressedBlob], webpName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error compressing image to WebP:", error);
    return file;
  }
}
