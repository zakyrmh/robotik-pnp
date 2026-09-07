# Panduan Spesifikasi Kasus Uji Unit (Unit Test Cases Specification Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                   |
| :------------------------------------ | :---------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-UNT-01`                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                 |
| **Induk Kebijakan (_Master Policy_)** | _Quality Assurance & Testing Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis        | Ringkasan Perubahan                                                                    |
| :------: | :--------: | :------------- | :------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | QA Engineer    | Draf awal spesifikasi unit test cases untuk validasi, logika skor, dan Server Actions. |
| `v2.0.0` | 09/08/2026 | System Analyst | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.         |

---

## 1. Pendahuluan & Cakupan Dokumen

Dokumen ini berisi daftar skenario dan spesifikasi pengujian unit (_unit test cases_) yang komprehensif menggunakan **Vitest** pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Modul Validasi & Utility (`lib/validations/*` & `lib/utils/*`)

### 2.1. Validasi NIM & Email Akademik (`lib/validations/auth.test.ts`)

#### Skenario Uji:

1. **[SUCCESS] NIM Valid**: Menerima string NIM tepat 10 digit angka (misal: `'2301092001'`).
2. **[ERROR] NIM Kurang/Lebih dari 10 Digit**: Menolak NIM dengan panjang $< 10$ atau $> 10$ digit.
3. **[ERROR] NIM Mengandung Karakter Non-Angka**: Menolak NIM yang mengandung huruf atau simbol (misal: `'230109200a'`).
4. **[SUCCESS] Email Akademik Valid**: Menerima email dengan domain `@pnp.ac.id` atau `@student.pnp.ac.id`.
5. **[ERROR] Email Non-Akademik**: Menolak domain email umum (misal: `@gmail.com` atau `@yahoo.com`).

```typescript
import { describe, it, expect } from "vitest";
import { validateNIM, validateStudentEmail } from "@/lib/validations/auth";

describe("Validasi NIM & Email Akademik", () => {
  it("harus menerima NIM yang tepat 10 digit angka", () => {
    expect(validateNIM("2301092001")).toBe(true);
  });

  it("harus menolak NIM jika kurang atau lebih dari 10 digit", () => {
    expect(validateNIM("230109200")).toBe(false); // 9 digit
    expect(validateNIM("23010920011")).toBe(false); // 11 digit
  });

  it("harus menolak NIM yang mengandung karakter non-angka", () => {
    expect(validateNIM("230109200a")).toBe(false);
  });

  it("harus menerima email resmi kampus PNP", () => {
    expect(validateStudentEmail("zaky@student.pnp.ac.id")).toBe(true);
  });

  it("harus menolak email di luar domain kampus PNP", () => {
    expect(validateStudentEmail("user@gmail.com")).toBe(false);
  });
});
```

---

### 2.2. Format Tanggal & Waktu Presensi (`lib/utils/date.test.ts`)

#### Skenario Uji:

1. **[SUCCESS] Format Presensi Standard**: Memformat ISO Date String menjadi format tanggal Indonesia (`'Senin, 10 Agustus 2026'`).
2. **[SUCCESS] Format Jam & Menit**: Memformat jam presensi menjadi WIB (`'14:30 WIB'`).
3. **[ERROR] Invalid Date Input**: Mengembalikan fallback string `'Tanggal tidak valid'` jika input berupa string kosong atau format ilegal.

```typescript
import { describe, it, expect } from "vitest";
import { formatAttendanceDate, formatAttendanceTime } from "@/lib/utils/date";

describe("Helper Format Tanggal Presensi", () => {
  it("harus memformat tanggal ke dalam Bahasa Indonesia", () => {
    const isoString = "2026-08-10T07:30:00.000Z";
    expect(formatAttendanceDate(isoString)).toMatch(/10 Agustus 2026/);
  });

  it("harus memformat waktu ke format WIB", () => {
    const isoString = "2026-08-10T07:30:00.000Z"; // 07:30 UTC = 14:30 WIB
    expect(formatAttendanceTime(isoString)).toContain("14:30");
  });

  it("harus mengembalikan fallback string jika input invalid", () => {
    expect(formatAttendanceDate("invalid-date")).toBe("Tanggal tidak valid");
  });
});
```

---

## 3. Modul Logika Perhitungan Poin & Kehadiran (`lib/utils/score.test.ts`)

### 3.1. Perhitungan Poin Kehadiran & Keaktifan Anggota

#### Skenario Uji:

1. **[SUCCESS] Tepat Waktu**: Memberikan $100\%$ poin presensi ($+10$ poin) jika anggota hadir sebelum/tepat pada jam sesi.
2. **[SUCCESS] Terlambat Toleransi ($\le 15$ Menit)**: Memberikan $75\%$ poin presensi ($+7.5$ poin) jika hadir dalam masa toleransi.
3. **[SUCCESS] Terlambat $> 15$ Menit**: Memberikan $50\%$ poin presensi ($+5$ poin).
4. **[SUCCESS] Alpha / Tanpa Keterangan**: Memberikan $0$ poin dan penalti akumulasi minus.
5. **[SUCCESS] Izin / Sakit Terverifikasi**: Memberikan $50\%$ poin tanpa mengurangi akumulasi performa.

```typescript
import { describe, it, expect } from "vitest";
import { calculateAttendancePoint } from "@/lib/utils/score";

describe("Logika Perhitungan Poin Kehadiran Anggota", () => {
  const sessionTime = new Date("2026-08-10T14:00:00+07:00");

  it("harus memberikan poin penuh (+10) jika hadir tepat waktu", () => {
    const checkInTime = new Date("2026-08-10T13:55:00+07:00");
    const result = calculateAttendancePoint(sessionTime, checkInTime, "hadir");
    expect(result.points).toBe(10);
    expect(result.status).toBe("ON_TIME");
  });

  it("harus memberikan poin 7.5 jika terlambat <= 15 menit", () => {
    const checkInTime = new Date("2026-08-10T14:10:00+07:00");
    const result = calculateAttendancePoint(sessionTime, checkInTime, "hadir");
    expect(result.points).toBe(7.5);
    expect(result.status).toBe("LATE_TOLERANCE");
  });

  it("harus memberikan 0 poin untuk status alpha", () => {
    const result = calculateAttendancePoint(sessionTime, null, "alpha");
    expect(result.points).toBe(0);
    expect(result.status).toBe("ABSENT");
  });
});
```

---

## 4. Modul Server Actions & Mutasi Data (`lib/actions/*`)

### 4.1. Mutasi Presensi QR Code (`lib/actions/attendance.test.ts`)

#### Skenario Uji:

1. **[SUCCESS] Presensi Berhasil**: Memvalidasi token QR Code aktif dan mencatat presensi anggota terautentikasi.
2. **[ERROR] Token QR Expired**: Menolak pencatatan presensi jika token QR Code telah kadaluarsa ($> 30$ detik).
3. **[ERROR] Sesi Presensi Belum Dibuka**: Menolak submit jika status sesi kegiatan `'CLOSED'`.
4. **[ERROR] Presensi Ganda**: Menolak request jika anggota sudah tercatat presensi pada sesi yang sama.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitQRAttendance } from "@/lib/actions/attendance";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Server Action - submitQRAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus mengembalikan error jika token QR sudah kadaluarsa", async () => {
    const expiredToken = "qr_expired_12345";

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "usr_123" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_active: false, expires_at: "2026-01-01T00:00:00Z" },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const result = await submitQRAttendance(expiredToken);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/token qr sudah kadaluarsa/i);
  });
});
```

---

### 4.2. Pendaftaran Calon Anggota (Oprec Caang) (`lib/actions/auth.test.ts`)

#### Skenario Uji:

1. **[SUCCESS] Registrasi Caang**: Mendaftar akun baru dan mengaitkan ID Auth ke tabel dokumen calon anggota.
2. **[ERROR] Email / NIM Sudah Terdaftar**: Menghentikan proses registrasi dan mengembalikan pesan error konflik unik.
3. **[ERROR] Zod Schema Validation Failure**: Menolak pengiriman form jika data belum memenuhi kriteria validasi.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCaangAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Server Action - registerCaangAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menolak pendaftaran jika format NIM tidak valid", async () => {
    const formData = new FormData();
    formData.append("fullName", "Calon Anggota");
    formData.append("nim", "12345"); // Invalid NIM
    formData.append("email", "calon@student.pnp.ac.id");

    const result = await registerCaangAction(formData);
    expect(result.success).toBe(false);
    expect(result.errors?.nim).toBeDefined();
  });
});
```

---

## 5. Matriks Ringkasan Skenario Uji Unit

| Kode Test Case | Modul Target      | Nama Skenario Uji                    | Tipe Test      | Target Expectation            |
| :------------- | :---------------- | :----------------------------------- | :------------- | :---------------------------- |
| `TC-VAL-01`    | Validasi Auth     | Format NIM 10 digit                  | Unit Positive  | Returns `true`                |
| `TC-VAL-02`    | Validasi Auth     | Non-digit / Invalid NIM              | Unit Negative  | Returns `false`               |
| `TC-VAL-03`    | Validasi Auth     | Email Domain Kampus PNP              | Unit Positive  | Returns `true`                |
| `TC-DATE-01`   | Date Helper       | Conversion ISO to WIB                | Unit Positive  | Match `'HH:mm WIB'`           |
| `TC-DATE-02`   | Date Helper       | Invalid Date Input Handling          | Unit Edge Case | Returns fallback string       |
| `TC-SCORE-01`  | Score Engine      | Attendance On-Time (+10 pts)         | Logic Test     | Points $= 10$                 |
| `TC-SCORE-02`  | Score Engine      | Attendance Late Tolerance (+7.5 pts) | Logic Test     | Points $= 7.5$                |
| `TC-ACT-01`    | Attendance Action | QR Token Expiry Check                | Action Test    | Success `= false` + Error msg |
| `TC-ACT-02`    | Attendance Action | Duplicate Attendance Prevention      | Action Test    | Success `= false` + Error msg |
| `TC-AUTH-01`   | Auth Action       | Caang Registration Schema Validation | Action Test    | Zod Validation Error          |

---

_Dokumen ini diterbitkan sebagai standar spesifikasi kasus uji unit resmi untuk UKM Robotik Politeknik Negeri Padang._
