/**
 * Utility functions untuk Cloudflare R2
 * Menggunakan AWS SDK V3 karena R2 kompatibel penuh dengan S3 API.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

// Variabel environment untuk konfigurasi akses R2
// Harus di set di file .env.local
const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

// Nama bucket utama, opsional didefinisikan secara global
const defaultBucket = process.env.R2_BUCKET_NAME

/**
 * Inisialisasi S3/R2 Client global
 */
export const r2Client = new S3Client({
  region: 'auto', // AWS SDK mewajibkan region, tapi R2 menggunakan 'auto'
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    // Memberikan string kosong sementara jika env var belum terkonfigurasi,
    // (Mencegah crashing module load, namun akan terjadi error ketika client digunakan)
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})

/**
 * Tipe opsi pembantu untuk penentuan nama bucket opsional pada operasi individual
 */
interface R2Options {
  bucket?: string
  contentType?: string
}

/**
 * Mengunggah file ke Cloudflare R2
 * 
 * @param key Lokasi dan nama file tujuan di dalam bucket (misal: 'dokumen/caang-1.pdf')
 * @param body Konten file, bisa dalam bentuk Buffer, string, Stream, atau Blob
 * @param options Opsi opsional penyertaan `bucket` eksklusif atau `contentType` eksklusif
 * @returns Objek response dengan status keberhasilan
 */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer | string | Blob,
  options?: R2Options
) {
  const bucket = options?.bucket || defaultBucket
  if (!bucket) throw new Error('Nama bucket R2 tidak terkonfigurasi.')

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
      })
    )
    return { success: true, key }
  } catch (error) {
    console.error('Error saat upload ke R2:', error)
    return { success: false, error }
  }
}

/**
 * Mengunduh file dari Cloudflare R2 dan mengambil isinya sebagai string.
 * Sangat berguna untuk membaca file txt/json/csv.
 * 
 * @param key Lokasi file yang ada di bucket
 * @param options Opsi opsional nama bucket
 * @returns Konten string dari file
 */
export async function downloadTextFromR2(key: string, options?: R2Options) {
  const bucket = options?.bucket || defaultBucket
  if (!bucket) throw new Error('Nama bucket R2 tidak terkonfigurasi.')

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    
    // Transform content menjadi string (bergantung jenis file tekstual)
    const content = await response.Body?.transformToString()
    return { success: true, content }
  } catch (error) {
    console.error('Error saat download teks dari R2:', error)
    return { success: false, error, content: null }
  }
}

/**
 * Mendapatkan Public URL dari objek R2 (jika Bucket disetel publik/akses melalui custom domain).
 * Tidak berinteraksi dengan S3 SDK melainkan membangun URL berdasarkan endpoint yang ditentukan akun R2-mu.
 *
 * @param key Lokasi/nama file objek  
 * @param publicUrl Custom domain Cloudflare kamu (misal: 'https://storage.robotikpnp.com')
 */
export function getR2PublicUrl(key: string, publicUrl: string) {
  // Membersihkan garis miring ekstra dan menggabungkan URL
  const base = publicUrl.replace(/\/+$/, '')
  const path = key.replace(/^\/+/, '')
  return `${base}/${path}`
}

/**
 * Membaca daftar file (list) objek-objek di dalam Bucket R2
 * 
 * @param prefix Awalan (folder) penyaringan (opsional, misal: 'images/')
 * @param options Opsi penentuan bucket name alternatif
 * @returns Array dari key/path file
 */
export async function listR2Objects(prefix?: string, options?: R2Options) {
  const bucket = options?.bucket || defaultBucket
  if (!bucket) throw new Error('Nama bucket R2 tidak terkonfigurasi.')

  try {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
    )
    
    // Mengekstraksi key setiap file/item, singkirkan nullable keys
    const keys = response.Contents?.map((obj) => obj.Key).filter((k): k is string => Boolean(k)) || []
    return { success: true, keys }
  } catch (error) {
    console.error('Error saat list objek di R2:', error)
    return { success: false, error, keys: [] }
  }
}

/**
 * Menghapus suatu objek/file dari R2 secara permanen.
 * 
 * @param key Lokasi/nama file di R2 yang akan dihapus
 * @param options Penggunaan bucket name penimpa default
 */
export async function deleteFromR2(key: string, options?: R2Options) {
  const bucket = options?.bucket || defaultBucket
  if (!bucket) throw new Error('Nama bucket R2 tidak terkonfigurasi.')

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error saat menghapus file dari R2:', error)
    return { success: false, error }
  }
}
