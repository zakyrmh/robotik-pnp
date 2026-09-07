# Playwright End-to-End (E2E) Testing Guide & Critical Flows

Panduan teknis konfigurasi dan penulisan skenario pengujian _End-to-End_ (E2E) menggunakan **Playwright** pada aplikasi **Sistem Informasi Manajemen UKM Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 1. Arsitektur & Keunggulan Playwright

Playwright dipilih sebagai kerangka kerja E2E testing utama karena menyediakan:

- **Cross-Browser & Multi-Device**: Pengujian otomatis pada Chromium, Firefox, WebKit, dan profil perangkat seluler (iPhone / Android).
- **Auto-Waiting**: Playwright secara otomatis menunggu elemen siap (_visible_, _enabled_, _stable_) sebelum berinteraksi, menekan angka _flakiness_.
- **Web-First Assertions**: Eksekusi penegasan (_assertions_) berbasis kondisi async (`expect(locator).toBeVisible()`).
- **Parallel Execution & Isolated Contexts**: Setiap skenario berjalan pada _browser context_ terisolasi secara paralel untuk kecepatan maksimal.

---

## 2. Instalasi & Konfigurasi (`playwright.config.ts`)

### Instalasi Package

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

### File Konfigurasi (`playwright.config.ts`)

Buat file `playwright.config.ts` di akar (_root_) proyek:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## 3. Script `package.json`

Tambahkan script berikut pada file `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 4. Skenario Test Kritis (Critical E2E Flows)

Seluruh skenario diletakkan di dalam direktori `e2e/`.

### 4.1. Skenario 1: Otentikasi & Login (`e2e/auth-login.spec.ts`)

Menguji alur login anggota/pengurus, termasuk validasi error dan keberhasilan autentikasi.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Flow 1: Authentication & Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("harus menampilkan pesan error saat kredensial salah", async ({
    page,
  }) => {
    await page.fill('input[name="email"]', "salah@pnp.ac.id");
    await page.fill('input[name="password"]', "PasswordSalah123");
    await page.click('button[type="submit"]');

    // Menerima notifikasi atau teks error
    const errorMessage = page.locator("text=Email atau password tidak valid");
    await expect(errorMessage).toBeVisible();
  });

  test("harus berhasil login dan melakukan redirect ke Dashboard", async ({
    page,
  }) => {
    // Gunakan kredensial akun dummy/testing
    await page.fill('input[name="email"]', "anggota.test@pnp.ac.id");
    await page.fill('input[name="password"]', "PasswordValid123!");
    await page.click('button[type="submit"]');

    // Verifikasi navigasi URL menuju dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText(/selamat datang|dashboard/i);
  });
});
```

---

### 4.2. Skenario 2: Pendaftaran Anggota Baru (`e2e/registration.spec.ts`)

Menguji form pendaftaran calon anggota UKM Robotik PNP.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Flow 2: Member Registration", () => {
  test("harus dapat mengisi dan mengirimkan form pendaftaran calon anggota", async ({
    page,
  }) => {
    await page.goto("/register");

    // Pengisian Data Form
    await page.fill('input[name="fullName"]', "Calon Anggota Test");
    await page.fill('input[name="nim"]', "2301092001");
    await page.selectOption('select[name="department"]', "Teknologi Informasi");
    await page.fill('input[name="email"]', `calon.${Date.now()}@pnp.ac.id`);
    await page.fill('input[name="phoneNumber"]', "081234567890");

    // Kirim Form Submission
    await page.click('button[type="submit"]');

    // Verifikasi Feedback Sukses
    const successAlert = page.locator("text=Pendaftaran Berhasil");
    await expect(successAlert).toBeVisible();
  });
});
```

---

### 4.3. Skenario 3: Presensi Kegiatan / Rapat (`e2e/attendance.spec.ts`)

Menguji pencatatan presensi kehadiran anggota pada kegiatan UKM.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Flow 3: Attendance Presensi", () => {
  test.beforeEach(async ({ page }) => {
    // Simulasi session terautentikasi / Login dulu
    await page.goto("/login");
    await page.fill('input[name="email"]', "anggota.test@pnp.ac.id");
    await page.fill('input[name="password"]', "PasswordValid123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("harus dapat melakukan presensi kehadiran rapat rutin", async ({
    page,
  }) => {
    await page.goto("/attendance");

    // Memilih sesi kegiatan aktif
    await page.click("text=Rapat Rutin Mingguan");

    // Klik tombol submit presensi
    const submitBtn = page.locator('button:has-text("Hadir Sekarang")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verifikasi status presensi terupdate
    const statusBadge = page.locator("text=Status: Hadir");
    await expect(statusBadge).toBeVisible();
  });
});
```

---

### 4.4. Skenario 4: Peminjaman Inventaris Peralatan (`e2e/inventory-borrow.spec.ts`)

Menguji pengajuan peminjaman modul/alat robotik oleh anggota.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Flow 4: Inventory Borrowing Request", () => {
  test("harus dapat mengajukan peminjaman komponen alat", async ({ page }) => {
    // Direct navigate to inventory after auth
    await page.goto("/inventory");

    // Cari alat
    await page.fill('input[placeholder*="Cari alat"]', "Solder Station");
    await page.click("text=Solder Station Mechanic");

    // Klik tombol Pinjam
    await page.click('button:has-text("Pinjam Alat")');

    // Isi Form Peminjaman
    await page.fill(
      'textarea[name="purpose"]',
      "Pengujian modul PCB robot KRSBI",
    );
    await page.fill('input[name="returnDate"]', "2026-08-15");
    await page.click('button:has-text("Konfirmasi Peminjaman")');

    // Verifikasi Modal / Toast Sukses
    await expect(
      page.locator("text=Pengajuan peminjaman berhasil dikirim"),
    ).toBeVisible();
  });
});
```

---

## 5. Best Practices & Isolation Strategy

1. **Gunakan Network Mocking bila Perlu**: Untuk pengujian terisolasi tanpa merusak database produksi/dev, manfaatkan `page.route()` untuk melakukan mock pada API response.
2. **Pencarian Elemen Berbasis Aksesibilitas**: Gunakan locator `getByRole`, `getByLabel`, `getByPlaceholder`, atau `getByText` agar tes tahan terhadap perubahan styling/class Tailwind.
3. **Pembersihan Data Testing (Cleanup)**: Pastikan data dummy yang dibuat selama skenario testing (seperti pendaftaran) dibersihkan atau ditandai sebagai data pengujian.
4. **Jalankan pada CI/CD Pipeline**: Integrasikan script `npx playwright test` pada GitHub Actions / GitLab CI sebelum proses deployment.
