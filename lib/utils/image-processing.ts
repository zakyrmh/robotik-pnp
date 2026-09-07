import imageCompression from "browser-image-compression";

interface ProcessImageResult {
  file: File;
  previewUrl: string;
}

/**
 * Dynamically loads heic2any for HEIC conversion on the client side without bundle overhead or npm lock dependencies.
 */
async function getHeic2AnyConverter() {
  if (typeof window === "undefined") return null;

  const win = window as unknown as Record<string, unknown>;
  if (win.heic2any) {
    return win.heic2any as (options: {
      blob: Blob;
      toType?: string;
      quality?: number;
    }) => Promise<Blob | Blob[]>;
  }

  try {
    const cdnUrl = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/+esm";
    const importedModule = (await new Function(
      `return import("${cdnUrl}")`,
    )()) as {
      default?: (options: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
    };
    return importedModule?.default || null;
  } catch {
    return null;
  }
}

/**
 * Utility to process user-uploaded image files:
 * 1. Automatically converts iPhone HEIC / HEIF files to JPEG format.
 * 2. Compresses image files to < 1MB while preserving EXIF metadata.
 * 3. Generates a data URL preview for client-side display.
 */
export async function processPiketImage(
  rawFile: File,
): Promise<ProcessImageResult> {
  let fileToProcess = rawFile;

  const fileNameLower = (rawFile?.name || "photo.jpg").toLowerCase();
  const fileTypeLower = (rawFile?.type || "").toLowerCase();

  const isHeic =
    fileNameLower.endsWith(".heic") ||
    fileNameLower.endsWith(".heif") ||
    fileTypeLower.includes("heic") ||
    fileTypeLower.includes("heif");

  // 1. Convert HEIC / HEIF to JPEG if needed
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
          lastModified: rawFile.lastModified || Date.now(),
        });
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

    return { file: finalFile, previewUrl };
  } catch (error) {
    console.error("Gagal mengompresi gambar:", error);
    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileToProcess);
    });
    return { file: fileToProcess, previewUrl };
  }
}
