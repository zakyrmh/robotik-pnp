# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.7] - 2026-03-19

### Added

- **Fitur Absensi & Kegiatan Caang**: Implementasi modul `/dashboard/caang/absensi` dan `/dashboard/caang/kegiatan` yang memungkinkan calon anggota memantau jadwal agenda OR dan riwayat kehadiran serta perolehan poin secara personal.
- **Sistem Token QR Absensi Dinamis**: Menambahkan migrasi database `or_attendance_tokens` dan logic server action `caangGenerateAttendanceToken` untuk menghasilkan token QR yang valid selama 5 menit bagi tiap peserta guna keamanan absensi.
- **Scanner QR Terpadu (Admin)**: Implementasi antarmuka scanner QR (`/dashboard/or/kegiatan/absensi`) yang terintegrasi dengan server action `scanAttendanceToken` untuk verifikasi kehadiran peserta secara instan.
- **Finalisasi Rekapitulasi Poin**: Melengkapi dashboard rekapitulasi poin admin (`/dashboard/or/rekapitulasi`) dengan integrasi data kehadiran dan perhitungan poin otomatis.

### Changed

- **Standarisasi UI Dashboard OR**: Melakukan penyelarasan bahasa desain premium (bento-stat, typography italic/black, dan color palette) pada seluruh halaman manajemen Open Recruitment agar konsisten dengan standar modul lainnya.

## [0.8.6] - 2026-03-16

### Added

- **Fitur Rekapitulasi Poin (Phase 4)**: Implementasi halaman rekapitulasi poin (`/dashboard/or/rekapitulasi`) untuk admin guna memantau akumulasi poin kehadiran seluruh Caang secara otomatis.
- **Server Action Rekapitulasi**: Menambahkan fungsi `adminGetAttendanceSummary` pada `or-events.action.ts` untuk agregasi data kehadiran, poin, dan statistik partisipasi peserta.
- **Komponen RekapitulasiManager**: Memisahkan logika client-side rekapitulasi ke dalam komponen tersendiri untuk performa dan pemeliharaan yang lebih baik.
- **Sistem Scanner QR Real-time (Phase 3)**: Implementasi antarmuka scanner QR untuk admin pada halaman absensi yang terintegrasi dengan handheld barcode scanner.

### Changed

- **Refaktorisasi Halaman Absensi & Rekapitulasi**: Mengonversi halaman `absensi/page.tsx` dan `rekapitulasi/page.tsx` menjadi Server Components dengan pola `Suspense` dan `Skeleton` loading.
- **Ekstraksi Client Logic**: Memindahkan logika interaktif sistem absensi ke `AbsensiManager` dan sistem rekapitulasi ke `RekapitulasiManager` di direktori `components/or/`.
- **Standarisasi UI OR Admin**: Menyelaraskan gaya visual (UI/UX) halaman Absensi dan Rekapitulasi dengan halaman Database dan Blacklist agar memiliki bahasa desain premium yang seragam (ikon kontainer, typography black/italic, dan layout bento-stat).
- **Update Sidebar**: Menambahkan menu "Rekapitulasi Poin" ke dalam grup navigasi "Kegiatan & Absensi" pada sidebar Admin.

### Fixed

- **Type Safety & Linting**: Memperbaiki berbagai error linting (unused variables, cascading renders) dan meningkatkan keamanan tipe data pada server actions `or-events.action.ts`.
- **Efek Samping useEffect**: Mengoptimalkan hooks `useEffect` pada komponen client untuk mencegah render berulang (cascading renders) yang tidak perlu.

## [0.8.5] - 2026-03-16

### Added

- **Pengaturan OR Dinamis (Full CRUD)**: Implementasi manajemen Kontak Panitia, Link Komunitas (WhatsApp/Discord), dan Timeline Seleksi yang dapat dikelola sepenuhnya oleh admin via dashboard.
- **Manajemen Kegiatan & Absensi Caang**: Menambahkan fitur jadwal kegiatan OR (`/dashboard/caang/kegiatan`) dan rekapitulasi absensi mandiri (`/dashboard/caang/absensi`) untuk calon anggota.
- **Database/Settings**: Membuat tabel migrasi `or_settings` berskema _key-value_ JSONB untuk menyimpan berbagai konfigurasi dinamis sistem OR, lengkap dengan RLS dan _seed_ awal.
- **Server Actions**: Menambahkan pustaka aksi `or-settings.action.ts` (announcement, links, timeline) dan `or-events.action.ts` (CRUD event & attendance).

### Changed

- **Timeline Seleksi**: Memperbarui sistem notifikasi feedback (success/error) menjadi floating notification di pojok kanan atas serta menambahkan fitur auto-focus pada input label saat menambah tahapan baru.
- **Penyimpanan Dokumen Caang (Storage)**: Memigrasikan fungsi upload berkas dokumen dan bukti pembayaran dari _Cloudflare R2 Storage_ ke ekosistem terpadu **Supabase Storage** (bucket `or-documents`).
- **Endpoint Upload Action**: Modifikasi `upload.action.ts` kini memproduksi _Signed URL_ (token aktif 1 tahun) yang lebih mutakhir dibanding skema Public R2 URL sebelumnya.
- **Migrasi Middleware → Proxy (Next.js 16)**: Mengubah nama file entry point dari `middleware.ts` menjadi `proxy.ts` dan nama fungsi dari `middleware` ke `proxy` di root project sesuai konvensi baru Next.js 16. Fungsi helper turut dimigrasi dari `lib/supabase/middleware.ts` ke `lib/supabase/proxy.ts`.
- **Hapus `config.ts`**: Menghapus file `config.ts` di root project yang merupakan percobaan lama pembuatan middleware dengan nama file yang tidak dikenali Next.js.
- **Dashboard Caang**: Pembaruan UI dashboard pendaftar yang kini mendukung tampilan pengumuman broadcast, link komunitas dinamis, dan agenda kegiatan terdekat.
- **Badge UI Component**: Menambahkan varian warna baru (success, warning, blue, amber, emerald, indigo) untuk menunjang status kegiatan dan absensi.

### Fixed

- **Batas Karakter Limit URL**: Meresolusikan isu `value too long for character varying(500)` saat _submit URL_ di pendaftaran caang dengan membuat file migrasi `20260311000003_increase_url_length.sql` guna melekatkan tipe `TEXT` ketimbang `VARCHAR(500)` pada seluruh field dokumen tabel `or_registrations`.
- **Policy Settings Admin Write**: Meresolusi error _RLS INSERT bypass_ pada tabel `or_settings` dengan me-_replace_ entitas `"or_settings_admin_update"` yang awalnya `FOR UPDATE` menjadi kebijakan `FOR ALL` absolut.
- **Auth Guard — Redirect Halaman Auth**: Memperbaiki bug di mana user yang sudah login tetap bisa mengakses halaman `/login`, `/register`, `/forgot-password`, dan `/reset-password`. Penyebabnya adalah tidak adanya file `proxy.ts` di root project sehingga logika redirect di `lib/supabase/proxy.ts` tidak pernah dieksekusi. Sekarang user yang sudah terautentikasi akan otomatis diarahkan ke `/dashboard`.
- **Auth Guard — Cakupan Redirect Diperluas**: Memperluas daftar halaman auth yang diproteksi dari sebelumnya hanya `/login` dan `/register`, menjadi mencakup juga `/forgot-password` dan `/reset-password`.
- **Integrasi Cloudflare R2 Validasi**: Memperbaiki fungsi unggah (`upload.action.ts`) dengan validasi deteksi awal terhadap _environment_ `NEXT_PUBLIC_R2_PUBLIC_URL` guna mencegah cacat penyimpanan URL di _database_ pasca-_upload_ gagal.

---

## [0.8.4] - 2026-03-11

### Added

- **Route Handler `/auth/callback`**: Menambahkan route handler baru di `app/auth/callback/route.ts` yang menangani callback verifikasi email dari Supabase. Route ini menukar `code` dari query parameter dengan session pengguna menggunakan `exchangeCodeForSession`, lalu mengalihkan ke halaman sukses `/auth/verified` jika berhasil, atau ke `/login?error=...` jika gagal.
- **Halaman `/auth/verified`**: Menambahkan halaman konfirmasi verifikasi email (`app/auth/verified/page.tsx`) yang ditampilkan setelah user mengklik link di email. Halaman berisi ikon sukses animasi, instruksi tiga langkah selanjutnya (Masuk → Lengkapi Profil → Ikuti OR), progress bar hitung mundur 5 detik, dan auto-redirect ke `/login` saat countdown habis via `router.push`. Tersedia pula tombol "Lanjutkan Sekarang" untuk redirect manual tanpa menunggu.

### Fixed

- **Auth Callback — Halaman 404 Saat Verifikasi Email**: Memperbaiki bug di mana user yang mengklik link verifikasi email mendapat halaman kosong 404. Penyebabnya adalah `emailRedirectTo` di `register-form.tsx` mengarah ke `/auth/callback`, sedangkan route handler yang ada di `app/(auth)/callback/route.ts` hanya melayani URL `/callback` (bukan `/auth/callback`) karena `(auth)` adalah route _group_ Next.js yang tidak berkontribusi pada URL. Route baru dibuat di path yang tepat (`app/auth/callback/route.ts`) untuk menangani URL `/auth/callback`.

---

## [0.8.3] - 2026-03-11

### Added

- **Server Action Publik**: Menambahkan fungsi `getPublicRegistrationPeriod` di `or-settings.action.ts` tanpa pengecekan autentikasi, sehingga halaman publik `/register` dapat membaca status periode pendaftaran menggunakan RLS anon read yang sudah ada di tabel `or_settings`.
- **Komponen `RegisterForm`**: Mengekstrak form pendaftaran dari `register/page.tsx` menjadi client component tersendiri (`components/auth/register-form.tsx`) agar halaman register dapat dikonversi menjadi server component.
- **Komponen `RegistrationClosed`**: Menambahkan tampilan informatif ketika pendaftaran ditutup (`components/auth/registration-closed.tsx`), berisi pesan penutupan, info kontak pengurus, dan tautan ke halaman login.
- **Komponen `RegistrationCountdown`**: Menambahkan tampilan hitung mundur real-time (`components/auth/registration-countdown.tsx`) yang memperbarui hari/jam/menit/detik setiap detik menggunakan `setInterval`, dan otomatis me-refresh halaman via `router.refresh()` saat countdown habis.
- **Migrasi Fix RLS**: Menambahkan migration `20260311000000_fix_or_settings_rls.sql` untuk memperbaiki policy RLS `or_settings` yang keliru.

### Changed

- **Halaman Register — Konversi ke Server Component**: Mengubah `register/page.tsx` dari client component menjadi async server component. Halaman kini mengambil data periode pendaftaran dari database saat render dan menampilkan salah satu dari tiga tampilan: form pendaftaran, hitung mundur, atau pesan ditutup — sesuai kondisi waktu saat ini terhadap `start_date` dan `end_date`.

### Fixed

- **Database/RLS `or_settings` — Policy Tidak Lengkap**: Memperbaiki bug di mana policy RLS `or_settings_admin_update` hanya mencakup `FOR UPDATE`, sedangkan operasi `.upsert()` di Supabase JS client diterjemahkan menjadi `INSERT ... ON CONFLICT DO UPDATE` yang membutuhkan KEDUA policy INSERT dan UPDATE. Policy lama diganti dengan `or_settings_admin_write` bertipe `FOR ALL` yang mencakup INSERT, UPDATE, dan DELETE sekaligus.
- **Database `or_settings` — Tabel Belum Diaplikasikan**: Memperbaiki error _"Could not find the table 'public.or_settings' in the schema cache"_ yang disebabkan migration belum dijalankan di remote Supabase project. Tabel, seed data, dan RLS policy kini harus diaplikasikan secara manual via SQL Editor Supabase Dashboard.

---

## [0.8.2] - 2026-03-07

### Added

- **Fitur Lupa Password (`/forgot-password`)**: Halaman untuk meminta tautan reset password menggunakan flow OAuth Supabase (`resetPasswordForEmail`).
- **Fitur Reset Password (`/reset-password`)**: Halaman untuk melakukan perubahan password secara asinkronus setelah session pemulihan divalidasi.
- Otomasi deteksi _next parameter_ di API route callbacks (`/api/auth/callback`) untuk mendukung pengalihan laman Magic Link yang dinamis.
- Integrasi ke Form UI Zod Schema auth baru khusus pemulihan kata sandi.

### Fixed

- **API/Query**: Memperbaiki error ambiguitas relasi (`PGRST201`) pada _query_ Supabase di modul Open Recruitment (`getRegistrations` dan `getBlacklist`) dengan menambahkan _Foreign Key Hint_ eksplisit (`users!or_registrations_user_id_fkey`).
- **Database/RLS**: Memperbaiki _bug_ data pendidikan (NIM dan Jurusan) pendaftar yang tidak muncul bagi admin dengan menambahkan _policy_ RLS `"education: admin read"` pada tabel `education_details`.
- **Database/RLS**: Memperbarui _policy_ RLS pada tabel `or_registrations` agar lebih fleksibel dan terintegrasi dengan sistem RBAC (menggunakan pengecekan _permission_ `or:manage`) menggantikan pengecekan _role_ statis.
- **UI/Logic**: Memperbaiki _bug_ munculnya akun dengan _multi-role_ (seperti akun yang memiliki role `caang` sekaligus `super_admin`) di antrean Halaman Verifikasi. Perbaikan dilakukan dengan menambahkan _hint_ relasi `user_roles!user_roles_user_id_fkey` dan mengimplementasikan filter pengecualian _role_ staf/pengurus di sisi server (Next.js).

---

## [0.8.1] - 2026-03-07

### Added

- **Dokumen & Bukti Pembayaran**: Mendukung upload berkas gambar pendaftaran calon anggota secara langsung dari web menuju _Cloudflare R2 Object Storage_.
- **Client-Side Compression**: Integrasi `browser-image-compression` untuk mencekik bandwith dan ukuran file maksimal 1MB per gambar sebelum diunggah ke server.
- **R2 Folder Organizing**: Upload file kini dikelompokkan otomatis berkat path dinamis `caang/2026/{userId}/namafile` per pendaftar.
- UI _Preview Image_ _realtime_ saat memuat file foto (Dokumen dan Pembayaran).
- Bar indikator kemajuan unduhan file ("_Memproses Pemasukan Data..._") khusus per file di step Dokumen dan Pembayaran.
- Peringatan pop-up navigasi browser (`beforeunload`) bila caang tak sengaja me-refresh halaman sebelum menyimpan unggahan gambar.
- Link praktis di formulir dokumen yang langsung mengarahkan pengguna ke laman Instagram dan YouTube instansi.

### Changed

- Input **Nominal Pembayaran (Rp)** telah dihapus dari formulir untuk menghindari _human-error_.
- Input **Bukti Pembayaran (URL)** (teks manual) telah diubah sepenuhnya menggunakan form File Image khusus.
- Apabila calon anggota menekan metode pembayaran "Transfer", sistem kini akan menayangkan UI Box Daftar Rekening Bank Statis (Bank Nagari, BNI) dan E-Wallet (DANA, OVO) lengkap dengan tombol klik Salin Nomor _Clipboard_ 📋.

---

## [0.8.0] - 2026-03-05

### Fixed

- **Auth & Audit Logs**: Memperbaiki issue `Database error saving new user` saat register yang disebabkan karena trigger `fn_audit_log` memaksa pencarian `NEW.id` pada tabel yang memakai `user_id` (seperti `profiles`).
- **Auth Triggers**: Menyederhanakan trigger tabel `auth.users` dengan menggabungkan operasi insert `users` dan `profiles` ke dalam satu transaksi function `handle_new_user()` untuk mencegah _race condition_.

### Added

#### Dashboard Caang — Wizard Pendaftaran (`/dashboard`)

- Dashboard halaman utama otomatis mendeteksi role `caang` dan menampilkan wizard pendaftaran
- Wizard 4-step: Data Diri → Upload Dokumen → Pembayaran → Review & Kirim
- Step 1 (Biodata): nama, panggilan, gender, TTL, alamat, telepon, NIM, jurusan/prodi (cascading dropdown), tahun masuk, motivasi, pengalaman organisasi, prestasi
- Step 2 (Dokumen): URL pas foto, KTM (opsional), bukti follow IG Robotik, IG MRC, subscribe YT — dengan indikator status per dokumen
- Step 3 (Pembayaran): metode (transfer/offline), nominal, bukti pembayaran URL
- Step 4 (Review): ringkasan data diri, checklist dokumen (✓/✗), info pembayaran, tombol submit
- Visual step indicator: active/done/pending states dengan ikon + warna
- Status banner: submitted (kuning), accepted (hijau 🎉), rejected (merah), revision (oranye + field tags)
- Revision mode: field yang perlu direvisi ditandai border oranye + badge "Revisi"
- Read-only mode saat status submitted/accepted/rejected
- Auto-create `or_registrations` record saat caang pertama kali buka dashboard
- Server component `CaangDashboard` dengan welcome header, progress info bar, dan data fetching paralel
- 6 server actions baru: `getMyRegistration`, `saveBiodata`, `saveDocuments`, `savePayment`, `submitRegistration`, `getStudyProgramOptions`

#### Modul Open Recruitment — Manajemen Caang

**Database (Migration: `20260304190000_create_or_registrations.sql`):**

- 1 tabel: `or_registrations` (biodata, dokumen, pembayaran, verifikasi)
- 2 enum: `or_registration_status` (draft/submitted/revision/accepted/rejected), `or_registration_step` (biodata/documents/payment/completed)
- Multi-step tracking pendaftaran: biodata → dokumen → pembayaran → submit
- Verifikasi 3 keputusan: terima, tolak, minta revisi (dengan field tracking)
- Revision fields: array field yang perlu direvisi oleh caang
- Unique constraint: 1 pendaftaran per user
- RLS: admin OR full access + caang CRUD own registration
- Realtime enabled: `or_registrations`
- Schema TypeScript (`lib/db/schema/or.ts`): `OrRegistration(WithUser)`, `OrBlacklistWithUser`, `OrDashboardStats`

**Verifikasi Pendaftar (`/dashboard/or/caang/verifikasi`):**

- Alert pending: jumlah pendaftar menunggu verifikasi + revisi ulang
- Filter status (submitted/revision/accepted/rejected) + text search (nama/email)
- Kartu pendaftar: avatar, biodata ringkas (email, NIM, prodi, telepon), status + step badge
- Quick action buttons per kartu: terima (✓), revisi (↻), tolak (✗)
- Detail modal: biodata grid lengkap, motivasi, pengalaman, prestasi, dokumen preview grid, pembayaran
- Verifikasi form inline: terima (catatan opsional), tolak (alasan), revisi (pilih field + instruksi)
- Revision field tag selector: 9 field (foto, KTM, IG, YT, pembayaran, motivasi, telepon, alamat)
- Preview dokumen overlay
- Komponen: `VerifikasiManager`, `VerifikasiSkeleton`

**Daftar Blacklist Caang (`/dashboard/or/caang/blacklist`):**

- Statistik: total blacklist, permanen, sementara
- Form tambah blacklist: pilih caang (filter existing), alasan, bukti URL, permanen/sementara + tanggal exp
- Auto-reject pendaftaran aktif saat diblacklist
- Kartu blacklist: badge permanen/sementara, alasan, tanggal, exp date
- Preview bukti + hapus dengan konfirmasi
- Komponen: `BlacklistManager`, `BlacklistSkeleton`

**Database & Edit Data (`/dashboard/or/caang/database`):**

- Statistik 6 kartu: total, draft, menunggu, revisi, diterima, ditolak
- Filter status + text search (nama/email/NIM)
- Tabel lengkap: nomor, nama+email, status, NIM, prodi, telepon, step (emoji), terdaftar, aksi
- Edit modal: profil (nama, panggilan, telepon, alamat) + registrasi (motivasi, pengalaman, prestasi, tahun masuk)
- Preview dokumen (foto, KTM, IG, YT, bukti bayar) dari dalam modal edit
- Dual update: adminUpdateProfile + adminUpdateRegistration
- Komponen: `DatabaseManager`, `DatabaseSkeleton`

**Server Actions (`or.action.ts`):**

- `getRegistrations()` — filter status + search, join profil + edukasi + prodi + jurusan
- `getRegistrationById()`
- `verifyRegistration()` — accept/reject/revision + revision fields
- `adminUpdateRegistration()` — update data pendaftaran
- `adminUpdateProfile()` — update profil user
- `getBlacklist()` — join profil + email
- `addToBlacklist()` — auto reject pendaftaran aktif
- `removeFromBlacklist()`

---

## [0.7.0] - 2026-03-03

### Added

#### Modul Komisi Disiplin — Dashboard (`/dashboard/komdis`)

- 3 section statistik: Kegiatan & Kehadiran (6 kartu), Pelanggaran & Poin (4 kartu), Surat Peringatan (5 kartu)
- Alert banner real-time: kegiatan berlangsung (🟢 pulse) + pending review pengurangan poin
- Quick links ke semua 6 sub-halaman komdis dengan ikon, deskripsi, hover effect
- Server action: `getKomdisDashboardStats()` — aggregate dari 5 tabel (events, attendances, violations, reductions, warning_letters)

#### Modul Komisi Disiplin — Kegiatan & Absensi QR

**Database (Migration: `20260303210000_create_komdis_system.sql`):**

- 4 tabel baru: `komdis_events`, `komdis_attendance_tokens`, `komdis_attendances`, `komdis_sanctions`
- 3 enum: `komdis_event_status` (draft/upcoming/ongoing/completed), `komdis_attendance_status` (present/late/absent), `komdis_sanction_type` (physical/points)
- QR token dinamis: TTL 5 menit, auto-invalidasi token lama, deteksi kadaluarsa
- Deteksi keterlambatan otomatis: `start_time + late_tolerance` vs waktu scan
- RLS: pengurus full access + anggota baca event publik, kelola token sendiri, baca kehadiran sendiri
- Realtime enabled: `komdis_attendance_tokens`, `komdis_attendances`
- Constraint: 1 kehadiran per user per event, 1 sanksi per kehadiran
- Schema TypeScript: `KomdisEvent`, `KomdisAttendance(WithUser)`, `KomdisAttendanceToken`, `KomdisSanction`, `KomdisEventStats`

**Buat Kegiatan (`/dashboard/komdis/kegiatan/buat`):**

- Form CRUD: judul, deskripsi, lokasi, tanggal, jam mulai/selesai, toleransi telat (menit), poin default
- Daftar kegiatan dengan status badge (4 warna)
- Status transition: draft → upcoming → ongoing → completed (dengan konfirmasi dialog)
- Edit & hapus untuk kegiatan draft
- Metadata card: tanggal, waktu, lokasi, toleransi
- Komponen: `KegiatanManager`, `KegiatanSkeleton`

**Kelola Absensi (`/dashboard/komdis/kegiatan/absensi`):**

- Event selector dengan indikator 🟢 ongoing
- 5 statistik: hadir, terlambat, tidak hadir, sanksi fisik, total poin
- QR Scanner: input field auto-focus + Enter key (barcode scanner friendly)
- Hasil scan real-time: sukses (auto-dismiss 4s), telat (persistent + aksi cepat), error
- Quick sanction pada scan telat: 🏋️ Sanksi Fisik / ⚡ Poin (1-klik)
- Tabel kehadiran: nama, status badge, jam scan, menit telat, badge sanksi, tombol aksi
- Form sanksi inline: tipe (fisik/poin), jumlah poin, catatan
- Komponen: `AbsensiManager`, `AbsensiSkeleton`

**Server Actions (`komdis.action.ts`):**

- `getKomdisEvents()`, `getKomdisEventById()`, `createKomdisEvent()`, `updateKomdisEvent()`, `updateKomdisEventStatus()`, `deleteKomdisEvent()`
- `generateAttendanceToken()` — QR token 64-char hex, TTL 5 menit, cek sudah hadir, invalidasi token lama
- `scanAttendanceToken()` — validasi 4 langkah (exist, unused, not expired, not duplicate), deteksi telat otomatis, catat kehadiran
- `getEventAttendances()`, `giveSanction()` (upsert), `getEventStats()`

#### Modul Komisi Disiplin — Pelanggaran & Poin

**Database (Migration: `20260303220000_create_komdis_violations.sql`):**

- 2 tabel baru: `komdis_violations` (dengan link opsional ke event/sanction), `komdis_point_reductions` (pengajuan pengurangan)
- 2 enum: `komdis_violation_category` (attendance/discipline/property/ethics/other), `komdis_reduction_status` (pending/approved/rejected)
- Partial approval: `approved_points` ≤ `points` yang diminta
- RLS: pengurus full access + anggota baca pelanggaran sendiri, CRUD pengajuan sendiri
- Realtime enabled: `komdis_violations`, `komdis_point_reductions`
- Schema TypeScript: `KomdisViolation(WithUser)`, `KomdisPointReduction(WithUser)`, `KomdisMemberPointSummary`

**Input & Edit Poin (`/dashboard/komdis/pelanggaran/poin`):**

- 2 mode tampilan: Ringkasan (ranking tabel per anggota) + Semua Pelanggaran (detail)
- Ringkasan: ranking by net poin, kolom pelanggaran/total/pengurangan/poin bersih, badge warna (≥5 merah, ≥3 kuning)
- Form input: pilih anggota (dropdown), kategori (5 pilihan), deskripsi, poin
- Edit & hapus pelanggaran dengan konfirmasi dialog
- Filter kategori pada tabel pelanggaran
- Search anggota pada ringkasan
- Komponen: `ViolationManager`, `ViolationSkeleton`

**Review Pengurangan Poin (`/dashboard/komdis/pelanggaran/review`):**

- Banner pending count
- Filter status: pending / approved / rejected
- Kartu pengajuan: nama, poin diminta, alasan, tanggal, bukti (preview modal)
- Approve: partial approval (poin disetujui ≤ diminta) + catatan komdis
- Reject: dengan alasan
- Hasil review ditampilkan pada kartu yang sudah diproses
- Komponen: `ReductionReviewManager`, `ReductionSkeleton`

**Server Actions (tambahan di `komdis.action.ts`):**

- `getViolations()`, `createViolation()`, `updateViolation()`, `deleteViolation()`
- `getMemberPointSummaries()` — aggregate poin - pengurangan per anggota, sorted desc
- `getPointReductions()`, `reviewPointReduction()` (approve partial / reject)
- `getAllMembers()` — daftar anggota untuk dropdown

#### Modul Komisi Disiplin — Surat Peringatan (SP) Digital

**Database (Migration: `20260304080000_create_komdis_sp.sql`):**

- 1 tabel: `komdis_warning_letters` (nomor surat, level, status, konten, audit trail)
- 2 enum: `komdis_sp_level` (sp1/sp2/sp3), `komdis_sp_status` (draft/issued/acknowledged/revoked)
- Auto-generate nomor surat: `{seq}/{SP-level}/KOMDIS/{bulan_romawi}/{tahun}`
- Point snapshot: catat total poin saat SP diterbitkan
- Revocation audit: revoked_by, revoked_at, revoke_reason
- RLS: pengurus full access + anggota baca SP sendiri yang issued/acknowledged
- Realtime enabled: `komdis_warning_letters`
- Schema TypeScript: `KomdisWarningLetter(WithUser)`, `KomdisSpLevel`, `KomdisSpStatus`

**Penerbitan SP Digital (`/dashboard/komdis/sp/terbit`):**

- Stats bar: draft, aktif, total SP
- Form buat SP: pilih anggota (dropdown + poin terkini), level (SP-1/2/3), perihal, alasan, ringkasan pelanggaran, konsekuensi, tanggal berlaku/kedaluwarsa
- Auto-snapshot poin anggota saat membuat SP
- Kartu SP: level badge warna, status badge, nomor surat, tanggal, poin
- Draft actions: terbitkan (dengan konfirmasi), edit, hapus
- Aktif actions: cabut SP (dengan alasan wajib)
- Detail: alasan, ringkasan pelanggaran (pre block), konsekuensi, alasan pencabutan
- Komponen: `SpTerbitManager`, `SpTerbitSkeleton`

**Riwayat SP Anggota (`/dashboard/komdis/sp/riwayat`):**

- 5 statistik: SP-1, SP-2, SP-3 (excl. revoked), aktif, dicabut
- Triple filter: level + status + anggota (server-side)
- Search: nama, nomor surat, perihal (client-side)
- Tabel riwayat: anggota, level, status, nomor surat, perihal, tanggal, poin
- Expandable rows: detail alasan, pelanggaran, konsekuensi, tanggal berlaku/kedaluwarsa, acknowledgement, revocation
- Komponen: `SpRiwayatManager`, `SpRiwayatSkeleton`

**Server Actions (tambahan di `komdis.action.ts`):**

- `getWarningLetters()` — filter by level/status/user, join profil + email
- `createWarningLetter()` — auto nomor surat, point snapshot, status draft
- `updateWarningLetter()` — hanya draft
- `issueWarningLetter()` — draft → issued + tanggal terbit/berlaku
- `revokeWarningLetter()` — issued/acknowledged → revoked + audit trail
- `deleteWarningLetter()` — hanya draft

#### Modul Kesekretariatan — Sistem Piket & Denda

**Database (Migration: `20260303200000_create_piket_system.sql`):**

- 4 tabel baru: `piket_periods`, `piket_assignments`, `piket_submissions`, `piket_fines`
- 2 enum: `piket_submission_status` (pending/approved/rejected), `piket_fine_status` (unpaid/pending_verification/paid/waived)
- RLS policy: pengurus full access + anggota self-access (baca jadwal, submit piket, baca denda)
- Realtime enabled: `piket_submissions`, `piket_fines`
- Constraint: 1 jadwal per user per periode, 1 submission per assignment per bulan, 1 denda per assignment per bulan
- Schema TypeScript: `PiketPeriod`, `PiketAssignment(WithUser)`, `PiketSubmission(WithUser)`, `PiketFine(WithUser)`, `PiketDashboardStats`

**Dashboard Kestari (`/dashboard/kestari`):**

- Overview dengan 8 statistik kartu: total anggota, terjadwal, submit bulan ini, pending, disetujui, ditolak, belum bayar, total denda
- Banner periode aktif dengan nominal denda

**Atur Jadwal Piket (`/dashboard/kestari/piket/jadwal`):**

- Buat periode baru (nama, tanggal mulai/akhir, nominal denda)
- Generate jadwal otomatis: distribusi merata ke 4 minggu, random shuffle
- Tabel anggota per minggu dengan dropdown ubah minggu
- Edit nominal denda inline
- Dialog konfirmasi generate ulang
- Komponen: `PiketScheduleManager`, `ScheduleSkeleton`

**Verifikasi Bukti Piket (`/dashboard/kestari/piket/verifikasi`):**

- Filter: status (pending/approved/rejected) + bulan
- Kartu submission: nama, minggu piket, tanggal, catatan
- Tombol lihat foto sebelum/sesudah (fullscreen modal)
- Approve 1-klik + reject dengan alasan (dialog)
- Tampilkan alasan penolakan pada kartu yang ditolak
- Komponen: `PiketVerificationManager`, `VerificationSkeleton`

**Daftar Pelanggar Piket (`/dashboard/kestari/sanksi/pelanggar`):**

- Generate denda otomatis per bulan (skip yang sudah piket/sudah kena denda)
- Dialog konfirmasi generate dengan info nominal
- Banner ringkasan: jumlah pelanggar × total denda belum bayar
- Tabel pelanggar: bulan, nominal, status (4 badge warna), alasan
- Filter status + bulan
- Komponen: `PelanggarManager`, `PelanggarSkeleton`

**Verifikasi Pembayaran Denda (`/dashboard/kestari/sanksi/pembayaran`):**

- Banner pending verifikasi
- Default filter: pending_verification (akses cepat)
- Kartu denda: nama, bulan, nominal, badge status
- Lihat bukti bayar (fullscreen modal)
- Tombol Verifikasi Lunas (1-klik) + Bebaskan (dispensasi, dialog)
- Komponen: `PaymentVerificationManager`, `PaymentSkeleton`

**Server Actions (`kestari.action.ts`):**

- `getPiketPeriods()`, `getActivePeriod()`, `createPiketPeriod()`, `updateFineAmount()`
- `generatePiketSchedule()` — random shuffle + modulo distribution ke 4 minggu
- `getPiketAssignments()`, `updateAssignmentWeek()`
- `getPiketSubmissions()`, `verifyPiketSubmission()`
- `generateFinesForMonth()` — auto-denda, skip approved, skip existing
- `getPiketFines()`, `verifyFinePayment()`
- `getPiketDashboardStats()` — 8 metrik real-time

**UI:**

- Komponen `Textarea` (shadcn/ui) ditambahkan

---

## [0.6.0] - 2026-03-01

### Added

#### Dashboard MRC (`/dashboard/mrc`)

- Halaman overview modul MRC dengan layout Bento Grid
- Hero card event aktif/terbaru: status, jadwal pendaftaran, lokasi, jumlah kategori
- Statistik ringkasan: total event, total kategori, event aktif
- Quick links ke semua 8 sub-halaman MRC
- Daftar semua event dengan status badge dan info ringkas
- Empty state dengan CTA buat event pertama
- Skeleton loading state lengkap

#### Modul MRC — Buka/Tutup Pendaftaran (`/dashboard/mrc/pengaturan/pendaftaran`)

- Migration: tabel `mrc_events` (event per edisi) dan `mrc_categories` (kategori lomba)
- Enum `mrc_event_status`: draft → registration → closed → ongoing → completed → cancelled
- Trigger `fn_mrc_updated_at()` untuk auto-update `updated_at`
- Audit trail otomatis pada `mrc_events` dan `mrc_categories`
- RLS policy: public read (semua user login) + admin manage (`mrc:manage`)
- Permission `mrc:manage` di-seed ke role `super_admin` dan `pengurus`
- Schema TypeScript: `MrcEvent`, `MrcCategory`, `MrcEventStatus`, `MRC_STATUS_LABELS`
- Validasi Zod: `mrcEventInsertSchema`, `mrcRegistrationUpdateSchema`, `mrcCategoryInsertSchema`
- Server actions: `getMrcEvents()`, `getMrcEventById()`, `createMrcEvent()`, `updateMrcRegistration()`, `updateMrcEvent()`
- Halaman Buka/Tutup Pendaftaran dengan:
  - Daftar event MRC dengan status badge, kategori count, lokasi
  - Expandable detail: jadwal pendaftaran, event start/end
  - Kontrol ubah status dengan datetime picker
  - Dialog form buat event baru (dengan auto-slug)
  - Panduan alur status event
- Komponen: `MrcRegistrationManager`, `MrcRegistrationSkeleton`

#### Modul MRC — Kategori Lomba & Biaya (`/dashboard/mrc/pengaturan/kategori`)

- Halaman manajemen kategori lomba per event MRC
- Tabel kategori dengan kolom: nama, biaya (Rupiah), ukuran tim, kuota, status aktif
- Dialog form tambah/edit kategori dengan field: nama, deskripsi, URL peraturan, biaya, min/max anggota, kuota
- Toggle aktif/nonaktif kategori (non-aktif tidak tampil di form pendaftaran)
- Hapus kategori dengan konfirmasi AlertDialog
- Ringkasan statistik: jumlah kategori, rentang biaya, kategori aktif
- Event selector untuk beralih antar event
- Server actions: `getCategoriesByEvent()`, `createMrcCategory()`, `updateMrcCategory()`, `deleteMrcCategory()`
- Komponen: `MrcCategoryManager`, `MrcCategorySkeleton`

#### Modul MRC — Database Pendaftaran Peserta

- Migration: tabel `mrc_teams` (data tim + status workflow 6 tahap)
- Tabel `mrc_team_members` (anggota tim: ketua, member, pembimbing)
- Tabel `mrc_payments` (bukti pembayaran + verifikasi panitia)
- Enum: `mrc_team_status`, `mrc_payment_status`, `mrc_member_role`
- Audit trail otomatis pada `mrc_teams` dan `mrc_payments`
- RLS policy: admin manage + peserta akses tim sendiri
- Tipe TypeScript: `MrcTeam`, `MrcTeamMember`, `MrcPayment`, `MrcTeamFull`

#### Modul MRC — Verifikasi Berkas & Tim (`/dashboard/mrc/peserta/berkas`)

- Tabel tim peserta dengan expandable detail (anggota, kontak, pembimbing)
- Filter event dan status (pending, revisi, terverifikasi, ditolak)
- Statistik mini: menunggu, perlu revisi, terverifikasi
- Aksi verifikasi: setujui / minta revisi / tolak (dengan alasan wajib)
- Server actions: `getTeamsForVerification()`, `updateTeamDocStatus()`
- Komponen: `TeamVerificationTable`, `TeamVerificationSkeleton`

#### Modul MRC — Verifikasi Pembayaran (`/dashboard/mrc/peserta/pembayaran`)

- Tabel tim dengan bukti pembayaran, nominal, metode, pengirim
- Link langsung ke file bukti pembayaran
- Statistik: tim eligible, menunggu, terverifikasi, total pemasukan (Rupiah)
- Aksi verifikasi / tolak inline dengan alasan
- Auto-update status tim ke `payment_verified` setelah pembayaran diverifikasi
- Server actions: `getTeamsForPayment()`, `verifyPayment()`
- Komponen: `PaymentVerificationTable`, `PaymentVerificationSkeleton`

#### Modul MRC — Database Sistem QR & Check-in

- Migration: tabel `mrc_qr_codes` (token QR per anggota tim)
- Tabel `mrc_scan_logs` (log setiap scan: checkin/entry/exit/match_verify)
- Enum: `mrc_scan_type`, `mrc_member_role` (reuse)
- RLS policy untuk panitia
- Tipe TypeScript: `MrcQrCode`, `MrcQrCodeWithTeam`, `MrcScanLog`, `MrcScanType`

#### Modul MRC — Pendaftaran Ulang (`/dashboard/mrc/operasional/checkin`)

- Scanner input QR token (kompatibel barcode scanner)
- Statistik realtime: total kokarde, sudah check-in, di dalam gedung
- Daftar peserta dengan status check-in & inside badge
- Feedback scan langsung (sukses/sudah check-in/error)
- Server actions: `getCheckinStats()`, `scanQrToken()`
- Komponen: `CheckinManager`, `CheckinSkeleton`

#### Modul MRC — Generate & Cetak QR (`/dashboard/mrc/operasional/qr`)

- Generate QR codes batch untuk semua anggota tim (skip duplikat)
- Tabel QR: nama, tim, role, token, status check-in
- Layout cetak kokarde 2 kolom (print-friendly via `print:hidden`/`print:block`)
- Statistik: total QR, sudah/belum check-in
- Server actions: `generateQrCodesForEvent()`, `getQrCodesForEvent()`
- Komponen: `QrManager`, `QrManagerSkeleton`

#### Modul MRC — Scan QR Anti Joki (`/dashboard/mrc/operasional/scan`)

- 4 mode scan: Check-in, Masuk Gedung, Keluar Gedung, Verifikasi Tanding
- Mode selector visual dengan color-coded cards
- Input QR token dengan auto-focus (barcode scanner friendly)
- Hasil scan detail: identitas, tim, institusi, kategori, role
- Riwayat scan session-based (20 entri terakhir) dengan timestamp
- Logic auto: entry harus sudah check-in, exit toggle is_inside, match_verify read-only

#### Modul MRC — Foundation Sistem Pertandingan (Tahap 1)

**Database:**

- Migration: 6 tabel baru (`mrc_groups`, `mrc_group_teams`, `mrc_matches`, `mrc_match_rounds`, `mrc_live_state`, `mrc_overlay_configs`)
- 5 enum baru: `mrc_match_stage`, `mrc_match_status`, `mrc_timer_status`, `mrc_overlay_scene`, `mrc_timer_mode`
- Timer countdown per pertandingan (`timer_duration`, `timer_remaining`, `timer_status`, `timer_started_at`)
- Bracket progression otomatis (`next_match_id`, `next_match_slot`)
- Live state per kategori untuk kontrol overlay OBS
- Overlay config per kategori (background upload, posisi teks, warna tema)
- RLS: admin CRUD + public read untuk overlay pages
- Supabase Realtime enabled: `mrc_matches`, `mrc_match_rounds`, `mrc_live_state`, `mrc_group_teams`

**TypeScript Types:**

- 7 enum + labels: MrcMatchStage, MrcMatchStatus, MrcTimerStatus, MrcOverlayScene, MrcTimerMode
- 10 interface baru: MrcGroup, MrcGroupTeam, MrcGroupTeamWithInfo, MrcMatch, MrcMatchWithTeams, MrcMatchRound, MrcLiveState, MrcOverlayConfig, OverlayElementPosition

**Server Actions:**

- `drawGroups()` — Drawing grup acak per kategori
- `getGroupStandings()` — Ambil klasemen grup + info tim
- `getMatchesByCategory()` — Daftar pertandingan per kategori
- `submitRoundScore()` — Input skor babak + auto-update total
- `finishMatch()` — Selesaikan match + bracket progression
- `getMatchRounds()` — Skor per babak
- `getLiveState()` — Ambil/buat live state per kategori
- `updateLiveState()` — Update scene overlay, timer break/coming up
- `updateMatchState()` — Update timer, swap, status pertandingan

**Sidebar Navigation:**

- Ditambahkan section "Streaming & Overlay" (Pengaturan Overlay, Daftar Overlay)
- "Manajemen Pertandingan" diperbarui: Drawing Grup, Klasemen & Bracket, Panel Operator

#### Modul MRC — Drawing Grup & Bracket (Tahap 2)

**Halaman Drawing Grup (`/dashboard/mrc/pertandingan/drawing`):**

- Pilih event → pilih kategori lomba
- Konfigurasi: tim per grup (default 3), babak per match (2/3), durasi timer
- Drawing acak dengan dialog konfirmasi (menghapus data lama)
- Visualisasi hasil drawing: kartu grup dengan daftar tim
- Generate jadwal round-robin otomatis per grup
- Daftar pertandingan grup dengan badge status
- Server action: `generateGroupMatches()` — buat jadwal round-robin

**Halaman Klasemen & Bracket (`/dashboard/mrc/pertandingan/bracket`):**

- Dual tab: Klasemen Grup | Bracket Eliminasi
- Tabel standing per grup: M/W/D/L/SF/SA/±/Pts
- Baris lolos (top 2) di-highlight hijau
- Bracket eliminasi horizontal: kolom per stage, card per match
- Nama pemenang bold, badge LIVE merah, skor final
- Empty states informatif saat data belum ada

#### Modul MRC — Panel Operator (Tahap 3)

**Halaman Panel Operator (`/dashboard/mrc/pertandingan/operator`):**

- 3-level selector: Event → Kategori → Pertandingan (auto-select match live/upcoming)
- Scoreboard besar: nama tim (swap-aware), skor total, timer countdown
- Timer countdown: preset 1/2/3/5/10 menit + input kustom
- Kontrol timer: Start (hijau), Pause (kuning), Reset
- Timer merah berkedip saat sisa < 30 detik
- Input skor per babak (0-100) dengan catatan juri opsional
- Auto-advance babak setelah submit skor + auto-swap posisi babak genap
- Auto-reset timer ke durasi awal saat pindah babak
- Riwayat skor per babak inline
- Tombol "Mulai Pertandingan" (upcoming → live)
- Tombol "Tukar Posisi" (manual swap kapan saja)
- Dialog "Pilih Pemenang" → selesaikan match + bracket auto-advance
- Status pertandingan selesai dengan info pemenang
- Komponen: `OperatorPanel`, `OperatorSkeleton`

#### Modul MRC — Overlay OBS & Streaming (Tahap 4)

**Route Group `(overlay)` — 6 Overlay Publik untuk OBS Browser Source:**

- `/overlay/match` — Nama tim + skor + timer countdown. Elemen transparan, posisi absolut. Timer merah berkedip saat < 30 detik. Swap-aware.
- `/overlay/scoreboard` — Skor detail per babak dalam kartu semi-transparan. Pemenang dengan ikon 🏆.
- `/overlay/bracket` — Pohon bracket eliminasi horizontal. Card per match, LIVE badge merah, pemenang bold.
- `/overlay/standing` — Tabel klasemen grup. Baris lolos (top 2) highlight hijau. Dark semi-transparan.
- `/overlay/coming-up` — Preview match selanjutnya + countdown opsional.
- `/overlay/break` — Pesan istirahat animasi pulse + countdown (mode: none/countdown/target_time).
- Semua overlay: background transparan, Supabase Realtime subscription, query params `?event=xxx&cat=xxx`.
- Layout overlay: Suspense boundary, fixed fullscreen, tanpa navigasi.

**Dashboard Streaming (`/dashboard/mrc/streaming/...`):**

- **Pengaturan Overlay** (`/streaming/overlay`): Scene switcher 7 tombol (none/match/scoreboard/bracket/standing/coming_up/break), konfigurasi break (pesan + timer mode), konfigurasi coming up (pilih match + pesan + timer), start timer. Komponen: `OverlayController`.
- **Daftar Overlay** (`/streaming/daftar`): 6 kartu overlay dengan deskripsi, ikon, URL preview, tombol Salin URL (clipboard), tombol buka di tab baru. URL auto-generate dengan event & category. Komponen: `OverlayList`.

**Server Action:**

- `generateGroupMatches()` — Generate jadwal round-robin otomatis per grup

---

## [0.5.0] - 2026-02-28

### Added

#### Halaman Super Admin Panel (`/dashboard/admin`)

- Dashboard overview untuk Super Admin dengan layout Bento Grid
- Kartu statistik: total pengguna, pengguna aktif, nonaktif, dan diblokir
- Widget **Distribusi Role** dengan bar visual persentase per role
- Widget **Pendaftaran Terbaru** — 5 user terbaru dengan avatar, status, dan waktu relatif
- **Quick Links** navigasi cepat ke Manajemen Akun & Role, Audit Logs, dan Dashboard
- Server actions: `getAdminStats()`, `getRecentUsers()`
- Skeleton loading state lengkap untuk semua section dashboard

#### Halaman Audit Logs Sistem (`/dashboard/admin/audit`)

- **Sistem Audit Log** — pencatatan aktivitas perubahan data otomatis
- Migration: tabel `audit_logs` dengan kolom actor, action, table, data before/after
- Trigger otomatis pada tabel `users`, `profiles`, dan `user_roles`
- Fungsi `generate_audit_summary()` untuk deskripsi otomatis per perubahan
- Handler khusus `fn_audit_user_roles()` untuk tabel dengan composite key
- RLS policy: hanya user dengan permission `audit:read` yang bisa membaca log
- Permission `audit:read` di-seed ke role `super_admin`
- Timeline interaktif dengan filter tabel dan tipe aksi
- Detail perubahan (diff view: old vs new) yang bisa di-expand
- Paginasi "Muat Lebih Banyak" dan avatar actor pada setiap log entry
- Server action: `getAuditLogs()` dengan filter dan paginasi
- Tipe: `AuditLog`, `AuditLogWithActor`, `AuditLogFilters`
- Komponen: `AuditLogTimeline`, `AuditLogSkeleton`
- Schema type: `lib/db/schema/audit-logs.ts`

---

## [0.4.0] - 2026-02-27

### Added

- Halaman **Manajemen Akun & Role** (`/dashboard/admin/roles`) untuk Super Admin
- Tabel daftar user dengan kolom: nama, email, role, status, tanggal bergabung
- Pencarian real-time berdasarkan nama atau email
- Panel **Lihat Detail** user (slide-over sheet): profil, role, status, telepon, tanggal bergabung
- Panel **Edit Akun** (slide-over sheet) dengan fitur:
  - Ubah status akun (aktif / nonaktif / diblokir)
  - Kelola role sistem (multi-select checkbox)
  - Kirim email reset password
  - Hapus akun (soft delete dengan konfirmasi)
- Server actions: `getUsers`, `getAllRoles`, `updateUserStatus`, `updateUserRoles`, `resetUserPassword`, `deleteUser`
- Komponen reusable: `RoleBadge`, `StatusBadge`, `UserDetailSheet`, `UserEditSheet`
- Tipe shared `UserWithRoles` di `lib/types/admin.ts`
- Instalasi komponen Shadcn: `table`, `badge`, `select`, `dialog`, `alert-dialog`

### Changed

- RLS policy tabel `users` dan `profiles` ditambah akses baca untuk admin (`member:read`)
- RLS policy tabel `profiles` ditambah akses update untuk admin (`member:update`)

### Fixed

- Query `getUsers` error disambiguasi FK dengan hint `!user_roles_user_id_fkey`

---

## [0.3.0] - 2026-02-26

### Added

- Sidebar dashboard responsif dengan Shadcn Sidebar (collapsible, off-canvas di mobile)
- Navigasi role-based — menu difilter otomatis berdasarkan role user yang login
- Collapsible sub-menu dengan indikator chevron dan auto-expand saat halaman aktif
- Konfigurasi menu terpusat di `lib/sidebar-navigation.ts` untuk 6 panel admin:
  - Open Recruitment, Kesekretariatan, Komisi Disiplin, Divisi, MRC, dan Super Admin
- Komponen `AppSidebar` dengan header logo, konten menu, dan footer profil user
- Komponen `SidebarUserNav` — avatar, nama, email, dan tombol logout via dropdown
- Komponen `DashboardHeader` — toggle sidebar dan judul halaman
- Layout `(private)/layout.tsx` — auth check server-side dan query role user dari database
- Halaman dashboard dengan placeholder Bento Grid (statistik dan konten)
- Instalasi komponen Shadcn: `sidebar`, `collapsible`, `separator`, `sheet`, `tooltip`, `avatar`, `dropdown-menu`

### Changed

- Root layout ditambah `TooltipProvider` (dibutuhkan oleh Shadcn Sidebar)
- Metadata situs diperbarui dengan judul dan deskripsi UKM Robotik PNP
- Bahasa HTML diubah dari `en` ke `id`
- Proteksi auth dashboard dipindahkan dari halaman ke layout

---

## [0.2.0] - 2026-02-25

### Added

- Skema RBAC (Role-Based Access Control) dengan tabel `roles`, `permissions`, `role_permissions`, dan `user_roles`
- Tabel `departments` dengan hierarki self-referencing (`parent_id`) untuk sub-departemen
- Tabel `divisions` untuk 5 divisi kontes robot (KRAI, KRSBI Beroda, KRSBI Humanoid, KRSRI, KRSTI)
- Tabel `user_departments` untuk assignment jabatan departemen (maks 1 per user)
- Tabel `user_divisions` untuk assignment divisi dengan role teknis: mekanik, elektrikal, programmer (maks 2 per user)
- Enum PostgreSQL `division_role` untuk role teknis di divisi
- Trigger `assign_default_role` — user baru otomatis mendapat role `caang` (calon anggota) saat registrasi
- Trigger `check_max_user_divisions` — validasi maksimal 2 divisi per user di level database
- Fungsi helper `user_has_permission()` dan `user_has_role()` untuk pengecekan akses di RLS dan application code
- Seed data: 10 departemen utama, 6 sub-departemen, 5 divisi, 5 role sistem, dan 17 permission granular
- RLS policies untuk seluruh tabel RBAC, departemen, dan divisi
- TypeScript schema types untuk semua tabel baru (`departments`, `divisions`, `roles`, `permissions`, `rbac`)
- Validasi Zod untuk departemen, divisi, roles, permissions, dan seluruh tabel junction RBAC
- UI halaman login dan register dengan layout Bento Grid yang responsif (mobile–desktop)
- Komponen `BentoAuthLayout` — layout bersama untuk halaman autentikasi
- Komponen `AuthFormField` — field input reusable (Label + Input + Error)
- Custom hook `useAuthForm` — logika validasi Zod dan integrasi Supabase Auth

### Changed

- Halaman login dibungkus `Suspense` boundary untuk mendukung `useSearchParams` di Next.js 16
- Policy RLS `blacklist: admin only` diganti dengan `blacklist: admin manage` menggunakan RBAC via `user_has_permission()`

---

## [0.1.0] - 2026-02-24

### Added

- Setup awal proyek Next.js App Router
- Konfigurasi Supabase Authentication dengan email
- Halaman register dengan validasi input
- Halaman login dengan redirect ke dashboard
- Fungsi logout via Server Action
- Middleware proteksi halaman dashboard
- Callback route untuk konfirmasi email
- Skema database: users, profiles, education_details user_blacklist, majors, study_programs
- Migrasi database dengan Supabase CLI
- Row Level Security (RLS) untuk semua tabel
- Validasi input dengan Zod
- Setup shadcn/ui

---

## Template Entry

## [X.Y.Z] - YYYY-MM-DD

### Added

- Fitur baru yang ditambahkan

### Changed

- Perubahan pada fitur yang sudah ada

### Deprecated

- Fitur yang akan dihapus di versi mendatang

### Removed

- Fitur yang dihapus

### Fixed

- Bug yang diperbaiki

### Security

- Perbaikan celah keamanan
