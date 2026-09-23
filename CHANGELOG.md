# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased]

### Added

- **Seksi Dokumen Peraturan MRC di Halaman `/mrc` (`components/event/mrc-rules-section.tsx`, `app/(marketing)/mrc/page.tsx`)**: Menambahkan section **"Dokumen Resmi — Peraturan & Berkas Perlombaan"** yang menyediakan 4 dokumen rulebook (Line Follower Junior, Line Follower Umum, Robot Soccer, Robot Sumo) dan 1 gambar denah lintasan (`track_lf.jpg`) untuk dapat **dilihat, diakses, dan diunduh tanpa login**. Setiap dokumen menyediakan aksi _Lihat Dokumen_ (`target="_blank"` ke viewer bawaan peramban) dan _Unduh_ (atribut `download` dengan nama berkas asli), sedangkan berkas disajikan sebagai aset statis dari `public/documents/mrc_x/rules/`.
- **Berkas Regulasi Publik (`public/documents/mrc_x/rules/`)**: Menambahkan 4 PDF rulebook MRC X 2026 dan 1 gambar lintasan Line Follower sebagai sumber daya statis yang dapat diakses publik.

### Changed

- **Penyelarasan Nama Bank Rekening Panitia (`components/event/qris-payment-view.tsx`, `components/event/event-settings-form.tsx`)**: Mengubah nilai fallback nama bank dari `Bank Nagari / BNI` menjadi `Bank Nagari / BRI` pada halaman pembayaran peserta dan formulir pengaturan admin, agar sesuai dengan rekening yang diterima panitia dan konsisten dengan keterangan pada FAQ.
- **Penyeragaman Istilah Kategori Line Follower (`components/event/mrc-faq-accordion.tsx`)**: Mengganti penyebutan `Line Follower Senior` menjadi `Line Follower Umum` pada FAQ batas usia, menyesuaikan kesepakatan panitia dan label yang telah dipakai pada seksi Dokumen Peraturan.
- **Penyelarasan Isi FAQ Halaman MRC (`components/event/mrc-faq-accordion.tsx`)**: Menyesuaikan FAQ dengan alur pendaftaran terbaru dan menambah pertanyaan baru (dari 4 menjadi 10), meliputi:
  - Metode pembayaran berupa **transfer bank** ke rekening panitia (**Bank Nagari dan Bank BRI**) dengan pengiriman bukti pembayaran, menggantikan keterangan Payment Gateway/QRIS yang sudah tidak dipakai.
  - Kewajiban **pas foto untuk semua kategori**, sedangkan **kartu identitas hanya untuk kategori Line Follower Junior** sebagai dasar verifikasi usia.
  - Penjelasan durasi pemeriksaan bukti pembayaran (1x24 jam kerja), cara memperoleh E-Tiket & QR Kokarde, serta langkah yang ditempuh bila halaman pembayaran tidak dapat dibuka kembali.
  - **Kewajiban memakai browser standar** (Chrome/Firefox/Edge/Opera) dan larangan mengakses pendaftaran/pembayaran dari browser dalam aplikasi (Instagram, WhatsApp) karena berisiko gagal saat pengiriman foto dan pembayaran.
  - Informasi jumlah maksimal anggota tim, format foto yang diterima (JPG/PNG/WebP serta HEIC iPhone), dan prosedur perbaikan data pendaftaran.
  - Penegasan batas usia hanya berlaku untuk Line Follower Junior (maksimal 19 tahun pada 31 Oktober 2026), sedangkan kategori lain bebas usia.
- **Penyederhanaan Bahasa FAQ (`components/event/mrc-faq-accordion.tsx`)**: Mengganti istilah teknis dengan bahasa yang mudah dipahami peserta umum, seperti "mutasi transfer" menjadi "dana transfer sudah masuk", "tervalidasi" menjadi "sah", "in-app browser" menjadi "dibuka dari dalam aplikasi", dan "unggah berkas" menjadi "kirim foto". Istilah E-Tiket dan QR Kokarde kini disertai penjelasan singkat.
- **Struktur Section Halaman MRC (`app/(marketing)/mrc/page.tsx`)**: Menyisipkan `<MrcRulesSection />` sebagai section ke-5 (setelah Timeline, sebelum FAQ) dan menomori ulang komentar urutan section.
- **Pembersihan Import FAQ MRC (`components/event/mrc-faq-accordion.tsx`)**: Menghapus import `Download` dan `FileText` yang tidak terpakai setelah seksi rulebook dipisahkan ke komponen tersendiri.
- **Integrasi Verifikasi Pembayaran Manual ke Dashboard Manajemen Event (`components/event/event-dashboard-tabs.tsx`, `components/event/registration-table.tsx`, `app/(private)/manajemen-event/page.tsx`)**: Verifikasi pembayaran manual yang sebelumnya berupa halaman terpisah kini dilebur ke dalam tab "Pendaftaran & Transaksi" sebagai tabel master tunggal, dilengkapi filter, pencarian, badge status, dan ekspor CSV.
- **Perombakan Navigasi Sidebar Berbasis `Collapsible` (`components/shared/sidebar.tsx`, `components/ui/collapsible.tsx`)**: Pengelompokan ulang menu menjadi grup _Governance_, _Minangkabau Robot Contest_, dan _Kebersihan_ dengan submenu yang dapat dilipat.
- **Penyelarasan Token Desain Halaman Verifikasi Lapangan (`app/(private)/manajemen-event/verifikasi/page.tsx`)**: Mengganti warna hardcoded (`slate-*`, hex mentah `#f0975a`) dengan token semantik `DESIGN.md`, menambahkan tautan kembali ke dashboard, `aria-hidden` pada ikon dekoratif, dan target sentuh minimal 44px.
- **Konsistensi Elemen Semantik Halaman Manajemen Event (`app/(private)/manajemen-event/page.tsx`)**: Mengganti wrapper `<div>` menjadi `<main>`, seragamkan kartu "Akses Terbatas" dengan token desain, dan tambahkan ikon `ShieldAlert`.
- **Perbaikan Nilai Status Pembayaran pada Verifikasi Manual (`lib/actions/event-admin.ts`)**: `paymentStatus` kini ditetapkan eksplisit (`paid` saat disetujui, `rejected` saat ditolak) alih-alih meneruskan nilai mentah dari client.
- **Proteksi Route Manajemen Event (`app/robots.ts`, `lib/supabase/proxy.ts`)**: Menambahkan `/manajemen-event` ke daftar `disallow` crawler dan daftar route terproteksi autentikasi.

### Fixed

- **Perlindungan Anti-Bot pada Pendaftaran Event MRC (S-1, S-2, S-3) (`components/event/registration-form.tsx`, `lib/actions/event-registration.ts`, `lib/redis.ts`, `lib/schemas/event-registration.ts`)**: Menambahkan tiga lapis pertahanan pada alur `registerEventAction`:
  - **Cloudflare Turnstile (S-1)**: widget verifikasi dipasang di formulir pendaftaran dan tokennya diverifikasi di server via `verifyTurnstileToken()`; tombol kirim dinonaktifkan sampai verifikasi selesai. Bila `TURNSTILE_SECRET` belum dikonfigurasi, verifikasi dilewati dengan peringatan di log agar lingkungan pengembangan tetap berjalan.
  - **Honeypot & timing check (S-2)**: field `website` tersembunyi di luar layar (bukan `display:none`, agar tidak terdeteksi bot) serta `form_rendered_at`. Pengiriman yang mengisi honeypot atau selesai kurang dari 3 detik dibalas dengan "sukses palsu" agar bot tidak mengetahui dirinya terdeteksi.
  - **Rate limiting submit (S-3)**: `eventRegistrationRateLimiter` membatasi 10 pengiriman per 15 menit per alamat IP, mencegah skrip menghabiskan kuota kategori.
- **Perpanjangan Masa Tunggu Slot & Penahanan Kuota Pembayaran Manual (`supabase/migrations/20260923000000_fix_quota_manual_bank_and_extend_hold.sql`, `lib/event-quota.ts`, `lib/actions/event-public.ts`, `app/(marketing)/mrc/[slug]/daftar/page.tsx`)**: Karena MRC X 2026 tidak memakai payment gateway, definisi kuota `register_team` disesuaikan agar ikut menghitung status `unpaid` dan `pending_verification` — sebelumnya hanya `paid` dan `pending` sehingga slot mode transfer bank berpotensi ter-over-booking. Masa tunggu penahanan slot diperpanjang dari 2 jam menjadi **5 jam**; status final-gagal (`rejected`, `expired`, `failed`) tetap tidak menahan slot. Kriteria ini dipusatkan pada modul baru `lib/event-quota.ts` agar konsisten dengan fungsi database, dan halaman pendaftaran kini menampilkan sisa kuota serta menolak lebih awal bila kategori nonaktif atau kuota habis.
- **Perbaikan Kerentanan IDOR pada Unggah Bukti Pembayaran Manual (`lib/actions/event-registration.ts`, `components/event/e-ticket-view.tsx`, `components/event/qris-payment-view.tsx`)**: `submitManualPaymentProofAction` sebelumnya menerima `registrationId` dan mencocokkannya dengan kolom `id`, sehingga siapa pun yang mengetahui ID pendaftaran dapat menimpa bukti pembayaran tim lain. Kini otorisasi memakai `access_token` (token acak per pendaftaran yang hanya dikirim ke email tim), dan URL bukti bayar ikut divalidasi.
- **Perketat Validasi URL Gambar terhadap SSRF (`lib/schemas/event-registration.ts`)**: `isMrcImageUrl` sebelumnya menerima seluruh protokol `http(s)` tanpa memeriksa host, sehingga URL yang menunjuk ke alamat internal (loopback, jaringan privat, host tanpa domain, hingga endpoint metadata cloud `169.254.169.254`) dapat lolos. Kini host internal tersebut ditolak, sementara proxy internal `/api/r2/` dan domain publik tetap diterima.
- **Penegakan Batas Jumlah Anggota di Sisi Server (`lib/schemas/event-registration.ts`, `lib/actions/event-registration.ts`)**: Sebelumnya `category.max_team_members` hanya dibatasi di UI sehingga payload berisi ratusan anggota tetap lolos validasi. Kini skema menerapkan plafon keras `HARD_MAX_TEAM_MEMBERS` (20) dan server action membandingkan jumlah anggota dengan `max_team_members` kategori di database.
- **Penguatan Skema Pendaftaran Event (`lib/schemas/event-registration.ts`)**: Menambahkan batas `.max()` pada seluruh field teks (nama tim, instansi, kota, pembimbing, nama anggota, email) untuk mencegah error `VARCHAR(n)`, serta mengganti validasi WhatsApp dari `.min(9)` menjadi regex nomor Indonesia `^(\+62|62|0)8[1-9][0-9]{6,11}$`.
- **Penyembunyian Detail Error Database (`lib/actions/event-registration.ts`)**: Pesan kegagalan RPC `register_team` tidak lagi diteruskan mentah ke pengguna; detail lengkap hanya dicatat di log server.
- **Test Regresi Keamanan (`lib/schemas/event-registration.security.test.ts`, `lib/event-quota.test.ts`)**: Menambahkan 23 test yang mengunci perilaku perbaikan di atas (validasi URL, batas anggota, panjang teks, format WhatsApp, field anti-bot, dan kriteria penahanan slot kuota) agar tidak kembali longgar.

### Changed

- **Pembangkitan Kode Registrasi & Order ID Memakai CSPRNG (`lib/actions/event-registration.ts`)**: `generateRegistrationCode()` dan `generateOrderId()` tidak lagi memakai `Math.random()` yang dapat diprediksi dari nilai sebelumnya, melainkan `randomInt` dari `node:crypto`.
- **Jenis Berkas Khusus untuk Bukti Pembayaran (`lib/mrc-image-config.ts`, `lib/server/mrc-image-pipeline.ts`, `lib/actions/event-registration.ts`)**: Menambahkan kind `paymentProof` (batas 6 MB, kualitas WebP 85 agar nominal dan tanggal transfer terbaca) sehingga unggahan bukti transfer tidak lagi memakai konfigurasi kartu identitas dan tersimpan pada folder `mrc/payment-proofs` yang terpisah.
- **Pengurangan Hak Akses Halaman Pendaftaran Publik (`app/(marketing)/mrc/[slug]/daftar/page.tsx`)**: Mengganti `createAdminClient()` (service_role, melewati RLS) dengan `createClient()` (anon) karena ketiga tabel yang dibaca sudah memiliki RLS policy `public read` untuk role anon — sejalan dengan prinsip least privilege.

### Removed

- **Halaman Verifikasi Pembayaran Manual Terpisah (`app/(private)/manajemen-event/verifikasi-pembayaran/page.tsx`, `components/event/manual-payment-verification-list.tsx`)**: Menghapus halaman dan komponen verifikasi pembayaran yang berdiri sendiri beserta seluruh pemanggilan `revalidatePath` terkait (`lib/actions/event-admin.ts`, `lib/actions/event-registration.ts`), karena fungsinya telah diintegrasikan ke dashboard manajemen event.

## [0.11.0](https://github.com/zakyrmh/robotik-pnp/compare/v0.10.0...v0.11.0) (2026-09-18)

### ✨ Features

- implement Caang Registration Dashboard and statistics ([accccde](https://github.com/zakyrmh/robotik-pnp/commit/accccde766aca8797e71574d934882e882e51f88))

## [0.10.0](https://github.com/zakyrmh/robotik-pnp/compare/v0.9.4...v0.10.0) (2026-09-17)

### ⚡ Performance Improvements

- optimize server-side usage for Vercel Free Plan ([c389ad7](https://github.com/zakyrmh/robotik-pnp/commit/c389ad7cb7ef1611e1f3c695456ab20dfe7b1a4a))

### ✨ Features

- **dashboard:** add caang WhatsApp group link ([8aa178b](https://github.com/zakyrmh/robotik-pnp/commit/8aa178bae7ea9a84e51c619380f682e559e9a580))
- **piket:** exempt members on internship/PKL from mandatory duties and fines ([c97687b](https://github.com/zakyrmh/robotik-pnp/commit/c97687b0779cc007b29b4deb966add80d59da611))

### 🏠 Chores

- **release:** merge develop into main for v0.10.0 ([c49b8fb](https://github.com/zakyrmh/robotik-pnp/commit/c49b8fb65e9bc3c8bba71d8be3fe433e84066ce6))

### [0.9.4](https://github.com/zakyrmh/robotik-pnp/compare/v0.9.3...v0.9.4) (2026-09-17)

### ✨ Features

- **manajemen-caang:** mengambil data utama dari `profiles` dengan role `caang` dan menggabungkannya dengan data `registrations` pada tabel manajemen Caang.

### 🐛 Bug Fixes

- **manajemen-caang:** menambahkan fallback nama dan foto dari profil ketika data pendaftaran tidak lengkap.

### [0.9.3](https://github.com/zakyrmh/robotik-pnp/compare/v0.9.2...v0.9.3) (2026-09-16)

### ✨ Features

- **onboarding:** display registration payment accounts ([4e6bb08](https://github.com/zakyrmh/robotik-pnp/commit/4e6bb08281c364286a2c6ef18337e8617399d637))

### 🏠 Chores

- **release:** merge develop into main for v0.9.3 ([58551e9](https://github.com/zakyrmh/robotik-pnp/commit/58551e9d0c048805d6444576ef845a159c33e250))

### [0.9.2](https://github.com/zakyrmh/robotik-pnp/compare/v0.9.1...v0.9.2) (2026-09-16)

### ✨ Features

- implement atomic caang status update, revision onboarding flow, and route guards ([448d3b5](https://github.com/zakyrmh/robotik-pnp/commit/448d3b54ca47d9fdc9f5f3a43d0f1546b3446a77))
- **onboarding:** require social media proof uploads ([ad1d90b](https://github.com/zakyrmh/robotik-pnp/commit/ad1d90b54017d4bb501703ad0570b764353186dc))
- **onboarding:** support candidate registration revisions ([002f6dd](https://github.com/zakyrmh/robotik-pnp/commit/002f6ddb14ab33565a5f41867af9f971c86ea00d))

### 🏠 Chores

- merge develop into main ([5461eea](https://github.com/zakyrmh/robotik-pnp/commit/5461eeae4313b600d3625ce03e0baa97df801326))

### 📝 Documentation

- update changelog for caang onboarding changes ([5931c3e](https://github.com/zakyrmh/robotik-pnp/commit/5931c3e35c332ed1354328e617651da3d0934000))

### Added

- **Informasi Rekening Pembayaran Pendaftaran (`app/(marketing)/pendaftaran-caang/CaangLandingClient.tsx`, `components/onboarding/step-upload.tsx`)**: Menampilkan biaya pendaftaran, nama bank, nomor rekening, dan nama pemilik rekening dari tabel `or_settings` pada halaman publik pendaftaran dan Step 5 onboarding.
- **Tampilan Rekening Resmi di Step 5 (`components/onboarding/step-upload.tsx`)**: Menambahkan kartu rekening responsif dengan label rekening resmi, informasi biaya, dan styling yang mengikuti token desain `DESIGN.md` serta `app/globals.css`.

### Changed

- **Distribusi Pengaturan Pembayaran Onboarding (`app/(onboarding-flow)/onboarding/page.tsx`, `components/onboarding/onboarding-client.tsx`)**: Memuat pengaturan OR secara server-side bersama progres onboarding dan meneruskannya ke komponen Step 5 tanpa query database dari client component.
- **UX Informasi Pembayaran Halaman Pendaftaran (`app/(marketing)/pendaftaran-caang/CaangLandingClient.tsx`)**: Menambahkan kartu rekening dengan dukungan salin nomor rekening, fallback saat rekening belum tersedia, dan informasi biaya pendaftaran.

## [0.9.1] - 2026-09-15

### Changed

- **Pembaruan Kategori & Biaya Pendaftaran Review Midtrans (`app/(marketing)/review-midtrans/page.tsx`, `docs/midtrans-review-instructions.md`)**:
  - Menyesuaikan 4 kategori kompetisi simulasi resmi beserta tarif pendaftarannya:
    1. **Sumobot**: Rp 195.000
    2. **Robot Soccer**: Rp 195.000
    3. **Line Follower Senior**: Rp 195.000
    4. **Line Follower Junior**: Rp 170.000
  - Memperbarui badge styling kategori, label jumlah kategori (4 Kategori), dan rentang biaya (Rp170.000 - Rp195.000) pada callout banner verifikasi Midtrans.
  - Menyinkronkan petunjuk pengujian sandbox Midtrans (`docs/midtrans-review-instructions.md`).

## [0.9.0] - 2026-09-13

### Added

- **Workflow Review Laporan Piket oleh Kestari (`lib/actions/piket.ts`, `components/features/piket/piket-client.tsx`)**: laporan bersifat auto-terverifikasi sistem namun dapat disetujui (final, terkunci) atau ditolak dengan alasan wajib oleh `admin-kestari`/`super-admin`; laporan ditolak dapat diunggah ulang sebagai log baru maks 2x per pekan; seluruh aksi review tercatat di audit log.
- **Denda Administratif Piket (`supabase/migrations/20260916000000_piket_review_and_fines.sql`, `lib/actions/piket.ts`)**: tabel baru `piket_fines` (satu denda per anggota per jadwal pekan, nominal default Rp10.000, status Belum Lunas/Lunas) beserta aksi `imposePiketFine`, `markPiketFinePaid`, `voidPiketFine`; UI kelola denda + badge pengingat di halaman `/piket` (termasuk tombol Denda bagi petugas yang belum melapor).
- **Penguatan Validasi Bukti Foto (`lib/actions/piket.ts`, `lib/utils/piket-date.ts`)**: helper `isDateInPiketWeek()` — foto boleh diambil di hari berbeda selama dalam pekan Senin–Minggu yang sama (foto pekan lain/masa depan tetap ditolak); tolak foto sebelum–sesudah identik (SHA-256), tolak hash yang pernah dipakai di laporan manapun, tolak urutan waktu terbalik; tanggal foto disimpan ke `photo_taken_at_*` dan hash ke `photo_hash_*`.
- **Finalisasi Otomatis Akhir Pekan (`lib/actions/piket.ts`, `app/(private)/piket/page.tsx`)**: laporan auto yang pekannya sudah berakhir difinalisasi sistem secara lazy saat halaman dibuka Kestari (patuh RLS, + audit ringkasan).
- **Dukungan HEIC/HEIF Lokal (`lib/utils/image-processing.ts`)**: konversi via dependency `heic2any` lokal (bukan CDN) + flag asal-HEIC dan tanggal file ke Server Action dengan jalur validasi fallback tanggal perangkat.
- **Pencarian Anggota di Kelola Piket (`components/features/piket/kelola-piket-client.tsx`, `app/(private)/piket/kelola/page.tsx`)**: pemilih anggota berbasis pencarian (nama/NIM/role) serta pemakaian kolom `profiles.full_name` sebagai nama utama.

### Fixed

- **Sinkronisasi Pekan `/piket` vs `/piket/kelola` (`app/(private)/piket/page.tsx`)**: halaman anggota memakai kueri lama (`day`, `week_number` hardcoded 1) sehingga penugasan Pekan 3 tampil sebagai Pekan 1; kini memakai `academic_period`/`week_number`/`room_target` asli dari database dengan daftar periode dinamis.
- **Ekspor Konstanta dari File `"use server"` (`lib/actions/piket.ts`)**: `MAX_PIKET_ATTEMPTS_PER_WEEK` dan `DEFAULT_PIKET_FINE_AMOUNT` dipindah ke `lib/utils/piket-date.ts` agar build lolos aturan Next.js (hanya fungsi async boleh diekspor).

## [0.8.5] - 2026-09-12

### Added

- **Opsi Pembayaran Manual Bank Transfer + Verifikasi Admin (`lib/actions/event-registration.ts`, `lib/actions/event-admin.ts`, `components/event/manual-payment-verification-list.tsx`)**: mode pembayaran global (`midtrans` vs `manual_bank`) pada `event_settings`, instruksi transfer + upload bukti pada `/mrc/bayar/[token]`, halaman verifikasi admin pada `/manajemen-event/verifikasi-pembayaran` (setujui/tolak + alasan penolakan), serta notifikasi email instruksi, persetujuan (dengan link grup WA kategori), dan penolakan.
- **Dukungan Multi Rekening Bank (`components/event/event-settings-form.tsx`, `components/event/qris-payment-view.tsx`, `supabase/migrations/20260912000000_add_multiple_bank_accounts.sql`)**: admin dapat mengonfigurasi beberapa rekening (mis. BRI, BCA, BNI), peserta memilih rekening tujuan, dan email instruksi memuat seluruh daftar rekening.
- **Formulir Pendaftaran Berbasis Kategori + Tanggal Lahir (`components/event/registration-form.tsx`, `lib/schemas/event-registration.ts`, `supabase/migrations/20260914000000_add_birth_date_to_event_team_members.sql`)**: diferensiasi field formulir per kategori lomba, kolom `birth_date` pada `event_team_members`, dan penyesuaian tabel registrasi admin.

### Fixed

- **Tabrakan Versi Migrasi `20260911000000` (Local vs Cloud)**:
  - Versi `20260911000000` dipakai dua file berbeda: `add_payment_mode_and_manual_bank.sql` (sudah terlanjur di-push ke cloud dari feature branch) vs `create_review_midtrans_tables.sql` (di `main`), sehingga tabel `review_registrations`/`review_transactions` tidak pernah dibuat di cloud meski versi tercatat applied.
  - Mengimpor `20260911000000_add_payment_mode_and_manual_bank.sql` dan `20260912000000_add_multiple_bank_accounts.sql` dari branch `feature/mrc-manual-bank-payment` agar riwayat lokal selaras dengan skema cloud (kolom `payment_mode`, `bank_*`, `bank_accounts`, `whatsapp_group_url`, `rejection_reason`).
  - Me-rename migrasi review menjadi `20260913000000_create_review_midtrans_tables.sql` agar menjadi pending dan teraplikasi via `db push`.
  - **Terverifikasi pasca-push**: `migration list` 32/32 sinkron (termasuk `20260912` & `20260913`); dump katalog remote memuat `review_registrations`/`review_transactions` beserta policy-nya dan kolom `payment_mode`, `bank_*`, `bank_accounts`, `whatsapp_group_url`, `rejection_reason`; sisa diff hanya noise representasi (badan fungsi identik semantik) sehingga tidak di-push.
- **Tipe Status Webhook Midtrans (`app/api/webhooks/midtrans/route.ts`)**: `newStatus` diselaraskan ke tipe global `PaymentStatus` agar `pnpm build` lolos type-check untuk seluruh status (`unpaid`, `pending_verification`, `rejected`, dll.).
- **Regenerasi Tipe Database (`types/database.types.ts`)**: sinkronisasi hasil `supabase gen types` — kolom `event_categories.whatsapp_group_url`, `event_registrations.rejection_reason`, serta `event_settings.payment_mode`, `bank_name`, `bank_account_number`, `bank_account_holder`.
- **Fixture Uji `EventSettings` (`lib/event-batch.test.ts`)**: melengkapi field baru (`payment_mode`, `bank_*`, `bank_accounts`) agar `tsc --noEmit` dan pre-commit hook lolos.
- **Resolusi Konflik Merge `develop` ke `main`**: mengembalikan seksi `0.8.4` (halaman review Midtrans) yang sempat hilang akibat resolusi konflik, sehingga riwayat rilis tetap utuh.

## [0.8.4] - 2026-09-10

### Added

- **Halaman Review Midtrans Tersembunyi untuk Verifikasi Sandbox (`app/(marketing)/review-midtrans/page.tsx`)**: Halaman terisolasi `/review-midtrans` berisi 6 kategori lomba simulasi, form input peserta, dan integrasi skrip Midtrans Snap Sandbox dengan harga fixed Rp100.000 untuk keperluan Tim Verifikator/Business Reviewer Midtrans.
- **Isolasi Data & API Review Midtrans**:
  - **Migrasi database (`supabase/migrations/20260911000000_create_review_midtrans_tables.sql`)**: tabel terisolasi `review_registrations` & `review_transactions` agar data review tidak mencampuri data pendaftaran MRC produksi.
  - **Helper Midtrans (`lib/midtrans.ts`)**: pembuatan transaksi Snap dan verifikasi signature SHA-512.
  - **Checkout API (`app/api/review-midtrans/checkout/route.ts`)**: endpoint terisolasi pembuatan transaksi Snap review.
  - **Webhook notifikasi (`app/api/review-midtrans/notification/route.ts`)**: endpoint notifikasi pembayaran review yang aman.
  - **Panduan pengujian (`docs/midtrans-review-instructions.md`)**: dokumentasi setup environment dan alur testing Sandbox.
- **Penyesuaian Offset Sticky Navbar Halaman Review Midtrans (`app/(marketing)/review-midtrans/page.tsx`)**: menambahkan top padding (`pt-16 sm:pt-20`) pada kontainer halaman serta penyesuaian offset sticky header/sidebar agar tidak tertutup `LandingNavbar` yang fixed.

### Changed

- **Pembaruan Desain UI/UX & Dark Mode Halaman Review Midtrans (`app/(marketing)/review-midtrans/page.tsx`)**:
  - Mengubah seluruh warna hardcoded Tailwind (`bg-slate-50`, `bg-blue-900`, `text-slate-900`, `border-slate-200`) menjadi token semantik `DESIGN.md` (`bg-background`, `bg-card`, `bg-secondary`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`).
  - Menyelaraskan mode gelap (Dark Mode) menggunakan _Deep Navy Slate_ (`#0f1b2d`) dan aksen Oranye Soft (`#f0975a`).
  - Mengoptimalkan responsivitas layout seluler hingga desktop, penyesuaian font tipografi (`font-display` & `font-mono`), serta memastikan target sentuh minimal 44px (`min-h-[44px]`).

## [0.8.3] - 2026-09-08

### Added

- **Tanggal Rilis Timeline MRC (`supabase/migrations/20260910000000_add_timeline_release_and_technical_meeting.sql`)**: Menambahkan kolom `timeline_release_date`, `technical_meeting_start`, dan `technical_meeting_end` pada tabel `event_settings` beserta constraint rentang tanggal.
- **Aturan Visibilitas Progresif Batch 2 & Timeline (`lib/event-batch.ts`, `lib/schemas/event-registration.ts`)**:
  - Deteksi fase `coming-soon` sebelum `timeline_release_date`.
  - Helper `isTimelineReleased()` dan `isBatch2Visible()` untuk menyembunyikan jadwal dan nominal Batch 2 hingga Batch 1 selesai atau Batch 2 dibuka.
- **Pembaruan FAQ Pendaftaran MRC (`components/event/mrc-faq.tsx`)**: Menyinkronkan daftar FAQ MRC dengan aturan registrasi, alur verifikasi, dan jadwal pelaksanaan terbaru.

### Changed

- **Penyembunyian Informasi Sebelum Timeline Release (`app/(marketing)/mrc/page.tsx`)**: Menyesuaikan tampilan halaman MRC untuk menyembunyikan status kuota, biaya Batch 1 & 2, serta timeline detail sebelum tanggal rilis resmi.

### Removed

- **Seksi Unduh Rulebook MRC (`app/(marketing)/mrc/page.tsx`)**: Menghapus tombol/seksi unduh Rulebook pada landing page MRC sesuai skema rilis terbaru.

## [0.8.2] - 2026-09-08

### Added

- **Tipe Global Midtrans Snap Window (`types/midtrans-client.d.ts`)**: Menambahkan interface `Window.snap` untuk dukungan pembayaran Midtrans Snap fallback/popup.
- **Dukungan Snap Token & Dynamic QRIS (`lib/services/midtrans.ts`, `lib/actions/event-registration.ts`)**: Integrasi transaksi Snap token opsional pada pembuatan transaksi pendaftaran event.

### Changed

- **Penyelarasan Komponen Pembayaran QRIS (`components/event/qris-payment-view.tsx`)**: Peningkatan UX indikator status, timer kedaluwarsa QRIS, dan penanganan status transaksi.
- **Pembaruan Timestamp Migrasi Database (`supabase/migrations/20260906000000_create_event_registration_and_payment_system.sql`)**: Menyelaraskan urutan migrasi sistem pendaftaran event dan skema transaksi Midtrans.

## [0.8.0] - 2026-09-07

### Added

- **Pipeline Validasi Gambar MRC Server-Side (Magic Bytes + Sharp + R2)**:
  - **Konfigurasi tunggal (`lib/mrc-image-config.ts`)**: batas tipe/ukuran/varian dipakai bersama client & server agar tidak drift.
  - **Pipeline server (`lib/server/mrc-image-pipeline.ts`)**: validasi otoritatif berbasis magic bytes via `file-type` (`File.type` browser tidak dipercaya), proteksi decompression-bomb, normalisasi EXIF → WebP (varian utama + thumbnail) via `sharp`, upload ke Cloudflare R2.
  - **Rate limiter upload MRC (`lib/redis.ts`)**: `mrcUploadRateLimiter` 30 req/10 mnt untuk endpoint publik tanpa auth.
  - **Pengerasan client (`components/event/registration-form.tsx`)**: validasi awal tipe/ukuran, konversi HEIC/HEIF → JPEG via `heic2any`, kompresi ringan via `browser-image-compression`, pratinjau `next/image`.
  - **Unit test (`lib/server/__tests__/mrc-image-pipeline.test.ts`)**: PNG/JPEG valid lolos, file samaran & HEIC mentah ditolak, output terdeteksi WebP via magic bytes.
- **Halaman Pembayaran QRIS Dinamis (`app/(marketing)/mrc/bayar/[token]/page.tsx` + `components/event/qris-payment-view.tsx`)**: menggantikan popup Midtrans Snap; QR dinamis per nominal batch via Core API, countdown kedaluwarsa, polling status 5 detik + auto-redirect ke E-Tiket saat lunas, tombol buat QR baru via `refreshQrisChargeAction`.
  - **Migrasi database (`supabase/migrations/20260909000000_add_qris_payment_columns.sql`)**: kolom `midtrans_qr_url` & `midtrans_qr_expiry` (kolom snap lama dipertahankan untuk histori).
- **Token Semantik Success/Warning (`app/globals.css`)**: `--color-success(-soft)` & `--color-warning(-soft)` light/dark sesuai DESIGN.md §3.3 (nilai teks disesuaikan agar lolos kontras WCAG AA 4.5:1).
- **Dokumentasi env email (`README.md`)**: variabel `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, dan SMTP/Mailpit untuk E-Tiket MRC beserta catatan verifikasi domain pengirim.

### Changed

- **Server Actions upload foto MRC (`lib/actions/event-registration.ts`)**: `uploadMemberPhotoAction` & `uploadMemberIdentityCardAction` tidak lagi upload mentah ke Supabase Storage — kini lewat pipeline R2 + rate limit.
- **Migrasi pembayaran ke QRIS-only (`lib/actions/event-registration.ts`, `lib/services/midtrans.ts`)**: `registerEventAction` membuat Core API charge `payment_type: "qris"`; helper Snap yang mati dihapus; skrip `snap.js` tidak lagi dimuat di halaman daftar.
- **Kepatuhan DESIGN.md halaman MRC (`mrc/page`, `mrc/[slug]/daftar`, `mrc/tiket/[token]` + 8 komponen)**: seluruh warna hardcoded (`slate-*`, `emerald/amber/rose-*`, hex mentah) → token semantik dengan dark-mode penuh; class mati `bg-accent-soft/*` diperbaiki; heading ke skala `clamp()` + `text-balance`; radius kartu ke 10px; touch target ≥44px + focus ring; accordion FAQ dapat `aria-expanded`.
- **Template email E-Tiket (`lib/services/resend.ts`)**: font Inter/Plus Jakarta Sans + monospace untuk kode (tetap inline-style karena klien email); badge selaras token success/warning-soft; tombol Deep Accent `#9a5b30` agar teks putih lolos kontras.

### Fixed

- **Email lunas webhook Midtrans (`app/api/webhooks/midtrans/route.ts`)**: menambahkan `paymentStatus: "paid"` yang hilang sehingga peserta yang berhasil bayar tidak lagi menerima email "menunggu pembayaran".
- **Typo status E-Tiket (`components/event/e-ticket-view.tsx`)**: "Cadars" → "Dibatalkan"; `<img>` → `next/image` (+ `remotePattern quickchart.io` & host API Midtrans di `next.config.ts`).

## [0.7.1] - 2026-08-31

### Added

- **Penguraian & Pratinjau Dokumentasi Piket Kebersihan (Sebelum vs Sesudah)**:
  - **Pemisahan Tombol Pratinjau Foto (`components/features/piket/piket-client.tsx`)**: Menyiapkan tombol **Sebelum** (Navy Soft) dan **Sesudah** (Emerald Soft) pada tampilan tabel desktop dan kartu mobile riwayat piket.
  - **Modal Pratinjau Foto Interaktif dengan Tab Switcher (`components/features/piket/piket-client.tsx`)**: Menyediakan fitur pergantian tampilan foto Sebelum dan Sesudah secara langsung di dalam modal dialog tanpa perlu menutup dialog.
  - **Dukungan Format Foto iPhone (HEIC/HEIF) & Kompresi Client (`lib/utils/image-processing.ts`)**: Integrasi konversi otomatis format `.heic` / `.heif` ke `.jpg` via `heic2any` dan kompresi di bawah 800 KB dengan preservasi EXIF `DateTimeOriginal`.

### Changed

- **Server-Side API Proxy R2 Idempotency (`lib/storage/r2.ts`)**:
  - Memperbarui fungsi `getPublicR2Url()` agar membersihkan (_strip_) prefix `/api/r2/` atau `api/r2/` berulang untuk mencegah duplikasi URL `/api/r2/api/r2/...`.
  - Memastikan seluruh pratinjau foto piket disalurkan via Server-Side Proxy (`/api/r2/[...key]`), 100% bebas dari pemblokiran ISP / Kominfo pada domain `*.r2.dev`.
- **Penyelarasan Kueri PostgREST dengan Skema Database (`app/(private)/piket/page.tsx`)**:
  - Menyelaraskan kueri Supabase `piket_logs` dan `piket_schedules` dengan skema resmi di `types/database.types.ts` untuk mengeliminasi error `PGRST204` _(column not found)_.
  - Mengimplementasikan helper `parsePiketLogDetails()` untuk mengurai string log lama `Before URL: ... | After URL: ... | Notes: ...` secara otomatis sehingga kolom Catatan tampil bersih dari URL raw.

### Fixed

- **Resolusi RLS Policy Modul Piket (`supabase/migrations/20260831003000_fix_piket_logs_rls.sql` & `20260831004000_piket_logs_read_only.sql`)**:
  - Mengizinkan pengiriman laporan piket bagi petugas piket terdaftar tanpa membatasi role khusus `anggota`.
  - Mengamankan tabel `piket_logs` menjadi _Read-Only_ penuh untuk seluruh role (mengizinkan `SELECT` untuk semua pengguna terautentikasi dan melarang `UPDATE`/`DELETE`).
- **Aksessibilitas Dialog Modal Radix UI (`components/features/piket/piket-client.tsx`)**: Menambahkan `DialogDescription` pada modal pratinjau foto piket untuk menghilangkan peringatan konsol React DevTools.

### Added

- **Enum Status Presensi "Magang" (Dispensasi PKL / Magang Luar)**:
  - **Database Migration (`supabase/migrations/20260830100000_add_magang_attendance_status.sql`)**: Menambahkan nilai `'magang'` ke enum PostgreSQL `public.attendance_status`.
  - **Type System & Schema Validation (`types/database.types.ts`, `lib/types/supabase.ts`, `lib/schemas/komdis.ts`)**: Menyinkronkan type definitions dan Zod schema `ManualAttendanceSchema` untuk menerima status `"magang"`.
  - **Auto-Assign Status & Dispensasi 0 Poin (`lib/actions/komdis.ts`)**:
    - Deteksi otomatis anggota aktif yang berstatus `is_on_internship == true` pada rentang jadwal kegiatan sebagai `"magang"`.
    - Menetapkan **0 Poin Sanksi** secara otomatis untuk status `"magang"`.
  - **UI & Telemetri Presensi (`activity-attendance-detail-client.tsx`, `komdis-activity-attendance-tab.tsx`, `komdis-member-attendance-tab.tsx`, `personal-attendance-tab.tsx`)**:
    - Menambahkan widget telemetri `MAGANG` (Purple Accent), badge **MAGANG** berdesain Purple Soft, opsi dropdown filter status, dan opsi presensi manual pada Drawer Komdis.
    - Menambahkan indikator `M` (Magang) pada matriks rekap presensi per kegiatan dan per anggota Komdis.

- **Restrukturisasi & Pemisahan Domain Modul Kegiatan (CRUD) vs Presensi (Absensi)**:
  - **Sub-Rute Presensi `/presensi/[id]` & Pemindai QR (`app/(private)/presensi/[id]/page.tsx`)**:
    - Membuat halaman rekapitulasi detail presensi kegiatan Komdis di `/presensi/[id]`.
    - Pemisahan domain tampilan Scanner QR Komdis dan Presensi Diri peserta.
  - **Tombol Pintasan Presensi Berbasis Jendela Waktu (`components/features/kegiatan/kegiatan-client.tsx`)**:
    - Menambahkan tombol **"Presensi"** di sebelah tombol **"Detail"** pada daftar kegiatan.
    - Mengatur visibilitas tombol secara kondisional agar hanya muncul ketika waktu sekarang berada dalam rentang jendela presensi (`checkin_open_at` s/d `checkin_close_at`).

### Changed

- **Formulasi Rasio Presensi (%) (`lib/actions/komdis.ts`)**:
  - Memperbarui kueri `getActivityAttendanceDetail` dan `getKomdisActivityAttendanceSummary` agar anggota berstatus `magang` dipisahkan dari penyebut perhitungan kehadiran:
    $$\text{Rasio Presensi} = \frac{\text{Hadir} + \text{Telat}}{\text{Total Anggota} - \text{Total Magang}} \times 100\%$$
- **Penyederhanaan Tampilan Pemindai Scanner Komdis (`components/features/komdis/komdis-scanner-view.tsx`)**:
  - Menghapus modal pop-up "Override Manual" dan tombol "Batch Alfa" yang berlebih pada tab scanner Komdis.
  - Menghapus folder/file redundant `/app/(private)/presensi/[id]/absensi` dan `/app/(private)/presensi/[id]/presensi`.

### Fixed

- **Sanitasi Foto Profil Anggota & Custom Type Guard TypeScript (`url is string`)**:
  - Menyaring string bawaan `"Belum Diisi"`, `"null"`, `"undefined"`, `-` pada _backend action_ (`lib/actions/komdis.ts` & `lib/actions/activities.ts`).
  - Mengimplementasikan Custom Type Guard `isValidImageUrl(url): url is string` pada komponen UI presensi untuk mengeliminasi crash `TypeError: Failed to construct 'URL': Invalid URL` dan kompilasi error TypeScript `TS2322`.

## [0.6.1] - 2026-08-29

### Fixed

- **Resolusi Izin Perubahan Peran Pengguna (Role Mutation Exception Fix)**:
  - **Database Migration (`supabase/migrations/20260829094500_fix_protect_profile_role_update_service_role.sql`)**: Memperbarui fungsi trigger `protect_profile_role_update()` di PostgreSQL agar mengizinkan pemanggilan yang menggunakan `service_role` key (`auth.role() = 'service_role'`).
  - **Perbaikan Perizinan Server Action (`lib/actions/admin-users.ts`)**: Menyelesaikan masalah kegagalan memperbarui profil/role pengguna oleh Super Admin yang sebelumnya memicu error `Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.` saat menggunakan client `adminDb`.

## [0.6.0] - 2026-08-29

### Added

- **Pemisahan Poin Awal/Manual vs Pemutihan Gotong Royong (Goro) Kedisiplinan**:
  - **Database View (`supabase/migrations/20260828220000_update_v_user_discipline_summary.sql`)**: Memperbarui view `v_user_discipline_summary` untuk memisahkan agregasi poin penambahan sanksi bawaan / manual (`total_legacy_points` > 0) dan poin pengurangan sanksi melalui goro (`total_goro_points` < 0) dari poin presensi (`total_attendance_points`).
  - **Direktori Kedisiplinan (`components/features/komdis/kedisiplinan-client.tsx` & `app/(private)/kedisiplinan/page.tsx`)**: Menampilkan kolom tabel terpisah antara "Poin Awal/Manual" (+X PTS) dan "Pemutihan Goro" (-X PTS) serta metrik netto yang transparan.
  - **Halaman Detail Kedisiplinan Anggota (`components/features/komdis/member-discipline-detail-client.tsx`)**: Menampilkan ringkasan telemetri breakdown live dan tab log terpisah.
- **Preset Sanksi Keterlambatan SOP Komdis & Modal Pop-up Scanner Instan**:
  - **QR Scanner Komdis (`components/features/komdis/komdis-scanner-view.tsx` & `lib/actions/komdis.ts`)**: Integrasi pop-up modal penetapan sanksi instan saat scan anggota yang terlambat $\ge 60$ menit, lengkap dengan pilihan cepat SOP Komdis:
    - 🏃 Sanksi Fisik Saja (0 PTS)
    - 📋 Fisik + Izin Diterima (+3 PTS)
    - ⚠️ Fisik + Izin Ditolak / Tanpa Izin (+5 PTS)
    - ✏️ Kustom Angka Poin & Catatan Sanksi.
  - **Drawer Presensi Manual (`components/features/presensi/activity-attendance-detail-client.tsx`)**: Menyediakan tombol preset cepat sanksi keterlambatan yang sama pada form presensi manual kegiatan.
  - **Alur Scan Berkelanjutan**: Petugas Komdis dapat langsung menyimpan sanksi dan melanjutkan scan QR peserta berikutnya tanpa perlu beralih ke halaman rekap.

### Fixed

- **PostgreSQL View Migration Fix (`supabase/migrations/20260828220000_update_v_user_discipline_summary.sql`)**: Memperbaiki migrasi view dengan menambahkan `DROP VIEW IF EXISTS ... CASCADE` sebelum re-create view guna menghindari error `SQLSTATE 42P16` saat `db push`.
- **Type Definitions Synchronization (`types/database.types.ts`)**: Regenerasi TypeScript database types untuk menyelaraskan skema database terbaru.

## [0.5.0] - 2026-08-26

### Added

- **Redesign Halaman Publik & Landing Pages (Clean Institutional Standard)**:
  - **Navbar & Footer (`components/landing/navbar.tsx`, `components/landing/footer.tsx`)**: Navigasi institusional modern dengan active route indicator, mobile drawer sheet, live system status, dan kontak resmi.
  - **Halaman Beranda (`app/(marketing)/page.tsx`)**: Mengimplementasikan 5 section baru sesuai `RANCANGA_CONTENT_BERANDA.md` (Hero CAD visual, 4 kartu metric stats, 5 divisi KRI + Join card, 5 siklus timeline operasional, dan CTA).
  - **Halaman Profil (`app/(marketing)/profil/page.tsx`)**: Desain ulang hero, moto/slogan bento grid, visi & misi dual card, timeline sejarah organisasi, dan struktur pimpinan BPH.
  - **Halaman Divisi (`app/(marketing)/divisi/page.tsx`)**: Grid 3 kolom divisi robotik dengan badge spesifikasi, icons, dan link eksplorasi divisi.
  - **Halaman Prestasi (`app/(marketing)/prestasi/page.tsx`)**: Sticky search & filter bar, badge capaian kompetisi, CAD watermark header, dan layout responsif.
  - **Halaman Keanggotaan (`app/(marketing)/keanggotaan/page.tsx`)**: Struktur hirarki Pengurus Harian Inti, Badan Ad-Hoc, dan Departemen accordion dengan optimasi `next/image` avatar.
  - **Halaman Artikel & Berita (`app/(marketing)/artikel/page.tsx`)**: Featured article hero card, sticky category filter bar, 3-column article grid, dan badge semantik.
  - **Halaman Hubungi Kami (`app/(marketing)/hubungi-kami/page.tsx`)**: Split layout 5:7 dengan kartu kontak resmi, tautan media sosial Hugeicons, Google Maps interaktif, dan form kirim pesan terproteksi honeypot.
- **Redesign Portal Autentikasi (`app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`)**:
  - Peningkatan ukuran touch target form input & tombol minimal 44px (`min-h-[44px]`).
  - Indikator kekuatan kata sandi 4-segmen responsif pada registrasi akun baru.
  - Integrasi Cloudflare Turnstile bot protection dan error alert terstandarisasi.
- **Dokumentasi Operasional & Arsitektur Baru**:
  - `docs/04-process-view/SOP_KEGIATAN_KOMDIS.md`: Standar operasional prosedur kegiatan, absensi QR, dan sanksi Komdis.
  - `docs/architecture-event-registration-payment.md`: Spesifikasi arsitektur registrasi event & pembayaran.

### Changed

- **Optimalisasi SEO & Tipografi Global**:
  - Mengonfigurasi font Plus Jakarta Sans (`--font-display`), Inter (`--font-body`), dan Geist/System Mono (`--font-mono`).
  - Menyelaraskan OpenGraph metadata dan skema Organization JSON-LD pada layout root dan marketing.
- **Peningkatan Dashboard Super Admin Terpadu & Real-Time Telemetry (`app/(private)/dashboard/page.tsx` & `components/features/dashboard/dashboard-client.tsx`)**:
  - Menyajikan telemetri operasional cepat: Total Pengguna Aktif & Terarsip, Dispensasi Pending Komdis, Tugas Caang Menunggu Penilaian OR, dan Sanksi SP Aktif.
  - Menampilkan panel status kepatuhan keamanan dan immutability trigger UU PDP No. 27/2022.
  - Menambahkan pusat kendali & pintasan cepat (Quick Access Hub) ke 6 modul utama (Akun, Struktur, Audit Log, Kegiatan, Disiplin, Piket).
  - Menampilkan live feed 5 log mutasi audit terbaru lengkap dengan nama aktor, role, tipe aksi, target, timestamp, dan IP address.
  - Menampilkan agenda kegiatan organisasi terdekat lengkap dengan waktu dan lokasi.

### Added

- **Penguatan Sistem Audit Log Sistem (100% Immutable, Resilient, & Compliant UU PDP 27/2022)**:
  - **Database Immutability Trigger (`supabase/migrations/20260824150000_audit_log_immutability_and_triggers.sql`)**: Menambahkan trigger PL/pgSQL `prevent_audit_log_tampering()` pada tabel `public.system_audit_logs` untuk mencegah segala bentuk `UPDATE` dan `DELETE` di level database engine.
  - **Index Performa Database**: Menambahkan indeks komposit pada `actor_id`, `target_user_id`, `action_type`, dan `created_at DESC`.
  - **Utilitas Audit Terpusat (`lib/audit.ts`)**: Modul audit logger terpusat dengan penangkapan alamat IP request (`x-forwarded-for`/`x-real-ip`) dan sanitasi penyamaran data pribadi PII (Nomor Telepon `0812-****-5678`, NIM `240104****`, Email `u***r@domain.com`, dan `[REDACTED_SECRET]`).
  - **Integrasi Audit Lintas Modul**: Menghubungkan pencatatan audit log otomatis ke modul Manajemen Pengguna (`admin-users.ts`), Pengaturan Akun (`settings.ts`), Komisi Disiplin & Sanksi SP (`komdis.ts`), dan Struktur Organisasi (`structure.ts`).
  - **UI Viewer Audit Log Modern (`components/admin/audit-log/audit-log-viewer.tsx` & `app/(private)/audit-log/page.tsx`)**: Menampilkan relasi nama aktor, role badge, nama target, badge IP address, dan inspeksi diff data JSON interaktif.
- **Relokasi & Redesign Komponen Struktur Organisasi (`components/structure/structure-client.tsx`)**:
  - Memindahkan komponen client dari `app/(private)/manajemen-struktur/StructureClient.tsx` ke direktori `components/structure/`.
  - Desain ulang seluruh UI Manajemen Struktur sesuai `DESIGN.md` (Minimalist Soft Light, 70-20-10 color rule, touch target $\ge 44\text{px}$, scrollable tabs, dan adaptasi dark mode).
- **Pembaruan Konfigurasi AI Engineering `AGENTS.md`**:
  - Memperbarui sistem panduan AI native dengan stack Next.js 16.2.5, React 19.2.4, Tailwind CSS v4 `@theme`, Supabase SSR, Upstash, Turnstile, RBAC matrix, dan aturan anti-pattern.

### Changed

- **Redesign Halaman Manajemen Akun (`app/(private)/manajemen-akun/page.tsx` & `components/admin/users/`)**:
  - Mengubah hero banner menjadi soft minimalist card berbingkai tipis (`border-border bg-card text-card-foreground`).
  - Menyelaraskan seluruh toolbar pencarian, filter role/status, tabel pengguna, badge role pastel semantik, pagination, dan 4 modal dialog (Detail PII, Edit User, Soft Delete, Restore) dengan token `app/globals.css` dan Hugeicons.
  - Menstandarisasi area sentuh tombol dan elemen interaktif minimal $44\text{px}$ (`min-h-[44px]`).

### Fixed

- **Perbaikan Update Program Studi & Kontak Pengguna pada Manajemen Akun (`lib/actions/admin-users.ts`)**:
  - Menambahkan migrasi RLS `20260824140000_allow_admin_manage_registrations.sql` agar Super Admin dan Admin OR memiliki izin penuh mutasi (INSERT, UPDATE, DELETE) pada tabel `public.registrations`.
  - Mengimplementasikan mekanisme _upsert / fallback insert_ otomatis di `updateUserIdentityAction` jika record registrasi pengguna target belum ada.
  - Memperbaiki jalur revalidasi cache Next.js (`revalidatePath("/manajemen-akun")`) dan menambahkan `router.refresh()` pada modal dialog client untuk pembaruan data seketika.

### Added

- **Instant Skeleton Loading Navigasi Sidebar (`app/(private)/loading.tsx` & `app/(private)/kegiatan/loading.tsx`)**:
  - Menambahkan Skeleton UI responsif yang langsung dirender secara seketika saat pengguna mengklik menu sidebar (mencegah UI terasa beku/freeze saat server component melakukan fetching data).
  - Penutupan otomatis drawer mobile sidebar (`SheetContent`) seketika saat menu navigasi diklik (`components/shared/sidebar.tsx`).
- **Dokumentasi Terpadu Root `README.md`**:
  - Menambahkan file `README.md` lengkap di root proyek yang mencakup deskripsi sistem, panduan instalasi local dev, variabel lingkungan (`.env.local`), struktur repositori, dan matriks RBAC.
- **Pembaruan Peranan Pengguna RBAC (7 Roles)**:
  - Menambahkan rincian peranan `admin-kestari` (pengelola piket kesekretariatan & workshop) dan `admin-divisi` (pengelola magang divisi caang).
  - Mengklarifikasi cakupan modul `admin-komdis` (fokus kedisiplinan, perizinan, dan poin sanksi, tidak mengurus piket workshop).
- **Integrasi Storage Cloudflare R2 untuk Dokumen Perizinan**:
  - Menambahkan modul koneksi S3-compatible Cloudflare R2 (`lib/storage/r2.ts`) untuk pengunggahan file dokumen bukti surat izin / sakit ke bucket `ukm-robotik-pnp`.
  - Integrasi fitur client-side image compression & konversi otomatis ke format **WebP** (`lib/utils/image-compressor.ts`) sebelum pengiriman form perizinan (`components/features/komdis/anggota-qr-view.tsx`).
  - Pembuatan API Proxy Route internal (`app/api/r2/[...key]/route.ts`) untuk menyajikan foto bukti R2 secara aman dan bebas dari pemblokiran ISP / Connection Time Out pada domain `*.r2.dev`.
- **Panduan Dokumentasi Komdis Kedisiplinan (`docs/PANDUAN_KOMDIS_KEDISIPLINAN.md`)**: Panduan operasional komprehensif bagi Admin Komdis untuk pengelolaan kegiatan, presensi QR / manual, verifikasi perizinan, alfa massal, hingga sanksi & pemutihan poin.
- **Halaman Detail Kegiatan (`/kegiatan/[id]`)**: Menambahkan rute halaman detail kegiatan responsif untuk menangani navigasi notifikasi dan link kegiatan, mencegah error 404 ketika pengguna mengklik notifikasi kegiatan.
- **Halaman 404 Kustom (`app/not-found.tsx`)**: Menambahkan halaman error 404 dengan desain Minimalist Soft yang responsif dan ramah seluler.

### Changed

- **UI Drawer Pratinjau Bukti Perizinan (`components/features/komdis/leave-approval-dashboard.tsx`)**:
  - Mengubah modal pop-up pratinjau foto bukti perizinan menjadi `Drawer` responsif mobile-first selaras dengan panduan `DESIGN.md`.
  - Menambahkan **Loading Skeleton** dan UI fallback _error handling_ jika gambar mengalami kendala jaringan/timeout.
- **Restriksi Jendela Waktu Presensi (`checkin_open_at` s/d `checkin_close_at`)**:
  - Memperbarui antarmuka `ActivityItem` (`lib/actions/activities.ts`) dan query `getActivities` untuk menyertakan `checkin_open_at`, `checkin_close_at`, dan `late_tolerance_minutes`.
  - Mengubah fungsi `isAttendanceWindowActive` pada `kegiatan-client.tsx` dan `app/(private)/kegiatan/[id]/page.tsx` agar tombol **Absen** hanya dapat diakses dalam rentang waktu dari `checkin_open_at` hingga `checkin_close_at`.
- **Modul QR Code Presensi Real-Time Ramah Supabase Free Plan**:
  - Mengimplementasikan Smart Short Polling berbasis database Supabase biasa pada `AnggotaQrView` (`components/features/komdis/anggota-qr-view.tsx`).
  - Mengoptimalkan kueri dengan jeda adaptif (interval 4 detik, maksimal 30x percobaan / 2 menit per sesi aktif).
  - Menghentikan pemanggilan API secara otomatis saat peramban/tab disembunyikan (`visibilityState === 'hidden'`) atau setelah status presensi terdeteksi (`hadir`/`telat`/`izin`/`sakit`).
  - Menambahkan _listener_ `visibilitychange` untuk mengecek ulang status presensi secara instan saat tab peramban diaktifkan kembali oleh pengguna.

### Fixed

- **Resolusi Query RBAC/RLS Halaman Perizinan Komdis (`app/(private)/perizinan/page.tsx`)**:
  - Menggunakan `createAdminClient()` untuk membaca data antrean perizinan Komdis tanpa terhalang RLS policy `target_audience`.
  - Menentukan spesifikasi foreign key eksplisit `profiles:profile_id!inner` untuk menyelesaikan error ambiguitas relasi PostgREST (_"more than one relationship was found for 'attendances' and 'profiles'"_).
  - Memperbaiki resolver URL proxy `/api/r2/[key]` agar penayangan foto bukti perizinan di browser anggota dan admin berjalan 100% lancar.
- **Soft Delete Filtering pada Kegiatan**: Memastikan seluruh kueri kegiatan di server (`getActivities`) dan client menggunakan filter `.is("deleted_at", null)` agar kegiatan yang masuk ke tempat sampah tidak tampil di halaman kegiatan role mana pun (`super-admin`, `admin-komdis`, `admin-or`, `anggota`, `caang`).
- **Form Pembuatan Kegiatan Komdis (`create-komdis-activity-dialog.tsx`)**:
  - Memperbaiki perataan UI teks label kegiatan formal Komdis agar sejajar rata kiri dengan petunjuk target audience.
  - Memperbaiki fungsionalitas pemilih tanggal/waktu (popover kalender) dan input teks manual pada input datetime agar dapat digunakan secara fleksibel.

## [0.3.0] - 2026-08-15

### Added

- Redesign keseluruhan design system ke tema **Minimalist Soft (Light)** pada `DESIGN.md`: prinsip warna 70% netral / 20% warna utama (Navy lembut `#3b5b84`) / 10% aksen (Oranye lembut `#f0975a`), skala font mobile-first berbasis `clamp()`, dan aturan radius (Card 10px, Button/Input 8px, Pill 9999px).
- Token desain baru di `app/globals.css` (Tailwind v4 `@theme inline`): `--color-canvas`, `--color-surface`, `--color-text-primary/secondary/muted`, `--color-primary-hover`, `--color-primary-soft`, `--color-accent-strong`, `--shadow-soft`, `--shadow-ring`, skala `--text-micro` hingga `--text-2xl`, dan `--radius-md/lg/pill`. Dark mode kini ditangani otomatis via CSS variables (tanpa override manual `dark:`), dengan Oranye menjadi warna utama di tema gelap agar tetap kontras.
- Halaman publik baru Kebijakan Privasi (`/privacy`) dan Syarat & Ketentuan Layanan (`/terms`) dengan layout publik ber-pola Minimalist Soft.
- Komponen Shadcn UI baru: `AlertDialog`, `Drawer`, `Empty`, `Separator`, `Sheet`, `Field`, dan `Spinner`.
- Redesign `components/shared/header.tsx` berbasis Shadcn UI primitives (`Popover`, `DropdownMenu`, `Avatar`, `Badge`, `InputGroup`, `Separator`, `Skeleton`, `Empty`) dengan pendekatan mobile-first: panel notifikasi `Popover` (width responsif `max-w-[calc(100vw-2rem)]`), menu akun `DropdownMenu`, avatar fallback dengan `AvatarFallback`, tombol ikon `size="icon-lg"`, dan pemisah vertikal `Separator`.
- Redesign `components/shared/sidebar.tsx` berbasis Shadcn UI: drawer mobile memakai `Sheet` (side `left`, `w-72`) menggantikan drawer framer-motion custom, skeleton loading memakai `Skeleton`, aktif state memakai `bg-primary-soft` + indikator batang kiri `bg-primary`, serta pembagian komponen reusable `BrandLink`, `NavLink`, `SidebarNav`, dan `SettingsLink`.
- Redesign `components/shared/page-loader.tsx` dengan motion animasi halus dan penyesuaian font `font-display`.

### Changed

- Redesign `app/globals.css`: penggantian seluruh token lama (`dongker-*`, `pnp-orange`, `orange-wash`, `blueprint-*`, `mist-gray`, `steel-gray`, `canvas-white`, `shadow-blueprint`) dengan token semantik yang otomatis menyesuaikan light/dark mode.
- Redesign modul Autentikasi (`app/(auth)/layout.tsx` & `components/features/auth/`): layout split-screen dengan hero header _"Portal UKM Robotik PNP"_, penyesuaian hirarki tipografi, serta redesign `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ForgotPasswordWaitingCard`, `UpdatePasswordForm`, `VerifiedCard`, dan `VerifyEmailCard` sesuai standar `DESIGN.md`.
- Redesign `components/features/kegiatan/kegiatan-client.tsx`, `components/features/komdis/create-komdis-activity-dialog.tsx`, dan `components/features/komdis/edit-komdis-activity-dialog.tsx` sesuai standar visual `DESIGN.md` (Card `bg-card`, `border-border`, `rounded-lg`, Badge pill `bg-accent text-accent-foreground`, tombol sekunder `border-primary text-primary`).
- Redesign `components/features/kegiatan/trash-activities-client.tsx` berbasis Shadcn UI (`Card` untuk mobile, `Table` + zebra-stripe `bg-surface` untuk desktop, `Empty` untuk state kosong, `AlertDialog` untuk konfirmasi hapus permanen) dengan token desain baru.

## [0.2.2] - 2026-08-14

### Fixed

- Perbaikan error _"captcha protection: request disallowed (no captcha_token found)"_ di production: token Turnstile kini dikirim langsung ke Supabase Auth (`captchaToken` di `options`) alih-alih diverifikasi server-side terlebih dahulu, karena token Turnstile bersifat one-time use dan tidak bisa di-consume dua kali (double-consume).

## [0.2.1] - 2026-08-14

### Added

- Workaround Supabase Free Plan: `lib/password-security.ts` — Leaked Password Protection via HaveIBeenPwned Pwned Passwords API (k-anonymity, password asli tidak pernah terkirim ke pihak ketiga).

### Changed

- Server Actions `register()`, `login()`, dan `updatePassword()` (`lib/actions/auth.ts`) — integrasi HIBP check sebelum `signUp()`, `signInWithPassword()`, dan `updateUser()` dengan strategi fail-open.
- Server Action `changePasswordAction()` (`lib/actions/settings.ts`) — integrasi HIBP check sebelum `updateUser()` dengan strategi fail-open.
- Zod schemas `registerSchema`, `updatePasswordSchema` (`lib/schemas/auth.ts`) dan `changePasswordSchema` (`lib/schemas/settings.ts`) — enforcing password complexity: huruf kecil + huruf besar + angka + simbol (sinkron dengan konfigurasi Supabase Dashboard).

## [0.2.0] - 2026-08-14

### Added

- Halaman Pengaturan Akun (`/settings`) dengan 5 tab utama (Profil, Keamanan, Preferensi, Keanggotaan, Privasi) dan Server Actions backend.
- Penanganan dispensasi magang/PKL untuk Anggota Aktif pada sistem presensi Komisi Disiplin (Komdis).
- Migrasi database `20260814000000_add_member_internship_status.sql` (kolom `is_on_internship`, `internship_start_date`, `internship_end_date`).
- Server Action `updateMemberInternshipStatus` untuk mengelola status magang anggota aktif khusus role `super-admin` dan `admin-komdis`.
- Skema validasi Zod `UpdateMemberInternshipSchema` di `lib/schemas/komdis.ts`.
- Komponen dialog `MemberInternshipModal` untuk menetapkan status & tanggal magang anggota secara interaktif.
- Indikator/badge `💼 MAGANG / PKL` dan tombol aksi pada `DisciplineRecapTable`.
- Komponen Client `KedisiplinanClient` dengan Shadcn UI primitives (Card, Table, Badge, Button, Input, Dialog) dan visual telemetry cards untuk halaman `/kedisiplinan`.
- Komponen Client `MemberDisciplineDetailClient` berbasis Shadcn UI primitives (Card, Table, Badge, Button, Dialog) untuk halaman detail & sanksi anggota `/kedisiplinan/[profileId]`.
- Redesign Client Component `LeaveApprovalDashboard` berbasis Shadcn UI primitives (Card, Badge, Button, Input, Dialog, Textarea) dengan telemetry metric cards dan filter pencarian interaktif untuk halaman `/perizinan`.

### Changed

- Redesign konsisten komponen pop-up modal (`MemberInternshipModal`, `GoroReductionDialog`, dan `IssueSanctionDialog`) dengan Shadcn UI primitives (Dialog, Input, Label, Textarea, Switch, Button) dan standar visual `DESIGN.md`.
- Redesign halaman Kedisiplinan (`app/(private)/kedisiplinan/page.tsx`) sebagai Server Component terpisah yang memanggil `KedisiplinanClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Redesign halaman Detail Kedisiplinan (`app/(private)/kedisiplinan/[profileId]/page.tsx`) sebagai Server Component terpisah yang memanggil `MemberDisciplineDetailClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Redesign halaman Perizinan Komdis (`app/(private)/perizinan/page.tsx`) sebagai Server Component terpisah yang memanggil `LeaveApprovalDashboard` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Logika `batchMarkAlfa` pada kegiatan Komdis (`target_audience = 'anggota'`) agar anggota yang sedang magang otomatis diset berstatus `izin` dengan 0 poin sanksi dan catatan _"Dispensasi Magang / PKL"_.
- Fungsi `getKomdisMemberAttendanceSummary` dan `getUsersAction` untuk mengembalikan data status magang anggota aktif.

### Fixed

- Perbaikan verifikasi perubahan email pada Pengaturan Akun: sinkronisasi otomatis `auth.users` ke `public.profiles` via database trigger migration.
- Penanganan preservasi sesi user (`session persistence`) saat callback verifikasi email perubahan akun.
- Konfigurasi Supabase Auth (`double_confirm_changes = false`) agar konfirmasi email hanya dikirimkan 1x ke email baru.
- Sinkronisasi state lokal `MemberInternshipModal` dengan prop `member` dan `isOpen` via `useEffect` agar status toggle dan rentang tanggal magang tampil akurat sesuai data anggota saat dialog dibuka.
- Penataan ulang responsif layout mobile-first pada `MemberDisciplineDetailClient` untuk layar perangkat kecil (seperti iPhone ~684px) agar Badge magang/PKL tidak terpotong (overflow), tombol aksi admin tersusun rapi, dan navigasi tab presensi dapat di-scroll dengan nyaman.
- Pembaruan kapsul label & rentang tanggal magang (`MemberDisciplineDetailClient`) menggunakan struktur pill terpisah ber-padding lega (`px-3 py-1 rounded-full`) yang selaras dengan panduan `DESIGN.md`.
- Penyesuaian breakpoint responsif `xl:flex-row` pada header profil `MemberDisciplineDetailClient` untuk mencegah meluapnya tombol aksi (+ Pemutihan Goro & + Terbitkan SP) keluar dari kontainer kartu pada lebar layar 1024px.

## [0.1.3] - 2026-08-10

### Added

- Sidebar Navigation: Item menu `Perizinan` (`/perizinan`) dan `Kedisiplinan` (`/kedisiplinan`) pada section `KEANGGOTAAN UKM` (akses khusus `admin-komdis` dan `super-admin`).
- Direktori Kedisiplinan: Tampilan UI/UX baru pada halaman `/kedisiplinan` dan komponen `DisciplineRecapTable` (Clean Technical Theme, HSL token, kontras Light/Dark mode).

### Fixed

- Perizinan Komdis: Mengabaikan data perizinan dari user role `caang` dan `alumni` pada halaman `/perizinan` sehingga antrean Komdis hanya menampilkan anggota aktif dan pengurus.
- Direktori Kedisiplinan: Mengabaikan data poin dan sanksi dari role `caang` dan `alumni` pada halaman `/kedisiplinan`.

## [0.1.1] - 2026-05-08

### Added

- Inisialisasi ulang proyek robotik-pnp dengan stack terstandarisasi.
- Inisialisasi Supabase lokal dengan Docker.
- Setup Husky pre-commit hook dan Commitlint.
- Setup Next.js dengan pnpm.

[Unreleased]: https://github.com/zakyrmh/robotik-pnp/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.9.4...v0.10.0
[0.9.4]: https://github.com/zakyrmh/robotik-pnp/compare/v0.9.3...v0.9.4
[0.9.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.8.5...v0.9.0
[0.8.5]: https://github.com/zakyrmh/robotik-pnp/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/zakyrmh/robotik-pnp/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/zakyrmh/robotik-pnp/compare/v0.8.0...v0.8.2
[0.7.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1
