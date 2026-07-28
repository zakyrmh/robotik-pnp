# Dokumen Spesifikasi Teknis & Arsitektur

## Fitur: Manajemen User & Role (Super Admin)

**Proyek:** Website UKM Robotik Politeknik Negeri Padang

**Status:** Design & Architectural Specification

---

## 1. Ringkasan & Ruang Lingkup (Scope)

Halaman ini berfungsi sebagai pusat kendali autentikasi dan identitas pengguna bagi `super-admin`. Fokus utama halaman ini dibatasi pada **Core User Identity & System Access**, tanpa mencampurkan logika bisnis spesifik modul lain (seperti penilaian tugas, detail SP, atau absensi).

### Data yang Dikelola (Core Identity)

- **Akses Sistem:** `role` (`user_role` ENUM), `is_onboarded` (Reset/Verify Status).
- **Identitas Profil:** `nim`, Nama Lengkap (`full_name`), Email, Nomor WhatsApp (`phone_number`).
- **Afiliasi:** Program Studi (`study_program_id`), Status Pendaftaran/Keanggotaan (`status`), Divisi Utama.
- **Status Akun:** Active vs Soft-deleted (`deleted_at`, `delete_reason`).

---

## 2. Kode Etik & Keamanan Siber (Cybersecurity Guidelines)

Sebagai pemegang hak akses tertinggi (`super-admin`) yang mengelola data sensitif individu (Personally Identifiable Information / PII), implementasi sistem wajib mematuhi standar keamanan dan regulasi **UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)** serta prinsip _Information Security_.

### A. Kode Etik Pengelolaan Data PII

1. **Prinsip Kerahasiaan (Confidentiality):** Super Admin dilarang menyebarkan, mempublikasikan, atau menggunakan nomor telepon (WhatsApp), NIM, atau alamat email pengguna untuk kepentingan pribadi di luar operasional UKM Robotik PNP.
2. **Prinsip Akuntabilitas (Accountability):** Setiap perubahan `role` atau penetapan status akun harus memiliki kualifikasi/alasan organisasi yang jelas.
3. **Pemberian Akses Berdasar _Need-to-Know_:** Promosi hak akses menjadi admin (misal: `admin-komdis`, `admin-divisi`) hanya diberikan kepada pengurus aktif yang sah.

### B. Standar Keamanan Siber (Technical Cybersecurity Standards)

1. **Principle of Least Privilege (PoLP):**

- Server Action wajib melakukan verifikasi ulang pada server-side bahwa pemanggil (_caller_) benar-benar ber-role `super-admin` sebelum mengeksekusi mutasi data, terlepas dari proteksi middleware UI.

2. **Audit Logging & Non-Repudiation:**

- Setiap mutasi sensitif (Ubah Role, Soft Delete, Reset Onboarding) wajib mencatat log ke tabel audit log (`actor_id`, `action_type`, `target_user_id`, `old_value`, `new_value`, `timestamp`, `ip_address`).

3. **Proteksi IDOR & Parameter Tampering:**

- Tidak mengandalkan ID yang dikirim dari _client payload_ tanpa validasi kepemilikan dan integritas di server.

4. **Proteksi Akses Database via RLS (Row Level Security):**

- Kebijakan Supabase RLS untuk mutasi `profiles` dan `registrations` secara _bulk/admin level_ dibatasi hanya untuk _authenticated user_ yang memiliki `role = 'super-admin'`.

5. **Mitigasi CSRF & Re-Authentication:**

- Aksi kritis (seperti menaikkan role pengguna lain menjadi `super-admin` atau melakukan soft-delete) memerlukan konfirmasi berupa modal dialog sekunder.

---

## 3. Tech Stack & Environment Rules

- **Framework:** Next.js 16 (App Router)
- **Directory Structure:** Root-based App Router (**Tanpa direktori `src/**`)
- **Language:** TypeScript (`strict: true`)
- **Database & Auth:** Supabase (Client JS / `@supabase/ssr`, **Tanpa ORM**)
- **Validation:** Zod Schema Validation
- **Styling & UI Components:** TailwindCSS + Shadcn UI
- **Deployment:** Vercel

---

## 4. Aturan Pemisahan Client-Side & Server-Side (100% Strict Boundary)

Untuk menjaga performa, keamanan, dan _maintainability_ kode, pemisahan responsibilitas antara Client dan Server diterapkan dengan aturan berikut:

### Rulebook Server Components (RSC) & Server Actions

- **Tanggung Jawab:**

1. Melakukan autentikasi & otorisasi peran `super-admin` via Supabase Server Client.
2. Direct data fetching dari database Supabase (menghindari _waterfall fetch_ di client).
3. Mengolah _query parameters_ URL (`page`, `per_page`, `search`, `role`, `prodi`, `divisi`) untuk pagination dan filtering.
4. Menjalankan Server Actions untuk mutasi data dengan skema validasi Zod.

- **Prohibitions:** Dilarang mengimpor React Hooks (`useState`, `useEffect`), UI event handlers (`onClick`, `onChange`), atau _library client-only_.

### Rulebook Client Components

- **Tanggung Jawab:**

1. Menangani interaktivitas UI (Pencarian _debounced_, filter dropdown, pembukaan modal edit, pagination click).
2. Mengelola state form lokal (_Shadcn Form_, _React Hook Form_ + _Zod Resolver_).
3. Memicu perubahan URL query params untuk memicu _re-render_ data di Server.
4. Menampilkan _toast notification_, konfirmasi dialog, dan state _loading/pending_ via `useTransition`.

- **Prohibitions:** Dilarang menyebarkan _Service Role Key_ Supabase, dilarang menjalankan query mutasi database langsung tanpa melewati Server Action/API route yang aman.

---

## 5. Struktur Berkas & Komponen Modular

Proyek menggunakan pendekatan _atomic/component-driven_ sehingga kode tidak menumpuk dalam satu berkas tunggal:

```text
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── users/
│               └── page.tsx                 # [Server Component] Entry point, params reader, data fetcher
├── components/
│   └── admin/
│       └── users/
│           ├── user-table-shell.tsx         # [Client Component] Wrapper utama state tabel & modal
│           ├── user-table.tsx               # [Client Component] Presentational table Shadcn
│           ├── user-table-toolbar.tsx       # [Client Component] Search bar & Filter dropdowns
│           ├── user-table-pagination.tsx    # [Client Component] Controls pagination
│           ├── user-role-badge.tsx          # [Client Component/Server] Color-coded role badge
│           ├── modals/
│           │   ├── user-edit-modal.tsx      # [Client Component] Dialog form edit identity & role
│           │   ├── user-detail-modal.tsx    # [Client Component] Read-only drawer/modal detail user
│           │   └── user-delete-dialog.tsx   # [Client Component] Confirmation dialog soft-delete
├── lib/
│   ├── actions/
│   │   └── admin-users.ts                   # [Server Actions] Mutasi data (update, soft-delete, role change)
│   ├── validations/
│   │   └── user-management.ts               # Zod Schemas untuk filter & form edit
│   └── types/
│       └── user-management.ts               # TypeScript Interfaces/Types spesifik halaman

```

---

## 6. Aturan Aturan Khusus (Safety Guards & Soft Delete)

### A. Self-Demotion Guard

- Super Admin yang sedang login **dilarang keras** mengubah role akunnya sendiri menjadi role non-super-admin melalui UI ini.
- _Server Action Validation:_

```typescript
if (currentUser.id === targetUserId && newRole !== "super-admin") {
  throw new Error(
    "Anda tidak dapat mencopot role Super Admin dari akun Anda sendiri.",
  );
}
```

### B. Last Super Admin Guard

- Sistem wajib mengecek jumlah `super-admin` yang aktif (`deleted_at IS NULL`).
- Jika jumlah `super-admin` aktif $\le 1$, sistem menolak perubahan role atau soft-delete terhadap Super Admin terakhir tersebut.

### C. Strict Soft-Delete Policy

- **Tidak ada instruksi `DELETE` permanen** di database untuk fitur ini.
- Proses penghapusan akun dilakukan dengan memperbarui record:
- `deleted_at = NOW()`
- `delete_reason = string` (Wajib diisi oleh super admin saat konfirmasi)

- User dengan `deleted_at NOT NULL` ditandai sebagai _Inactive/Archived_ dan otomatis dicabut akses login-nya di sistem.

---

## 7. Skema Mutasi Data (Zod Schema)

```typescript
// lib/validations/user-management.ts
import { z } from "zod";

export const UserRoleEnum = z.enum([
  "super-admin",
  "admin-komdis",
  "admin-or",
  "admin-kestari",
  "admin-divisi",
  "anggota",
  "caang",
  "alumni",
]);

export const UpdateUserIdentitySchema = z.object({
  userId: z.string().uuid(),
  role: UserRoleEnum,
  nim: z
    .string()
    .min(5, "NIM minimal 5 karakter")
    .max(20)
    .nullable()
    .optional(),
  fullName: z.string().min(3, "Nama lengkap wajib diisi"),
  phoneNumber: z
    .string()
    .min(10, "Nomor HP tidak valid")
    .max(15)
    .nullable()
    .optional(),
  studyProgramId: z.string().uuid().nullable().optional(),
  isOnboarded: z.boolean(),
});

export const SoftDeleteUserSchema = z.object({
  userId: z.string().uuid(),
  deleteReason: z
    .string()
    .min(5, "Alasan penghapusan wajib diisi (minimal 5 karakter)"),
});
```

---

## 8. Alur Interaksi UI/UX

1. **Pengaksesan Halaman (`/admin/users`)**:

- Server Component membaca `searchParams` (`?search=zaky&role=anggota&page=1`).
- Supabase query dijalankan secara paralel (get users with pagination + get filter option lists).

2. **Filtering & Searching**:

- User mengetik kata kunci atau memilih dropdown Role/Prodi/Divisi di `UserTableToolbar`.
- State di-debounce (300ms) lalu memperbarui URL via `router.push()` tanpa _full page reload_.

3. **Pengeditan Data User**:

- Menekan tombol "Edit" pada baris tabel membuka `UserEditModal`.
- Form terisi otomatis (_pre-filled_) dengan data terkini baris tersebut.
- Saat dikirim (_submit_), `useTransition` aktif menandai proses pemanggilan Server Action `updateUserIdentityAction`.
- Pada saat sukses, `toast.success()` muncul, modal tertutup, dan `revalidatePath('/admin/users')` menyegarkan data tabel secara otomatis.

4. **Soft Delete**:

- Menekan tombol "Hapus / Nonaktifkan" membuka `UserDeleteDialog`.
- Super Admin diwajibkan mengisi textarea "Alasan Penghapusan".
- Setelah dikonfirmasi, Server Action menjalankan eksekusi soft-delete.
