# DOKUMENTASI ARSITEKTUR & SPESIFIKASI FITUR PRESENSI KOMISI DISIPLIN

**Sistem Informasi Manajemen UKM Robotik PNP**

---

## 1. Ringkasan Eksekutif & Tech Stack

Dokumen ini mendefinisikan arsitektur sistem, alur kerja backend, skema routing, serta standar keamanan siber dan kode etik untuk **Modul Presensi & Kedisiplinan Komdis**.

### Tech Stack Utama

- **Framework**: Next.js 16 App Router (Tanpa direktori `src/`, struktur folder di tingkat akar: `/app`, `/lib`, `/components`, `/public`).
- **Bahasa**: TypeScript (`strict: true`).
- **Database & Auth**: Supabase PostgreSQL + Auth (Tanpa ORM, menggunakan Native SQL Client `@supabase/ssr` / `@supabase/supabase-js`).
- **Validasi Data**: Zod (Schema Validation untuk _request payload_ dan _Server Actions_).
- **Hosting / Deployment**: Vercel.
- **Enkripsi & Security**: Native Node.js `crypto` (AES-256-CBC) untuk Dynamic QR Token.

---

## 2. Pemisahan Layer Arsitektur (Layer Separation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT SIDE (BROWSER)                         │
│  - React Client Components ("use client")                                │
│  - Form Handling & Interaktivitas UI                                    │
│  - HTML5 QR Code Camera Scanner (html5-qrcode)                          │
│  - Geolocation Browser API (opsional)                                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP Request / Server Actions Call
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SERVER SIDE (NEXT.JS 16 CORE)                     │
│  - Routing Proxy Guard (proxy.ts) ── Gatekeeper Session & Role Check    │
│  - React Server Components (RSC)  ── SSR Rendering                      │
│  - Server Actions (lib/actions/komdis.ts)                               │
│  - Zod Schema Validation & Business Logic Processing                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Native Query / RPC Call
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER (SUPABASE)                       │
│  - PostgreSQL Tables (activities, attendances, discipline_point_logs)   │
│  - Row Level Security (RLS) Policies ── Native Enforcement              │
│  - Database Views (v_user_discipline_summary)                           │
│  - Triggers & Functions (Auto Target Audience, Timestamp Handlers)      │
└─────────────────────────────────────────────────────────────────────────┘

```

### A. Layer Client Side

- Berfokus pada antarmuka pengguna (UI/UX) dan respon interaktif.
- Menggunakan React Client Components (`"use client"`) untuk fungsionalitas pemindaian kamera (`html5-qrcode`), _countdown timer_ QR Code dinamis, dan _form state handling_.
- Melakukan validasi awal pada masukan pengguna dengan Zod sebelum dikirim ke Server.

### B. Layer Server Side (Next.js 16)

- **Auth Guard & Middleware Equivalent (`proxy.ts`)**: Pada Next.js 16, fungsi proteksi rute di tingkat _edge_ dikelola oleh `proxy.ts`. Berfungsi memverifikasi sesi aktif Supabase Auth, mengambil _role_ pengguna, dan memblokir akses non-`admin-komdis` / non-`super-admin` sebelum request mencapai Server Component.
- **Server Actions (`lib/actions/komdis.ts`)**: Menjadi satu-satunya pintu masuk (_single entry point_) mutasi data khusus modul Komdis. Menerima _request_, memvalidasi dengan Zod, mengeksekusi logika bisnis, dan memanggil Supabase Client.

### C. Layer Database

- Database PostgreSQL Supabase mengisolasi data melalui **Row Level Security (RLS)**.
- Logika dasar seperti perhitungan poin akumulasi disediakan melalui _Database View_ (`v_user_discipline_summary`) untuk menjamin performa tinggi dan konsistensi data.

---

## 3. Matriks Routing & Peta Navigasi Halaman

Peta navigasi menggunakan struktur gabungan fitur presensi umum dan khusus Komdis:

| Route Path   | Komponen Utama   | Akses Role        | Fungsi & Deskripsi                                                                       |
| ------------ | ---------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `/dashboard` | Server Component | All Authenticated | Menampilkan widget poin kedisiplinan pribadi, indikator SP, dan peringatan sanksi aktif. |

|
| `/kegiatan` | Server Component | `admin-komdis`, `admin-or`, `anggota`, `caang` | Daftar seluruh agenda. Terfilter via RLS (Anggota melihat target `anggota`, Caang melihat target `caang`). |
| `/kegiatan/[id]` | Server Component | `admin-komdis`, `admin-or`, `anggota`, `caang` | Detail agenda kegiatan, rekap presensi, serta tombol aksi tergantung _role_. |
| `/kegiatan/[id]/absensi` | Client Component | `admin-komdis`, `admin-or`, `anggota`, `caang` | **Anggota/Caang**: Generator QR Code Dinamis & Form Izin.<br>

<br>**Komdis/OR**: Mode pemindai QR kamera (`html5-qrcode`). |
| `/perizinan` | Server/Client | `admin-komdis`, `admin-or` | Dashboard persetujuan surat izin/sakit. Komdis mengulas bukti dan menetapkan status _approved_/_rejected_.

|
| `/kedisiplinan` | Server Component | `admin-komdis`, `super-admin` | Tabel rekap poin seluruh anggota beserta indikator status SP (SP1 $\ge 30$, SP2 $\ge 50$, SP3 $\ge 100$).

|
| `/kedisiplinan/[profileId]` | Server Component | `admin-komdis`, `super-admin` | Rincian riwayat sanksi per anggota, pencatatan pemutihan poin sanksi Goro (-10/-15 poin), dan penerbitan SP.

|

---

## 4. Spesifikasi Backend Logic (`lib/actions/komdis.ts`)

Seluruh fungsionalitas backend untuk Komisi Disiplin terpusat di `lib/actions/komdis.ts`.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server"; // Client Supabase SSR
import { z } from "zod";
import { decryptQRToken } from "@/lib/utils/crypto";

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CreateKomdisActivitySchema = z.object({
  title: z.string().min(3, "Judul kegiatan minimal 3 karakter"),
  description: z.string().optional(),
  start_date: z.string().datetime("Format tanggal mulai tidak valid"),
  end_date: z.string().datetime("Format tanggal selesai tidak valid"),
  location: z.string().min(2, "Lokasi wajib diisi"),
  checkin_open_at: z.string().datetime("Waktu buka absensi wajib diisi"),
  checkin_close_at: z.string().datetime("Waktu tutup absensi wajib diisi"),
  late_tolerance_minutes: z.number().int().nonnegative().default(15),
});

export const ReviewLeaveSchema = z.object({
  attendanceId: z.string().uuid(),
  approvalStatus: z.enum(["approved", "rejected"]),
  pointsAwarded: z.number().int().nonnegative(), // 5 jika approved, 10 jika rejected[cite: 4]
  rejectionReason: z.string().optional(),
});

export const ManualAttendanceSchema = z.object({
  activityId: z.string().uuid(),
  profileId: z.string().uuid(),
  status: z.enum(["hadir", "telat", "izin", "sakit", "alfa"]),
  pointsAwarded: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

export const LogPointReductionSchema = z.object({
  profileId: z.string().uuid(),
  category: z.enum(["goro_sp1", "goro_sp2", "penyesuaian_komdis"]),
  points: z.number().int().negative("Poin pemutihan harus bernilai negatif"), // Contoh: -10 atau -15[cite: 4]
  description: z.string().min(5, "Deskripsi pemutihan wajib diisi"),
});

export const IssueSanctionSchema = z.object({
  profileId: z.string().uuid(),
  spLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pointsAtIssuance: z.number().int().positive(),
  notes: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTION: AUTH & ROLE CHECKER
// ============================================================================

async function verifyKomdisRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Sesi tidak ditemukan.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !["admin-komdis", "super-admin"].includes(profile.role)) {
    throw new Error("Forbidden: Akses khusus Komisi Disiplin.");
  }

  return { supabase, user };
}

// ============================================================================
// SERVER ACTIONS IMPLEMENTATION
// ============================================================================

/**
 * 1. Membuat Kegiatan Baru Khusus Komdis (Target Audience Otomatis 'anggota')
 */
export async function createKomdisActivity(
  rawInput: z.infer<typeof CreateKomdisActivitySchema>,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = CreateKomdisActivitySchema.parse(rawInput);

  const { data, error } = await supabase
    .from("activities")
    .insert({
      ...validated,
      target_audience: "anggota",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal membuat kegiatan: ${error.message}`);

  revalidatePath("/kegiatan");
  return { success: true, data };
}

/**
 * 2. Scan QR Code Presensi oleh Kamera HP Admin Komdis
 */
export async function scanAttendanceQRByAdmin(
  activityId: string,
  qrToken: string,
) {
  const { supabase, user } = await verifyKomdisRole();

  // Dekripsi & Validasi Token Dinamis AES-256
  const decrypted = decryptQRToken(qrToken);
  if (!decrypted || decrypted.activity_id !== activityId) {
    return {
      success: false,
      message: "QR Code tidak valid atau salah kegiatan.",
    };
  }

  // Cek masa berlaku token (Maksimal 5 menit / 300.000 ms)
  const isExpired = Date.now() - decrypted.generated_at > 300000;
  if (isExpired) {
    return {
      success: false,
      message: "QR Code kadaluarsa, silakan refresh QR Code peserta.",
    };
  }

  // Ambil data kegiatan untuk kalkulasi keterlambatan
  const { data: activity } = await supabase
    .from("activities")
    .select("start_date, late_tolerance_minutes")
    .eq("id", activityId)
    .single();

  if (!activity)
    return { success: false, message: "Kegiatan tidak ditemukan." };

  const now = new Date();
  const startDate = new Date(activity.start_date);
  const lateLimit = new Date(
    startDate.getTime() + activity.late_tolerance_minutes * 60000,
  );

  // SOP: Hadir tepat waktu vs Telat (< 1 jam)
  const status = now > lateLimit ? "telat" : "hadir";

  const { error } = await supabase.from("attendances").upsert(
    {
      activity_id: activityId,
      profile_id: decrypted.profile_id,
      check_in_at: now.toISOString(),
      status: status,
      approval_status: "approved",
      verified_by: user.id,
      points_awarded: 0, // Telat < 1 jam = 0 poin sanksi[cite: 4]
    },
    { onConflict: "activity_id,profile_id" },
  );

  if (error)
    return {
      success: false,
      message: `Gagal mencatat presensi: ${error.message}`,
    };

  revalidatePath(`/kegiatan/${activityId}`);
  return {
    success: true,
    status,
    message: `Presensi Berhasil (${status.toUpperCase()})`,
  };
}

/**
 * 3. Review Pengajuan Izin / Sakit
 */
export async function reviewLeaveRequest(
  rawInput: z.infer<typeof ReviewLeaveSchema>,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = ReviewLeaveSchema.parse(rawInput);

  const { error } = await supabase
    .from("attendances")
    .update({
      approval_status: validated.approvalStatus,
      points_awarded: validated.pointsAwarded,
      rejection_reason: validated.rejectionReason || null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", validated.attendanceId);

  if (error) throw new Error(`Gagal memproses perizinan: ${error.message}`);

  revalidatePath("/perizinan");
  return { success: true };
}

/**
 * 4. Penandaan Alfa Massal (Batch Mark Alfa) Setelah Sesi Selesai
 */
export async function batchMarkAlfa(activityId: string) {
  const { supabase, user } = await verifyKomdisRole();

  // Ambil daftar anggota aktif yang belum ada record di attendances
  const { data: unrecordedMembers, error: fetchError } = await supabase.rpc(
    "get_unrecorded_activity_members",
    { p_activity_id: activityId },
  );

  if (fetchError)
    throw new Error(`Gagal mengambil data peserta: ${fetchError.message}`);

  if (unrecordedMembers && unrecordedMembers.length > 0) {
    const payload = unrecordedMembers.map((member: { profile_id: string }) => ({
      activity_id: activityId,
      profile_id: member.profile_id,
      status: "alfa",
      approval_status: "approved",
      verified_by: user.id,
      points_awarded: 15, // SOP Alfa tanpa kabar = 15 poin[cite: 4]
    }));

    const { error: insertError } = await supabase
      .from("attendances")
      .insert(payload);
    if (insertError)
      throw new Error(`Gagal memproses alfa massal: ${insertError.message}`);
  }

  revalidatePath(`/kegiatan/${activityId}`);
  return { success: true, count: unrecordedMembers?.length || 0 };
}

/**
 * 5. Input Pemutihan / Pengurangan Poin Sanksi Goro
 */
export async function logPointReduction(
  rawInput: z.infer<typeof LogPointReductionSchema>,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = LogPointReductionSchema.parse(rawInput);

  const { error } = await supabase.from("discipline_point_logs").insert({
    profile_id: validated.profileId,
    category: validated.category,
    points: validated.points, // bernilai negatif (-10 / -15)[cite: 4]
    description: validated.description,
    created_by: user.id,
  });

  if (error) throw new Error(`Gagal mencatat pemutihan poin: ${error.message}`);

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
  return { success: true };
}

/**
 * 6. Penerbitan Surat Peringatan (SP1, SP2, SP3)
 */
export async function issueSanction(
  rawInput: z.infer<typeof IssueSanctionSchema>,
) {
  const { supabase, user } = await verifyKomdisRole();
  const validated = IssueSanctionSchema.parse(rawInput);

  const { error } = await supabase.from("sanctions").insert({
    profile_id: validated.profileId,
    sp_level: validated.spLevel,
    points_at_issuance: validated.pointsAtIssuance,
    issued_by: user.id,
    notes: validated.notes || null,
    status: "active",
  });

  if (error) throw new Error(`Gagal menerbitkan SP: ${error.message}`);

  revalidatePath(`/kedisiplinan/${validated.profileId}`);
  return { success: true };
}
```

---

## 5. Ringkasan DDL Skema Database & RLS Final

```sql
-- 1. MODIFIKASI TABEL ATTENDANCES
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0;

-- 2. TABEL LOG PEMUTIHAN POIN (GORO)
CREATE TABLE IF NOT EXISTS public.discipline_point_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL, -- Nilai negatif (-10 / -15)[cite: 4]
  category text NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discipline_point_logs_pkey PRIMARY KEY (id)
);

-- 3. TABEL SANCTIONS (SURAT PERINGATAN)
CREATE TABLE IF NOT EXISTS public.sanctions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sp_level integer NOT NULL CHECK (sp_level IN (1, 2, 3)),
  points_at_issuance integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'resolved')),
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT sanctions_pkey PRIMARY KEY (id)
);

-- 4. VIEW RANGKUMAN POIN NETTO REAL-TIME
CREATE OR REPLACE VIEW public.v_user_discipline_summary AS
SELECT
  p.id AS profile_id,
  p.full_name,
  p.nim,
  COALESCE(att.total_attendance_points, 0) AS total_attendance_points,
  COALESCE(log.total_log_points, 0) AS total_log_points,
  (COALESCE(att.total_attendance_points, 0) + COALESCE(log.total_log_points, 0)) AS net_points
FROM public.profiles p
LEFT JOIN (
  SELECT profile_id, SUM(points_awarded) AS total_attendance_points
  FROM public.attendances GROUP BY profile_id
) att ON p.id = att.profile_id
LEFT JOIN (
  SELECT profile_id, SUM(points) AS total_log_points
  FROM public.discipline_point_logs GROUP BY profile_id
) log ON p.id = log.profile_id;

```

---

## 6. Panduan Kode Etik & Keamanan Siber

Aplikasi ini mengelola data sensitif mahasiswa dan keputusan kedisiplinan organisasi. Kebijakan keamanan siber berikut wajib dipatuhi:

### A. Keamanan Akses & Otorisasi (Defense in Depth)

1. **Layer 1 - Route Proxy (`proxy.ts`)**: Mencegah akses yang tidak sah (_unauthorized access_) sebelum _rendering_ terjadi di server.
2. **Layer 2 - Server Action Level**: Memverifikasi ulang hak akses pengguna melalui `verifyKomdisRole()` pada setiap _Server Action_. Jangan pernah mempercayai data atau _role_ yang dikirim dari _client-side_.
3. **Layer 3 - Native Database RLS**: Memastikan aturan keamanan tetap terintegrasi pada level PostgreSQL meskipun query dieksekusi di luar Next.js.

### B. Proteksi QR Code Dinamis & Anti-Titip Absen

1. **Enkripsi AES-256-CBC**: Token QR tidak boleh berisi plaintext ID mentah. Token harus berupa biner terkompresi terenkripsi AES-256-CBC dengan _Initialization Vector_ (IV) acak.
2. **Batas Waktu Ketat (Time-To-Live / TTL)**: QR Code dikonfigurasi untuk kedaluwarsa secara otomatis dalam **5 menit (300 detik)**. Hal ini mencegah penggunaan ulang _screenshot_ QR Code oleh pengguna lain.
3. **Audit Trail Verifikasi**: Kolom `verified_by` wajib mencatat UUID akun Komdis yang memindai QR Code sebagai bukti pencatatan resmi (_non-repudiation_).

### C. Perlindungan Data Pribadi (Data Privacy & GDPR Principles)

1. **Prinsip Principle of Least Privilege (PoLP)**:

- Anggota biasa hanya berhak membaca data presensi dan poin kedisiplinan milik sendiri (`profile_id = auth.uid()`).
- Akses untuk melihat seluruh rekap poin organisasi dibatasi hanya untuk `admin-komdis` dan `super-admin`.

2. **Penyimpanan Dokumen Surat Izin/Sakit**:

- File surat izin/sakit yang diunggah ke Supabase Storage wajib disimpan di dalam _private bucket_.
- URL lampiran tidak boleh dibuka secara publik, melainkan diakses melalui _Signed URL_ berdurasi pendek.

### D. Pencegahan Kerentanan OWASP Top 10

1. **SQL Injection**: Dilarang menggunakan _string concatenation_ dalam membuat SQL query. Selalu gunakan _parameterized queries_ bawaan Supabase SDK atau RPC Stored Procedures.
2. **Broken Access Control**: Setiap tindakan mutasi data wajib memverifikasi kepemilikan data atau kewenangan _role_.
3. **Input Validation**: Seluruh masukan masif/form wajib lolos sanitasi dan validasi tipe data menggunakan **Zod Schema**.
4. **Mass Assignment Prevention**: Selalu definisikan kolom secara eksplisit saat melakukan tindakan `.insert()` atau `.update()`. Dilarang meneruskan masukan mentah secara langsung.
