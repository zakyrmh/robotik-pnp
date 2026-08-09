# Laporan Rekomendasi Optimasi Kinerja (Performance Optimization Recommendations Report)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                             |
| :------------------------------------ | :-------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-OPT-01`                                                                  |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                   |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                    |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                           |
| **Induk Kebijakan (_Master Policy_)** | _Performance Management & Optimization Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                    |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                              |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                      |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis              | Ringkasan Perubahan                                                                                         |
| :------: | :--------: | :------------------- | :---------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Performance Engineer | Draf awal rekomendasi optimasi (image, caching, indexing, bundle size).                                     |
| `v2.0.0` | 09/08/2026 | System Analyst       | Revisi: Penambahan Document Control, perbaikan sintaks JSX props, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Area Fokus Optimasi

Dokumen ini berisi daftar rekomendasi teknis, tindakan perbaikan (_actionable items_), dan strategi optimasi berdasarkan hasil pengukuran kinerja (_system benchmarks_) pada aplikasi **Sistem Informasi Manajemen UKM Robotik PNP** berbasis **Next.js 16 (App Router)**.

Meskipun sistem telah memenuhi ambang batas _Quality Gate_ (Lighthouse Score 96/100, INP < 200ms), terdapat beberapa poin optimasi strategis untuk mempertahankan performa tinggi saat menangani lonjakan pengguna (_traffic spikes_).

### Area Fokus Utama

1. **Asset & Image Optimization**: Mengurangi akumulasi beban bandwidth dari foto profil anggota dan bukti presensi.
2. **Caching Strategy (Upstash Redis)**: Memperluas cakupan _Cache-Aside Pattern_ untuk data statis/semi-statis.
3. **Database & Query Performance**: Mengoptimalkan kueri Supabase PostgreSQL dan eksekusi RLS Policy.
4. **Bundle & Serverless Runtime**: Menekan waktu _cold start_ dan ukuran JavaScript bundle client.

---

## 2. Rekomendasi 1: Asset & Image Optimization

### 2.1. Wajib Gunakan Komponen `next/image` untuk Seluruh Media Anggota

- **Masalah**: Penggunaan tag HTML `<img>` standar pada foto profil anggota, galeri kegiatan, dan foto inventaris menyebabkan pemuatan gambar berukuran asli (_uncompressed_) tanpa format modern (WebP/AVIF).
- **Rekomendasi**:
  - Ganti seluruh tag `<img>` dengan komponen `next/image` bawaan Next.js.
  - Tentukan properti `sizes` secara presisi untuk merender responsif sesuai ukuran layar.
  - Aktifkan fitur `placeholder="blur"` untuk memberikan feedback visual halus saat memuat gambar.

```tsx
// Example Implementation
import Image from "next/image";

export function MemberAvatar({ src, name }: { src: string; name: string }) {
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-full">
      <Image
        alt={name}
        className="object-cover"
        fill
        loading="lazy"
        sizes="(max-width: 768px) 48px, 48px"
        src={src}
      />
    </div>
  );
}
```

---

## 3. Rekomendasi 2: Expanded Caching Strategy via Upstash Redis

### 3.1. Implementasi Caching untuk Struktur Organisasi & Pengaturan Oprec

- **Masalah**: Data struktur kepengurusan, daftar divisi/tim robotik (KRSBI, KRI, dll), dan pengaturan pendaftaran (_or_settings_) dibaca berulang kali dari Supabase PostgreSQL padahal jarang berubah.
- **Rekomendasi**:
- Terapkan _Cache-Aside Pattern_ menggunakan Upstash Redis (`lib/redis.ts`) dengan TTL (_Time To Live_) panjang (misal: 1 jam - 24 jam).
- Pemicu invalidasi cache (`redis.del()`) hanya dijalankan saat admin melakukan perbaikan/mutasi data via Server Action.

```typescript
// Example: Caching Struktur Organisasi
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

export async function getOrganizationStructure() {
  const cacheKey = "ukmrobotik:cache:org:structure";

  // 1. Check Redis Cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // 2. Query Supabase Database on Cache Miss
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_structures")
    .select("*")
    .order("rank");

  // 3. Set Redis Cache with 1 Day TTL (86400 seconds)
  await redis.set(cacheKey, JSON.stringify(data), { ex: 86400 });
  return data;
}
```

---

## 4. Rekomendasi 3: Database & RLS Query Optimization

### 4.1. Indexing pada Kolom Pencarian & Filter Sering Digunakan

- **Masalah**: Eksekusi kueri pada tabel `attendances` dan `profiles` melambat saat jumlah baris meningkat karena belum semua kolom filter ter-index.
- **Rekomendasi**:
- Tambahkan B-Tree Index pada kolom `activity_id` dan `profile_id` di tabel `attendances`.
- Tambahkan Index pada kolom `status` dan `nim` di tabel `profiles`.

```sql
-- Migration SQL: Adding Indexes for High-Traffic Queries
CREATE INDEX IF NOT EXISTS idx_attendances_activity_profile
  ON public.attendances (activity_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_profiles_nim_role
  ON public.profiles (nim, role);
```

---

## 5. Rekomendasi 4: Serverless Cold Start & Bundle Reduction

### 5.1. Dynamic Import untuk Komponen Berat (QR Code Scanner)

- **Masalah**: Library pemindai QR Code (`html5-qrcode`) memiliki ukuran bundle lumayan besar yang dapat memperlambat _initial load_ jika di-import secara top-level.
- **Rekomendasi**:
- Gunakan `next/dynamic` untuk mengimpor komponen QR Scanner secara _lazy loading_ hanya saat halaman `/kegiatan-absensi-caang/scan` diakses.

```tsx
import dynamic from "next/dynamic";

const DynamicQRScanner = dynamic(
  () => import("@/components/features/qr-scanner"),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  },
);
```

---

## 6. Ringkasan Prioritas Matriks Perbaikan

| Prioritas       | Item Optimasi                                                                    | Target Dampak                                                         | Estimasi Effort |
| --------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------- |
| **P1 (High)**   | Migrasi tag `<img>` ke `next/image` untuk seluruh foto anggota & bukti presensi. | Penurunan beban transfer bandwidth hingga 60-70%.                     | Low             |
| **P1 (High)**   | Implementasi Upstash Redis Cache untuk Struktur Organisasi & Oprec Settings.     | Latensi Server Action stabil di $< 30\text{ms}$.                      | Medium          |
| **P2 (Medium)** | Tambah B-Tree Index SQL pada kolom `attendances(activity_id, profile_id)`.       | Menjamin kecepatan kueri tetap stabil saat data $> 10.000$ baris.     | Low             |
| **P2 (Medium)** | Dynamic import (`next/dynamic`) pada modul scanner `html5-qrcode`.               | Mengurangi ukuran _initial JS bundle_ sebesar $\approx 120\text{KB}$. | Low             |

---

_Dokumen ini diterbitkan sebagai standar laporan rekomendasi optimasi kinerja resmi untuk UKM Robotik Politeknik Negeri Padang._
