import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Membuat instance S3Client khusus Cloudflare R2
 */
function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Kredensial Cloudflare R2 (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY) belum diset pada environment variables.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Mengunggah file Buffer ke Cloudflare R2 bucket
 * @returns Public URL dari file yang diunggah
 */
export async function uploadToR2(params: {
  fileBuffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "ukm-robotik-pnp";
  const r2Client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.fileBuffer,
    ContentType: params.contentType,
  });

  await r2Client.send(command);

  return getPublicR2Url(params.key);
}

/**
 * Mengambil objek dari Cloudflare R2 bucket (Server-to-Server)
 */
export async function getObjectFromR2(key: string) {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "ukm-robotik-pnp";
  const r2Client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();

  return {
    body: byteArray,
    contentType: response.ContentType || "image/webp",
  };
}

/**
 * Menghapus objek dari Cloudflare R2 bucket
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const bucketName =
      process.env.CLOUDFLARE_R2_BUCKET_NAME || "ukm-robotik-pnp";
    const r2Client = getR2Client();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (err) {
    console.error("Gagal menghapus objek dari Cloudflare R2:", err);
    return false;
  }
}

/**
 * Mengonversi key objek R2 menjadi URL publik yang dapat diakses browser.
 * Secara otomatis menggunakan API Proxy internal (/api/r2/[key]) agar 100% bebas dari
 * pemblokiran ISP / Connection Time Out pada domain .r2.dev.
 */
export function getPublicR2Url(key: string | null | undefined): string {
  if (!key) return "";

  let cleanKey = key;

  // Jika key dalam bentuk URL r2.dev eksternal, ekstrak path key-nya
  if (cleanKey.includes(".r2.dev/")) {
    const pathIndex = cleanKey.indexOf(".r2.dev/");
    cleanKey = cleanKey.substring(pathIndex + 8);
  } else if (
    cleanKey.startsWith("http://") ||
    cleanKey.startsWith("https://")
  ) {
    // Jika sudah berupa URL eksternal selain r2.dev, gunakan apa adanya
    return cleanKey;
  }

  cleanKey = cleanKey.startsWith("/") ? cleanKey.slice(1) : cleanKey;

  // Jika CLOUDFLARE_R2_PUBLIC_URL diset dan BUKAN .r2.dev, gunakan domain kustom tersebut
  const customPublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (customPublicUrl && !customPublicUrl.includes(".r2.dev")) {
    const baseUrl = customPublicUrl.endsWith("/")
      ? customPublicUrl.slice(0, -1)
      : customPublicUrl;
    return `${baseUrl}/${cleanKey}`;
  }

  // Fallback utama: Gunakan Next.js internal API Proxy (/api/r2/[key])
  return `/api/r2/${cleanKey}`;
}
