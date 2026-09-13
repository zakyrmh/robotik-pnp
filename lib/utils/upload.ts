import imageCompression from "browser-image-compression";

/**
 * Memeriksa dan mengonversi file berformat HEIC / HEIF (seperti foto dari iPhone)
 * menjadi JPEG di sisi client sebelum dikompresi lebih lanjut.
 */
async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!file) return file;

  const fileNameLower = (file.name || "").toLowerCase();
  const fileTypeLower = (file.type || "").toLowerCase();

  const isHeic =
    fileNameLower.endsWith(".heic") ||
    fileNameLower.endsWith(".heif") ||
    fileTypeLower.includes("heic") ||
    fileTypeLower.includes("heif");

  if (!isHeic) {
    return file;
  }

  if (typeof window === "undefined") {
    return file;
  }

  try {
    const { default: heic2any } = await import("heic2any");
    const convertedResult = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    const convertedBlob = Array.isArray(convertedResult)
      ? convertedResult[0]
      : convertedResult;

    const lastDotIndex = file.name.lastIndexOf(".");
    const baseName =
      lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
    const newFileName = `${baseName || "photo"}.jpg`;

    return new File([convertedBlob], newFileName, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
  } catch (error) {
    console.warn("Konversi HEIC ke JPEG gagal, menggunakan file asli:", error);
    return file;
  }
}

export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
): Promise<File> {
  const fileToProcess = await convertHeicIfNeeded(file);

  if (
    !fileToProcess.type.startsWith("image/") ||
    fileToProcess.type === "image/gif"
  ) {
    return fileToProcess;
  }

  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType:
      fileToProcess.type === "image/png" ? "image/png" : "image/jpeg",
  };

  try {
    const compressedFile = await imageCompression(fileToProcess, options);
    return new File([compressedFile], fileToProcess.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return fileToProcess;
  }
}

/**
 * Mengompresi dan mengonversi gambar ke format WebP di sisi browser/client.
 * Secara otomatis menangani file HEIC/HEIF (foto iPhone) sebelum dikompresi ke WebP.
 * Menghasilkan file WebP yang berukuran jauh lebih kecil namun tetap jelas.
 */
export async function compressImageToWebp(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
): Promise<File> {
  const fileToProcess = await convertHeicIfNeeded(file);

  if (
    !fileToProcess.type.startsWith("image/") ||
    fileToProcess.type === "image/gif"
  ) {
    return fileToProcess;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedBlob = await imageCompression(fileToProcess, options);

    // Ganti ekstensi file asli/terkonversi menjadi .webp jika belum
    const originalName = fileToProcess.name;
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
    return fileToProcess;
  }
}
