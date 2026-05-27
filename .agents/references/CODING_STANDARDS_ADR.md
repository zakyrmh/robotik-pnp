# Architectural Decision Records (ADR) & Coding Standards

Project: UKM Robotik PNP Management System
Status: APPROVED | Target: Next.js 16.2.5 & React 19.2.4

---

## Part 1: Architectural Decision Records (ADR)

### ADR 01: Penggunaan Server Components secara Default

- **Konteks:** Aplikasi membutuhkan performa tinggi, indeks SEO yang baik untuk pendaftaran, dan latensi rendah saat mengambil data dari Supabase lokal (Docker).
- **Keputusan:** Semua halaman dan komponen di dalam direktori `app/` wajib berupa **React Server Components (RSC)** secara default. Pengambilan data (_data fetching_) dilakukan langsung menggunakan instruksi asinkronus ke Supabase di tingkat server.
- **Konsekuensi:** Direktif `'use client'` hanya boleh diletakkan di baris paling atas jika komponen membutuhkan React Hooks (`useState`, `useRef`, `useContext`) atau pustaka UI interaktif seperti Framer Motion dan ShadcnUI.

### ADR 02: Substitusi REST API dengan Next.js Server Actions

- **Konteks:** Menghindari _boilerplate code_ yang berlebihan akibat pembuatan endpoint REST API (`/api/v1/...`) tradisional untuk operasi mutasi data (CUD).
- **Keputusan:** Seluruh operasi mutasi data (pendaftaran, absensi, submisi tugas, pelaporan piket) wajib diimplementasikan menggunakan **Next.js Server Actions**.
- **Konsekuensi:** Agen AI dilarang membuat rute API (`route.ts`) baru untuk interaksi internal komponen, kecuali untuk kebutuhan eksternal webhook (seperti integrasi bot notifikasi jika ada di masa depan).

### ADR 03: Penegakan Row Level Security (RLS) di Level Database

- **Konteks:** Sistem mengelola data sensitif mahasiswa (KTM, berkas pendaftaran, log kehadiran). Kebocoran data antar-pendaftar wajib dihindari.
- **Keputusan:** Keamanan data mutlak diselesaikan di level database PostgreSQL melalui **Supabase RLS**, bukan di level kode aplikasi.
- **Konsekuensi:** Setiap migrasi tabel baru wajib menyertakan perintah `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`. Pengambilan data di server wajib menggunakan _client context_ yang membawa token JWT pengguna aktif (`auth.uid()`), bukan menggunakan `service_role` rahasia.

### ADR 04: Standardisasi UI Engine dengan Tailwind CSS v4.0 & shadcn/ui v2

- **Konteks:** Menjaga konsistensi visual, aksesibilitas (A11y), dan efisiensi waktu kompilasi CSS-first engine.
- **Keputusan:** Gaya visual wajib dibangun di atas utilitas **Tailwind CSS v4.0** dan komponen primitif **shadcn/ui v2** (Radix UI).
- **Konsekuensi:** Dilarang menginstal pustaka UI pihak ketiga tambahan tanpa izin. Semua modifikasi gaya komponen kustom wajib memanfaatkan utilitas `class-variance-authority` (CVA), `clsx`, dan `tailwind-merge`.

---

## Part 2: Coding Standards & Best Practices

### 2.1 Aturan Penamaan (Naming Conventions)

| Komponen Sistem        | Konvensi Penamingan              | Contoh                                         |
| :--------------------- | :------------------------------- | :--------------------------------------------- |
| **Folder Rute**        | `kebab-case` (lowercase)         | `app/manajemen-caang/`                         |
| **Komponen UI / File** | `PascalCase`                     | `components/shared/Sidebar.tsx`                |
| **Fungsi / Variabel**  | `camelCase`                      | `const generateAttendanceQR = () => {}`        |
| **Server Actions**     | `camelCase` (diawali kata kerja) | `export async function submitPiketReport() {}` |
| **Tabel Database**     | `snake_case` (plural / jamak)    | `piket_schedules`, `task_submissions`          |
| **Kolom Database**     | `snake_case`                     | `proof_image_url`, `is_verified`               |

### 2.2 Pola Penanganan Eror (Error Handling Pattern)

Setiap Server Action wajib dibungkus di dalam blok `try-catch` dan tidak boleh melempar (_throw_) eror mentah ke sisi klien. Respons wajib mengikuti tipe data `ServerActionResponse`:

```typescript
// Contoh implementasi standar oleh Agen AI
export async function verifyCaangRegistration(
  registrationId: string,
): Promise<ServerActionResponse> {
  try {
    // 1. Validasi Otorisasi Admin di Sini

    // 2. Operasi Database
    const { error } = await supabaseServer
      .from("registrations")
      .update({ status: "verified" })
      .eq("id", registrationId);
    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "Calon anggota berhasil diverifikasi dan diaktifkan.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: "Gagal memverifikasi calon anggota.",
      error: { code: "DATABASE_ERROR", details: err.message },
    };
  }
}
```

### 2.3 Standar Git & Format Commit

Kode tidak akan diterima oleh Git Hooks sistem jika tidak mengikuti aturan **Conventional Commits** yang dikontrol oleh `commitlint` dan `husky`. Format commit wajib berupa:
`type(scope): description`

- **`feat`**: Jika agen menambahkan fitur baru (misal: `feat(piket): implement automatic EXIF validation`).
- **`fix`**: Jika agen memperbaiki bug (misal: `fix(absensi): resolve QR code expiration calculation`).
- **`refactor`**: Perubahan kode yang tidak menambah fitur maupun memperbaiki bug.

### 2.4 Aturan Pengujian (Testing Standard)

Setiap kali menulis Server Action baru yang bersifat kritikal (terutama algoritma pembagian kelompok berbasis nilai atau ekstraksi metadata foto piket), agen wajib menulis unit test di folder terkait menggunakan **Vitest** dengan ekstensi `.test.ts`.

---

## Part 3: Referensi Konfigurasi Latar Belakang (DX)

- **Package Manager:** `pnpm 11.x` (pastikan agen menggunakan `pnpm add` bukan `npm install`).
- **Linter:** ESLint (Flat Config) & Prettier. Kode wajib lolos eksekusi otomatis `pnpm lint` pada fase _pre-commit_ Husky.
