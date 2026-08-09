# Panduan Pengujian Integrasi API & Supabase (API & Supabase Integration Testing Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                   |
| :------------------------------------ | :---------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-INT-01`                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                 |
| **Induk Kebijakan (_Master Policy_)** | _Quality Assurance & Testing Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis        | Ringkasan Perubahan                                                                                         |
| :------: | :--------: | :------------- | :---------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | QA Engineer    | Draf awal panduan integration testing (mock test, real RLS, storage upload).                                |
| `v2.0.0` | 09/08/2026 | System Analyst | Revisi: Penambahan Document Control, perbaikan URL di code block, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Strategi Pengujian Integrasi

Dokumen ini berisi panduan teknis dan spesifikasi pengujian integrasi (_integration testing_) antara **Next.js 16 Server Actions / API** dengan **Supabase Database (PostgreSQL)**, **Row Level Security (RLS)**, dan **Supabase Storage** pada proyek **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 2. Arsitektur & Strategi Pengujian Integrasi (Hybrid Approach)

Untuk menyeimbangkan antara kecepatan eksekusi di lingkungan CI/CD lokal dan keakuratan keamanan di level PostgreSQL Engine, proyek ini mengadopsi **Pendekatan Dual/Hybrid Strategy**:

1. **Fast Integration Mock Tests (`@supabase/ssr` Mocking)**:
   - Dijalankan secara instan via Vitest (`npm test`).
   - Memvalidasi interaksi logika Server Actions terhadap Supabase Query Builder (`.from()`, `.insert()`, `.storage.from()`).
   - Mensimulasikan penanganan error saat Supabase mengembalikan _Postgres Error Code `42501` (new row violates row-level security policy)_.
2. **Real RLS Integration Tests (Supabase Local CLI Engine)**:
   - Dijalankan pada port lokal `http://127.0.0.1:54321` sebelum proses _merge/deployment_.
   - Menguji eksekusi kueri SQL nyata terhadap aturan RLS Policy dan Supabase Auth `app_metadata.role` (5 peran: `caang`, `anggota`, `admin-or`, `admin-komdis`, `super-admin`).

---

## 3. Tes 1: Database Connection & Mutasi Server Action (`attendances`)

Pengujian ini memastikan Server Action `submitAttendanceAction` berhasil melakukan mutasi data presensi ke dalam tabel **`attendances`** serta menangani simulasi insersi data secara presisi.

### 3.1. File Test: `e2e/integration/attendance-action.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitAttendanceAction } from "@/lib/actions/attendance";
import { createClient } from "@/lib/supabase/server";

// Mocking SDK @supabase/ssr untuk Server Client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Integration Test: Presensi Server Action ke Tabel attendances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus berhasil menyimpan data presensi anggota ke tabel attendances", async () => {
    // 1. Setup Mock State
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "usr_anggota_99",
            app_metadata: { role: "anggota" },
            email: "anggota@robotik.pnp.ac.id",
          },
        },
        error: null,
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom,
      auth: mockAuth,
    } as any);

    // 2. Eksekusi Server Action
    const payload = {
      activityId: "act_workshop_2026",
      status: "HADIR" as const,
      proofUrl: "https://example.com/proof.jpg",
    };

    const result = await submitAttendanceAction(payload);

    // 3. Verifikasi Interaksi Kueri Supabase
    expect(mockFrom).toHaveBeenCalledWith("attendances");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        activity_id: "act_workshop_2026",
        profile_id: "usr_anggota_99",
        status: "HADIR",
        approval_status: "PENDING",
      }),
    );
    expect(result).toEqual({
      success: true,
      message: "Presensi berhasil dicatat",
    });
  });
});
```

---

## 4. Tes 2: Validasi RLS (Row Level Security) Enforcement (`audit_logs`)

Pengujian ini memastikan bahwa pengguna dengan peran biasa (`caang` atau `anggota`) **gagal total** membaca atau mengubah isi tabel sensitif seperti **`audit_logs`** atau **`or_settings`**.

### 4.1. Fast Mock Test Error RLS (Code 42501)

```typescript
import { describe, it, expect, vi } from "vitest";
import { getSystemAuditLogs } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Integration Test: RLS Violation Handling (audit_logs)", () => {
  it("harus mengembalikan error penolakan RLS (42501) saat user caang mencoba membaca audit_logs", async () => {
    // Simulasi Supabase Client mengembalikan RLS Violation Error
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message:
          'new row violates row-level security policy for table "audit_logs"',
      },
    });

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: "usr_caang_01", app_metadata: { role: "caang" } },
          },
        }),
      },
    } as any);

    const result = await getSystemAuditLogs();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(
      /akses ditolak|permission denied|row-level security/i,
    );
  });
});
```

---

### 4.2. Real RLS Integration Test (Supabase Local CLI Engine)

File ini dieksekusi secara nyata terhadap database PostgreSQL Supabase lokal (`http://127.0.0.1:54321`):

```typescript
// e2e/integration/real-rls.spec.ts
import { describe, it, expect } from "vitest";
import { createBrowserClient } from "@supabase/ssr";

describe("Real PostgreSQL RLS Integration Test via Supabase Local CLI", () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1...";

  it("RLS CHECK: User Caang HARUS GAGAL membaca tabel audit_logs (0 rows returned)", async () => {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // 1. Login sebagai User Caang
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: "caang_test@robotik.pnp.ac.id",
        password: "PasswordValid123!",
      });

    expect(authError).toBeNull();
    expect(authData.user).not.toBeNull();

    // 2. Eksekusi Kueri Langsung ke PostgreSQL
    const { data } = await supabase.from("audit_logs").select("*");

    // 3. Verifikasi RLS Engine Menolak Akses (Data Kosong atau Error 42501)
    expect(data === null || data.length === 0).toBe(true);
  });

  it("RLS CHECK: Super Admin HARUS BERHASIL membaca data tabel audit_logs", async () => {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // 1. Login sebagai Super Admin
    await supabase.auth.signInWithPassword({
      email: "superadmin@robotik.pnp.ac.id",
      password: "AdminPassword123!",
    });

    // 2. Eksekusi Kueri
    const { data, error } = await supabase.from("audit_logs").select("*");

    // 3. Verifikasi Akses Diberikan
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## 5. Tes 3: Integrasi Supabase Storage (Bucket `profiles`)

Pengujian ini memvalidasi alur pengunggahan foto profil pengguna ke dalam Supabase Storage Bucket **`profiles`** berbasis RLS Policy.

### 5.1. File Test: `e2e/integration/storage-upload.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadProfileAvatarAction } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Integration Test: Supabase Storage Upload (Bucket profiles)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus berhasil mengunggah file foto profil ke bucket profiles", async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      data: { path: "usr_anggota_99/avatar.png" },
      error: null,
    });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          "http://127.0.0.1:54321/storage/v1/object/public/profiles/usr_anggota_99/avatar.png",
      },
    });

    const mockStorageFrom = vi.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "usr_anggota_99" } },
          error: null,
        }),
      },
      storage: {
        from: mockStorageFrom,
      },
    } as any);

    // Dummy File Object
    const file = new File(["dummy content"], "avatar.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadProfileAvatarAction(formData);

    // Verifikasi Pemanggilan Storage SDK
    expect(mockStorageFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpload).toHaveBeenCalledWith(
      "usr_anggota_99/avatar.png",
      expect.any(File),
      expect.objectContaining({ upsert: true }),
    );
    expect(result.success).toBe(true);
    expect(result.avatarUrl).toContain("profiles/usr_anggota_99/avatar.png");
  });
});
```

---

## 6. Panduan Menjalankan Real Integration Test (Supabase Local CLI)

Untuk menjalankan tes integrasi RLS PostgreSQL nyata di mesin pengembang lokal:

1. **Jalankan Engine Supabase Lokal (Docker berbasis CLI)**:

```bash
npx supabase start
```

2. **Jalankan Migrasi SQL & Seed Data User Test**:

```bash
npx supabase db reset
```

3. **Eksekusi Test Suite Integrasi**:

```bash
npx vitest run e2e/integration/real-rls.spec.ts
```

---

_Dokumen ini diterbitkan sebagai standar panduan pengujian integrasi API & Supabase resmi untuk UKM Robotik Politeknik Negeri Padang._
