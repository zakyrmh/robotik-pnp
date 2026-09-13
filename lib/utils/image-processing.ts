import imageCompression from "browser-image-compression";

interface ProcessImageResult {
  file: File;
  previewUrl: string;
  /** True jika file asli berformat HEIC/HEIF dan dikonversi ke JPEG. */
  wasHeic: boolean;
  /** lastModified file asli (waktu ambil foto menurut perangkat), epoch ms. */
  takenAtMs: number;
}

type Heic2AnyFn = (options: {
  blob: Blob;
  toType?: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

/**
 * Loads heic2any from the locally bundled npm dependency (code-split via
 * dynamic import) instead of a CDN, so conversion works offline and is not
 * blocked by CSP / ad-blockers.
 */
async function getHeic2AnyConverter(): Promise<Heic2AnyFn | null> {
  if (typeof window === "undefined") return null;

  try {
    const mod = (await import("heic2any")) as unknown as
      | Heic2AnyFn
      | { default: Heic2AnyFn };
    if (typeof mod === "function") return mod;
    if (mod && typeof (mod as { default: Heic2AnyFn }).default === "function") {
      return (mod as { default: Heic2AnyFn }).default;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Utility to process user-uploaded image files:
 * 1. Automatically converts iPhone HEIC / HEIF files to JPEG format.
 *    NOTE: konversi HEIC -> JPEG via heic2any TIDAK mempertahankan EXIF
 *    DateTimeOriginal, sehingga caller wajib memakai flag `wasHeic` +
 *    `takenAtMs` untuk jalur validasi fallback di server.
 * 2. Compresses image files to < 1MB while preserving EXIF metadata (JPEG path).
 * 3. Generates a data URL preview for client-side display.
 */
export async function processPiketImage(
  rawFile: File,
): Promise<ProcessImageResult> {
  let fileToProcess = rawFile;
  const takenAtMs = rawFile?.lastModified || Date.now();

  const fileNameLower = (rawFile?.name || "photo.jpg").toLowerCase();
  const fileTypeLower = (rawFile?.type || "").toLowerCase();

  const isHeic =
    fileNameLower.endsWith(".heic") ||
    fileNameLower.endsWith(".heif") ||
    fileTypeLower.includes("heic") ||
    fileTypeLower.includes("heif");

  // 1. Convert HEIC / HEIF to JPEG if needed
  let convertedFromHeic = false;
  if (isHeic) {
    try {
      const heic2any = await getHeic2AnyConverter();
      if (heic2any) {
        const convertedResult = await heic2any({
          blob: rawFile,
          toType: "image/jpeg",
          quality: 0.9,
        });

        const convertedBlob = Array.isArray(convertedResult)
          ? convertedResult[0]
          : convertedResult;

        const baseName =
          fileNameLower.replace(/\.(heic|heif)$/i, "") || "photo";
        const newFileName = `${baseName}.jpg`;
        fileToProcess = new File([convertedBlob], newFileName, {
          type: "image/jpeg",
          lastModified: takenAtMs,
        });
        convertedFromHeic = true;
      }
    } catch (error) {
      console.warn(
        "Konversi HEIC mengalami kendala, menggunakan file asli:",
        error,
      );
    }
  }

  // 2. Compress image using browser-image-compression with EXIF preservation
  try {
    const compressedFile = await imageCompression(fileToProcess, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      preserveExif: true,
      fileType: "image/jpeg",
    });

    // Handle Blob or File response safely (compressedFile might be a Blob without .name property)
    const targetName =
      (compressedFile as File)?.name ||
      fileToProcess?.name ||
      rawFile?.name ||
      "photo.jpg";

    const finalFileName =
      targetName.toLowerCase().endsWith(".jpg") ||
      targetName.toLowerCase().endsWith(".jpeg")
        ? targetName
        : `${targetName.split(".")[0] || "photo"}.jpg`;

    const finalFile = new File([compressedFile], finalFileName, {
      type: "image/jpeg",
      lastModified: fileToProcess.lastModified || Date.now(),
    });

    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(finalFile);
    });

    return {
      file: finalFile,
      previewUrl,
      wasHeic: convertedFromHeic,
      takenAtMs,
    };
  } catch (error) {
    console.error("Gagal mengompresi gambar:", error);
    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileToProcess);
    });
    return {
      file: fileToProcess,
      previewUrl,
      wasHeic: convertedFromHeic,
      takenAtMs,
    };
  }
}
