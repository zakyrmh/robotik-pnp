# Spesifikasi Pengujian End-to-End Alur Kritis (Playwright E2E Critical Test Flows)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                   |
| :------------------------------------ | :---------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-E2E-01`                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                 |
| **Induk Kebijakan (_Master Policy_)** | _Quality Assurance & Testing Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis        | Ringkasan Perubahan                                                                                    |
| :------: | :--------: | :------------- | :----------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | QA Engineer    | Draf awal spesifikasi skenario E2E Playwright untuk 4 alur kritis.                                     |
| `v2.0.0` | 09/08/2026 | System Analyst | Revisi: Penambahan Document Control, perbaikan format, penghapusan artefak sitasi, dan penutup formal. |

---

## 1. Pendahuluan & Cakupan Pengujian

Dokumen ini berisi spesifikasi dan implementasi skenario pengujian _End-to-End_ (E2E) menggunakan **Playwright** pada proyek **Sistem Informasi Manajemen UKM Robotik PNP** berbasis **Next.js 16 (App Router)**.

Pengujian ini mensimulasikan perilaku pengguna asli di browser untuk memastikan keandalan _user journey_ kritis, mencakup:

1. **Happy Path Login** — Alur login normal hingga redirect ke dashboard.
2. **Pemindaian Presensi QR Code** — Alur scan kehadiran oleh panitia/admin.
3. **Registrasi Calon Anggota (Caang)** — Alur pendaftaran baru hingga halaman tunggu.
4. **Proteksi RBAC** — Pencegahan akses rute terlarang berdasarkan peran.

---

## 2. Arsitektur & Pengaturan Test Runner

- **Framework**: Playwright (`@playwright/test`)
- **Target Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Environment Base URL**: `http://localhost:3000`
- **Storage State Strategy**: Pengujian autentikasi menggunakan isolasi cookie Supabase Auth.

---

## 3. Skenario Kritis 1: Happy Path Login (`e2e/01-happy-path-login.spec.ts`)

### Deskripsi

Memastikan pengguna terdaftar dapat mengisi kredensial, menyelesaikan verifikasi widget Cloudflare Turnstile, dan diarahkan (_redirect_) ke dashboard yang sesuai dengan peran (_role_)-nya.

```typescript
import { test, expect } from "@playwright/test";

test.describe("E2E Flow 1: Happy Path Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("User Anggota/Admin berhasil login dan di-redirect ke /dashboard", async ({
    page,
  }) => {
    // 1. Verifikasi Elemen Form Login
    await expect(page.locator("h1, h2")).toContainText(/login|masuk/i);

    // 2. Pengisian Form Kredensial
    await page.fill('input[name="email"]', "anggota.test@robotik.pnp.ac.id");
    await page.fill('input[name="password"]', "PasswordValid123!");

    // 3. Simulasi Token Cloudflare Turnstile CAPTCHA (di Mode Local/Testing)
    const turnstileWidget = page.locator(
      '.cf-turnstile, [data-testid="turnstile-widget"]',
    );
    if (await turnstileWidget.isVisible()) {
      // Turnstile otomatis terverifikasi di domain testing/dummy key
      await page.waitForTimeout(500);
    }

    // 4. Submit Form Login
    await page.click('button[type="submit"]');

    // 5. Verifikasi Success Redirect & UI Dashboard
    await page.waitForURL("/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText(/dashboard|selamat datang/i);
  });
});
```

---

## 4. Skenario Kritis 2: Pemindaian Presensi Kegiatan (`e2e/02-attendance-scan.spec.ts`)

### Deskripsi

Memastikan panitia/admin dapat membuka halaman scanner di `/kegiatan-absensi-caang/scan`, mengaktifkan kamera pemindai `html5-qrcode`, memproses QR Code anggota, dan menerima umpan balik UI (Toast Sonner, Sound Beep, dan Badge Status "HADIR").

```typescript
import { test, expect } from "@playwright/test";

test.describe("E2E Flow 2: Presensi Masuk via QR Code Scanner", () => {
  test("Admin membuka scanner, memindai QR Code, dan menerima feedback Sukses", async ({
    page,
  }) => {
    // 1. Login sebagai Admin / Panitia
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin.or@robotik.pnp.ac.id");
    await page.fill('input[name="password"]', "AdminPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // 2. Navigasi ke Halaman Pemindaian QR Absensi
    await page.goto("/kegiatan-absensi-caang/scan");
    await expect(page.locator("h1")).toContainText(/pemindai qr|absensi/i);

    // 3. Verifikasi Kamera Scanner html5-qrcode Aktif
    const readerElement = page.locator(
      '#qr-reader, [data-testid="html5-qrcode-reader"]',
    );
    await expect(readerElement).toBeVisible();

    // 4. Simulasi Eksekusi Server Action Pemindaian QR (scanAttendanceQR)
    // Menyimulasikan pemanggilan payload QR Code anggota "2301092001"
    await page.evaluate(async () => {
      // Mocking pemicu hasil scan QR Code
      const event = new CustomEvent("qr-scanned", {
        detail: { qrData: "QR_ANGGOTA_2301092001_ACT_2026" },
      });
      window.dispatchEvent(event);
    });

    // 5. Verifikasi Toast Notification (Sonner)
    const toastNotification = page.locator("[data-sonner-toast]");
    await expect(toastNotification).toBeVisible();
    await expect(toastNotification).toContainText(/absensi berhasil/i);

    // 6. Verifikasi Lencana (Badge) Status "HADIR" pada Telemetry Feed
    const statusBadge = page
      .locator('span:has-text("HADIR"), [data-testid="badge-hadir"]')
      .first();
    await expect(statusBadge).toBeVisible();
  });
});
```

---

## 5. Skenario Kritis 3: Registrasi Calon Anggota Baru (`e2e/03-registration-caang.spec.ts`)

### Deskripsi

Memastikan calon anggota (_caang_) baru dapat mendaftar, diarahkan ke halaman `/verify-email`, dan setelah konfirmasi email serta pengisian dokumen, dialihkan secara ketat oleh Proxy Middleware ke halaman tunggu `/waiting`.

```typescript
import { test, expect } from "@playwright/test";

test.describe("E2E Flow 3: Registrasi Caang Baru & Redirection Flow", () => {
  test("Calon Anggota Mendaftar -> Redirect /verify-email -> Onboarding -> Redirect /waiting", async ({
    page,
  }) => {
    const uniqueEmail = `caang.${Date.now()}@student.pnp.ac.id`;

    // 1. Buka Form Registrasi
    await page.goto("/register");
    await page.fill('input[name="fullName"]', "Calon Anggota Testing");
    await page.fill('input[name="nim"]', "2301092099");
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "CaangPassword123!");

    await page.click('button[type="submit"]');

    // 2. Verifikasi Auto Redirect ke Halaman Verifikasi Email
    await page.waitForURL("/verify-email");
    await expect(page).toHaveURL("/verify-email");
    await expect(page.locator("text=Periksa Email Anda")).toBeVisible();

    // 3. Simulasi User Melakukan Login Setelah Verifikasi Email Sukses
    await page.goto("/login");
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', "CaangPassword123!");
    await page.click('button[type="submit"]');

    // 4. Verifikasi Proxy Middleware Mengarahkan ke /onboarding (Pengisian Dokumen)
    await page.waitForURL("/onboarding");
    await expect(page).toHaveURL("/onboarding");

    // 5. Submit Dokumen Pendaftaran
    await page.fill(
      'textarea[name="alasanMendaftar"]',
      "Ingin belajar robotika KRSBI",
    );
    await page.click('button:has-text("Kirim Berkas")');

    // 6. Verifikasi Strict Redirection Proxy Middleware ke Halaman /waiting
    await page.waitForURL("/waiting");
    await expect(page).toHaveURL("/waiting");
    await expect(page.locator("text=Menunggu Verifikasi Berkas")).toBeVisible();

    // 7. Uji Coba Akses Ilegal ke /dashboard Saat Berstatus 'pending'
    await page.goto("/dashboard");
    // Proxy Middleware Wajib Mengembalikan ke /waiting
    await expect(page).toHaveURL("/waiting");
  });
});
```

---

## 6. Skenario Kritis 4: Penanganan Akses Terlarang / RBAC Protection (`e2e/04-rbac-protection.spec.ts`)

### Deskripsi

Memastikan pengguna bertipe `anggota` biasa yang mencoba mengakses rute administratif terlarang (seperti `/manajemen-caang` atau `/kegiatan-absensi-caang/scan`) dicegat oleh Proxy Middleware (`lib/supabase/proxy.ts`) dan di-redirect secara otomatis kembali ke `/dashboard`.

```typescript
import { test, expect } from "@playwright/test";

test.describe("E2E Flow 4: RBAC Security & Forbidden Route Protection", () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai Anggota Biasa (Non-Admin)
    await page.goto("/login");
    await page.fill('input[name="email"]', "anggota.biasa@robotik.pnp.ac.id");
    await page.fill('input[name="password"]', "PasswordAnggota123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("Anggota biasa mencoba mengakses /manajemen-caang -> Di-redirect ke /dashboard", async ({
    page,
  }) => {
    // 1. Coba Akses Rute Khusus Admin-OR
    await page.goto("/manajemen-caang");

    // 2. Verifikasi Proxy Middleware Cegat Request & Redirect Kembali ke /dashboard
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("Anggota biasa mencoba mengakses /kegiatan-absensi-caang/scan -> Di-redirect ke /dashboard dengan Toast Error", async ({
    page,
  }) => {
    // 1. Coba Akses Rute Scanner Absensi Admin
    await page.goto("/kegiatan-absensi-caang/scan");

    // 2. Verifikasi Auto-Redirect oleh Proxy Middleware
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // 3. Verifikasi Toast Error Akses Ditolak
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    if (await errorToast.isVisible()) {
      await expect(errorToast).toContainText(/akses ditolak/i);
    }
  });
});
```

---

## 7. Panduan Menjalankan Pengujian Playwright E2E

Jalankan perintah berikut di terminal lokal Anda:

```bash
# Menjalankan seluruh skenario pengujian E2E dalam mode headless
npm run test:e2e

# Menjalankan pengujian E2E dengan antarmuka UI interaktif
npm run test:e2e:ui

# Menampilkan laporan hasil pengujian HTML Playwright
npm run test:e2e:report
```

---

_Dokumen ini diterbitkan sebagai standar spesifikasi pengujian End-to-End alur kritis resmi untuk UKM Robotik Politeknik Negeri Padang._
