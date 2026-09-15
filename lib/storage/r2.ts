import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// ============================================================
// S3 Client Factory — auto-switch MinIO (dev) ↔ Cloudflare R2 (prod)
//
// Logic prioritas endpoint:
//   1. S3_DEV_ENDPOINT diset  → MinIO / S3-compatible emulator (development)
//   2. CLOUDFLARE_ACCOUNT_ID diset → Cloudflare R2 production endpoint
//   3. Keduanya kosong         → throw error dengan pesan informatif
//
// Credentials (CLOUDFLARE_R2_ACCESS_KEY_ID / SECRET_ACCESS_KEY) dipakai
// untuk keduanya — di MinIO ini adalah MINIO_ROOT_USER / MINIO_ROOT_PASSWORD.
// ============================================================

type S3Mode = "minio" | "r2";

function resolveS3Config(): { endpoint: string; mode: S3Mode } {
  const devEndpoint = process.env.S3_DEV_ENDPOINT?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  if (devEndpoint) {
    // Mode MinIO / S3-compatible local emulator
    return { endpoint: devEndpoint, mode: "minio" };
  }

  if (accountId) {
    // Mode Cloudflare R2 production
    return {
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      mode: "r2",
    };
  }

  throw new Error(
    [
      "Konfigurasi storage belum lengkap. Pilih salah satu:",
      "  · Development (MinIO): set S3_DEV_ENDPOINT=http://127.0.0.1:9000 di .env.local",
      "  · Production (R2)    : set CLOUDFLARE_ACCOUNT_ID=<account-id> di .env",
    ].join("\n"),
  );
}

function getR2Client(): S3Client {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "CLOUDFLARE_R2_ACCESS_KEY_ID dan CLOUDFLARE_R2_SECRET_ACCESS_KEY belum diset.\n" +
        "Untuk MinIO: gunakan MINIO_ROOT_USER / MINIO_ROOT_PASSWORD sebagai nilainya.",
    );
  }

  const { endpoint, mode } = resolveS3Config();

  return new S3Client({
    region: mode === "minio" ? "us-east-1" : "auto", // MinIO membutuhkan region eksplisit
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // MinIO butuh forcePathStyle=true agar bucket name masuk ke path URL
    // bukan subdomain (http://localhost:9000/bucket vs http://bucket.localhost:9000)
    forcePathStyle: mode === "minio",
  });
}

// ============================================================
// Upload file ke bucket (MinIO atau R2)
// @returns Public URL dari file yang diunggah
// ============================================================
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

// ============================================================
// Ambil objek dari bucket (Server-to-Server, untuk API proxy)
// ============================================================
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

// ============================================================
// Hapus objek dari bucket
// ============================================================
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
    console.error("[R2] Gagal menghapus objek:", err);
    return false;
  }
}

// ============================================================
// Konversi R2/MinIO key → URL yang dapat diakses browser.
//
// Priority:
//   1. CLOUDFLARE_R2_PUBLIC_URL diset dan bukan .r2.dev
//      → pakai domain kustom (termasuk URL MinIO: http://localhost:9000/bucket)
//   2. Fallback → Next.js internal API proxy  /api/r2/{key}
//      (menghindari ISP throttle terhadap .r2.dev)
// ============================================================
export function getPublicR2Url(key: string | null | undefined): string {
  if (!key) return "";

  let cleanKey = key.trim();

  // Strip duplikat prefix /api/r2/ jika key sudah diformat sebelumnya
  while (cleanKey.startsWith("/api/r2/") || cleanKey.startsWith("api/r2/")) {
    if (cleanKey.startsWith("/api/r2/")) {
      cleanKey = cleanKey.substring(8);
    } else {
      cleanKey = cleanKey.substring(7);
    }
  }

  // Jika key adalah URL r2.dev eksternal, ekstrak path-nya saja
  if (cleanKey.includes(".r2.dev/")) {
    const pathIndex = cleanKey.indexOf(".r2.dev/");
    cleanKey = cleanKey.substring(pathIndex + 8);
  } else if (
    cleanKey.startsWith("http://") ||
    cleanKey.startsWith("https://")
  ) {
    // URL eksternal non-r2.dev (misal Supabase) → gunakan apa adanya
    return cleanKey;
  }

  cleanKey = cleanKey.startsWith("/") ? cleanKey.slice(1) : cleanKey;

  // Pakai custom public URL jika diset dan bukan .r2.dev
  const customPublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (customPublicUrl && !customPublicUrl.includes(".r2.dev")) {
    const baseUrl = customPublicUrl.endsWith("/")
      ? customPublicUrl.slice(0, -1)
      : customPublicUrl;
    return `${baseUrl}/${cleanKey}`;
  }

  // Fallback: Next.js API proxy (aman untuk produksi di belakang CDN)
  return `/api/r2/${cleanKey}`;
}
