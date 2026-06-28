# Panduan Debugging & Investigasi Halaman Keanggotaan

Dokumen ini menjelaskan hasil investigasi mengenai mengapa data anggota pada halaman `/keanggotaan` tidak muncul meskipun datanya ada di database Supabase, serta menyediakan query SQL yang dapat Anda jalankan langsung di **Supabase SQL Editor** untuk verifikasi dan pemeliharaan data.

---

## 1. Penyebab Utama (Root Cause)

Di database, semua pengurus periode aktif (`2025/2026`) memiliki kolom `division_id` yang terisi (misalnya terhubung ke divisi `KRSBI-H`, `KRSRI`, `KRAI`, dll.), meskipun posisi/department mereka berkategori **`presidium`** (seperti Ketua Umum, Wakil Ketua, Sekretaris, Bendahara).

Di kode Next.js sebelumnya (`app/(marketing)/keanggotaan/page.tsx`), terdapat logika pengelompokan sebagai berikut:

```typescript
if (div) {
  // Jika anggota memiliki divisi, masukkan ke dalam divisionMap
  sec.divisionMap.set(div.id, ...);
} else {
  // Jika tidak memiliki divisi, masukkan ke members utama departemen
  sec.members.push(member);
}
```

Namun, pada komponen UI (`KeanggotaanClient.tsx`), bagian **`PresidiumSection`** (Pengurus Harian Inti) dan **`AdHocSection`** hanya merender array `members` utama dan **mengabaikan `divisionMap`** (karena secara struktur organisasi, Presidium/AdHoc tidak memiliki subdivisi).

Akibatnya:

- Seluruh pengurus harian (Presidium) masuk ke `divisionMap` karena mereka memiliki `division_id`.
- Array `members` utama departemen menjadi kosong (`[]`).
- Halaman `/keanggotaan` akhirnya mendeteksi tidak ada anggota langsung, sehingga halaman tampil **kosong**.

---

## 2. Langkah Solusi yang Telah Diterapkan

### A. Pengurus Inti Hilang karena Pengelompokan Divisi

Kami telah memperbaiki logika pengelompokan di [page.tsx](file:///D:/Project/robotik-pnp/app/%28marketing%29/keanggotaan/page.tsx) agar anggota **hanya dikelompokkan ke dalam divisi jika kategori departemennya adalah `'departemen'`**:

```diff
-    if (div) {
+    if (div && dept.category.toLowerCase() === "departemen") {
       if (!sec.divisionMap.has(div.id)) {
         sec.divisionMap.set(div.id, { divName: div.name, members: [] });
       }
       sec.divisionMap.get(div.id)!.members.push(member);
     } else {
       sec.members.push(member);
     }
```

### B. Jabatan Anggota Hilang/Salah (Hanya Tertulis "Anggota")

Pada database, semua kolom `role_name` pada tabel `organizational_histories` diisi dengan `"Anggota"`, sedangkan nama jabatan yang sebenarnya disimpan pada kolom `name` di tabel `departments` (contoh: `"Ketua Umum"`, `"Sekretaris 1"`).

Kami telah mengubah pemetaan anggota pada [page.tsx](file:///D:/Project/robotik-pnp/app/%28marketing%29/keanggotaan/page.tsx) agar kolom `role` dan tingkatan level kepengurusan (`level`) diturunkan langsung dari `departments.name`:

```diff
     const member: OrgMember = {
       id: row.id,
       name: lm.full_name,
       avatarUrl: lm.avatar_url ?? null,
-      role: row.role_name,
-      level: deriveLevel(row.role_name),
+      role: dept.name,
+      level: deriveLevel(dept.name),
       subSection: row.sub_section ?? null,
       sortOrder: row.sort_order ?? 999,
     };
```

Dengan perubahan ini:

- Jabatan yang tertera di kartu pengurus/anggota akan sesuai dengan nama departemen (misalnya: "Ketua Umum", "Sekretaris 1", dsb.).

### C. Kesalahan Level 'Wakil Ketua' Dideteksi Sebagai 'Ketua'

Pada fungsi penentuan tingkatan kepengurusan (`deriveLevel`), pengecekan string `"ketua"` diletakkan sebelum pengecekan `"wakil"`.
Karena string `"Wakil Ketua"` mengandung kata `"Ketua"`, fungsi tersebut langsung mengembalikan level `"Ketua"` dan tidak pernah sampai ke pengecekan `"wakil"`.

Kami telah menukar urutan pengecekan kata kunci pada [page.tsx](file:///D:/Project/robotik-pnp/app/%28marketing%29/keanggotaan/page.tsx) agar kata kunci `"wakil"` dicek terlebih dahulu:

```diff
 function deriveLevel(
   roleName: string,
 ): "Ketua" | "Wakil" | "Koordinator" | "Anggota" {
   const lower = roleName.toLowerCase();
-  if (lower.includes("ketua")) return "Ketua";
   if (lower.includes("wakil")) return "Wakil";
+  if (lower.includes("ketua")) return "Ketua";
   if (lower.includes("koordinator")) return "Koordinator";
   return "Anggota";
 }
```

Dengan perbaikan ini, pengurus dengan nama departemen "Wakil Ketua 1" dan "Wakil Ketua 2" sekarang terdeteksi dengan level kepengurusan `"Wakil"` secara benar.

---

## 3. Query Debugging Langsung dari Supabase SQL Editor

Anda dapat menjalankan query di bawah ini langsung di panel **SQL Editor** pada Dashboard Supabase Anda untuk memeriksa keadaan data.

### A. Periksa Periode Aktif

Gunakan query ini untuk memastikan sistem mendeteksi periode yang aktif dengan benar:

```sql
SELECT id, period_name, is_active, created_at
FROM public.membership_periods
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;
```

### B. Periksa Data Anggota Pengurus Periode Aktif

Query ini mensimulasikan JOIN yang terjadi di aplikasi untuk melihat siapa saja pengurus yang terdaftar di periode aktif beserta departemen dan divisinya:

```sql
SELECT
  oh.id AS history_id,
  lm.full_name,
  oh.role_name,
  d.name AS department_name,
  d.category AS department_category,
  div.name AS division_name,
  oh.division_id
FROM public.organizational_histories oh
JOIN public.membership_periods mp ON oh.period_id = mp.id
JOIN public.legacy_members lm ON oh.nim_member = lm.nim
JOIN public.departments d ON oh.department_id = d.id
LEFT JOIN public.divisions div ON oh.division_id = div.id
WHERE mp.is_active = true
ORDER BY d.sort_order ASC, oh.sort_order ASC;
```

### C. Deteksi Masalah (Mencari Presidium/AdHoc yang Memiliki `division_id`)

Query ini akan menampilkan pengurus berkategori `presidium` atau `adhoc` yang memiliki `division_id`. Jika baris data muncul di sini, mereka adalah penyebab data hilang pada versi kode lama:

```sql
SELECT
  lm.full_name,
  oh.role_name,
  d.name AS department_name,
  d.category AS department_category,
  div.name AS division_name
FROM public.organizational_histories oh
JOIN public.membership_periods mp ON oh.period_id = mp.id
JOIN public.legacy_members lm ON oh.nim_member = lm.nim
JOIN public.departments d ON oh.department_id = d.id
LEFT JOIN public.divisions div ON oh.division_id = div.id
WHERE mp.is_active = true
  AND d.category IN ('presidium', 'adhoc')
  AND oh.division_id IS NOT NULL;
```

### D. Solusi Database (Opsional)

Secara konseptual, anggota Presidium mengurus seluruh organisasi dan tidak berada di bawah divisi tertentu. Jika Anda ingin mengosongkan `division_id` dari seluruh pengurus harian (Presidium) dan Ad-Hoc di database agar datanya lebih bersih dan presisi:

```sql
UPDATE public.organizational_histories oh
SET division_id = NULL
FROM public.departments d
WHERE oh.department_id = d.id
  AND d.category IN ('presidium', 'adhoc');
```

_Catatan: Jalankan query update ini jika Anda ingin menyelaraskan struktur data di database agar presidium benar-benar bernilai NULL pada kolom divisinya._
