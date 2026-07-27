# SOFTWARE REQUIREMENTS SPECIFICATION (MINI SRS)

## Modul Presensi & Kedisiplinan Komisi Disiplin (Komdis)

**Sistem Informasi Manajemen UKM Robotik PNP**

---

## 1. Pendahuluan

### 1.1 Tujuan

Dokumen Mini Software Requirements Specification (SRS) ini bertujuan untuk mendefinisikan kebutuhan teknis dan non-teknis secara komprehensif dalam pengembangan **Modul Presensi & Kedisiplinan Komisi Disiplin (Komdis)** pada web application Sistem Informasi Manajemen UKM Robotik PNP. Dokumen ini menjadi acuan utama bagi pengembang (_developers_), pengurus Komdis (_domain experts_), dan _system maintainer_.

### 1.2 Ruang Lingkup

Modul ini mencakup:

- Pengelolaan agenda kegiatan formal organisasi yang dikelola Komdis.
- Sistem presensi digital berbasis pemindaian _Dynamic QR Code_ (terenkripsi AES-256 dengan batas waktu kedaluwarsa 5 menit) dan _Manual Override_.
- Alur pengajuan, verifikasi, serta penentuan bobot poin sanksi untuk perizinan (izin/sakit/terlambat).
- Otomatisasi kalkulasi akumulasi poin pelanggaran dan pemutihan poin (sanksi Goro) sesuai SOP Komdis Periode 2025/2026.
- Manajemen dan pencatatan penerbitan Surat Peringatan (SP 1, SP 2, dan SP 3).

### 1.3 Definisi, Akronim, dan Singkatan

- **Komdis**: Komisi Disiplin UKM Robotik PNP.
- **CAANG**: Calon Anggota UKM Robotik PNP.
- **RLS**: Row Level Security (Fitur keamanan tingkat baris pada PostgreSQL/Supabase).
- **RPC**: Remote Procedure Call (Stored Function pada PostgreSQL Supabase).
- **SP**: Surat Peringatan (SP 1 = 30 poin, SP 2 = 50 poin, SP 3 = 100 poin).
- **TTL**: Time-To-Live (Masa berlaku token QR Code).

---

## 2. Deskripsi Umum (Gambaran Non-Teknis & Aturan Bisnis)

### 2.1 Perspektif Produk

Modul Presensi & Kedisiplinan Komdis merupakan subsistem utama dari web aplikasi UKM Robotik PNP yang terintegrasi langsung dengan database Supabase Auth, manajemen profil anggota, serta sistem penyimpanan berkas.

### 2.2 Karakteristik Pengguna & Hak Akses (Role Matrix)

- **`super-admin`**: Akses penuh membaca, memperbarui, dan mengelola seluruh data sistem.
- **`admin-komdis`**: Akses penuh untuk membuat kegiatan `target_audience = 'anggota'`, melakukan pemindaian QR Code, menyetujui/menolak surat izin, menginput pemutihan poin Goro, serta menerbitkan SP.
- **`anggota`**: Dapat melihat jadwal kegiatan formal, menghasilkan _Dynamic QR Code_ milik pribadi, mengajukan perizinan, serta memantau rekap akumulasi poin kedisiplinan pribadi.

### 2.3 Aturan Bisnis (Business Rules / SOP Komdis)

Berdasarkan dokumen SOP Komisi Disiplin UKM Robotik PNP, ditetapkan aturan kalkulasi poin dan sanksi sebagai berikut:

#### A. Matriks Poin Pelanggaran Presensi

| Kategori Presensi        | Kondisi / Status                                    | Bobot Poin Sanksi                     |
| ------------------------ | --------------------------------------------------- | ------------------------------------- |
| **Hadir Tepat Waktu**    | Scan QR $\le$ Waktu Toleransi (15 menit)            | **0 Poin**                            |
| **Terlambat < 1 Jam**    | Waktu Toleransi < Scan QR < 60 Menit                | **0 Poin** _(Sanksi fisik di tempat)_ |
| **Terlambat > 1 Jam**    | Izin Keterlambatan Diterima Komdis                  | **3 Poin**                            |
| **Terlambat > 1 Jam**    | Izin Keterlambatan Ditolak Komdis                   | **5 Poin**                            |
| **Izin / Sakit**         | Alasan & Bukti Diterima Komdis                      | **5 Poin**                            |
| **Izin / Sakit**         | Alasan / Bukti Ditolak Komdis                       | **10 Poin**                           |
| **Alfa / Tanpa Kabar**   | Tidak presensi pada kegiatan umum                   | **15 Poin**                           |
| **Alfa Pelatihan CAANG** | Anggota resmi alfa saat bertugas di pelatihan CAANG | **5 Poin**                            |

#### B. Ambang Surat Peringatan & Pemutihan Poin (Goro)

- **SP 1 (Akumulasi $\ge 30$ Poin)**: Sanksi Goro minimal 4x/bulan. Pemutihan/pengurangan sebesar **-10 Poin** setelah sanksi tuntas dilaksanakan.
- **SP 2 (Akumulasi $\ge 50$ Poin)**: Sanksi Penahanan Baju PDH + Evaluasi Tim KRI + Goro minimal 6x/bulan. Pemutihan/pengurangan sebesar **-15 Poin** setelah sanksi tuntas.
- **SP 3 (Akumulasi $\ge 100$ Poin)**: Rekomendasi pemberhentian/dikeluarkan dari keanggotaan UKM Robotik PNP.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

### 3.1 Modul Manajemen Kegiatan (`activities`)

- **FR-KMD-01**: Sistem harus memungkinkan `admin-komdis` membuat agenda kegiatan formal baru.
- **FR-KMD-02**: Sistem harus mengisi `target_audience = 'anggota'` secara otomatis saat `admin-komdis` membuat kegiatan.
- **FR-KMD-03**: Sistem harus menyediakan form konfigurasi parameter waktu: `start_date`, `end_date`, `checkin_open_at`, `checkin_close_at`, dan `late_tolerance_minutes` (default 15 menit).

### 3.2 Modul Presensi & Pemindaian QR Code (`attendances`)

- **FR-KMD-04**: Sistem harus menyediakan fitur enkripsi biner AES-256-CBC untuk menghasilkan string _Dynamic QR Token_ pada layar HP anggota dengan TTL 300 detik (5 menit).
- **FR-KMD-05**: Sistem harus menyediakan antarmuka pemindai kamera (`html5-qrcode`) pada HP `admin-komdis` untuk memverifikasi QR Code anggota.
- **FR-KMD-06**: Sistem harus dapat menentukan status `hadir` vs `telat` secara otomatis berdasarkan waktu pindaian terhadap `start_date` + `late_tolerance_minutes`.
- **FR-KMD-07**: Sistem harus menyediakan fitur **"Penandaan Alfa Massal"** (_Batch Mark Alfa_) untuk mengeset status `alfa` (+15 poin) bagi seluruh anggota yang belum melakukan presensi setelah sesi kegiatan ditutup.
- **FR-KMD-08**: Sistem harus menyediakan fitur _Manual Override_ bagi Komdis untuk mengabsen anggota yang tidak membawa perangkat HP atau terlambat > 1 jam.

### 3.3 Modul Perizinan (`attendances`)

- **FR-KMD-09**: Anggota dapat mengajukan surat izin/sakit dengan mengunggah foto bukti ke Supabase Storage (Private Bucket).
- **FR-KMD-10**: Komdis dapat meninjau antrean perizinan berstatus `pending`, melihat lampiran bukti via _Signed URL_, serta mengeklik opsi **Approve** (5 Poin) atau **Reject** (10 Poin).

### 3.4 Modul Kedisiplinan, Pemutihan, & SP (`discipline_point_logs` & `sanctions`)

- **FR-KMD-11**: Sistem harus mengkalkulasi total poin bersih (_net points_) anggota secara _real-time_ dengan rumus:

$$P_{\text{net}} = \sum P_{\text{attendances}} + \sum P_{\text{discipline\_point\_logs}}$$

- **FR-KMD-12**: Komdis dapat menginput _Log Pemutihan Poin_ setelah anggota menyelesaikan sanksi Goro (pilihan: `-10` poin untuk SP1, `-15` poin untuk SP2).
- **FR-KMD-13**: Komdis dapat mencatat dan menerbitkan Surat Peringatan (SP1, SP2, SP3) ke dalam sistem yang akan menampilkan _warning banner_ pada dashboard anggota bersangkutan.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 4.1 Keamanan & Proteksi Data (Security)

- **NFR-SEC-01 (Multi-layer Authorization)**: Proteksi rute navigasi dikelola di tingkat Edge via `proxy.ts`, pengecekan ulang role pada Server Actions (`lib/actions/komdis.ts`), serta isolasi data di tingkat PostgreSQL Row Level Security (RLS).
- **NFR-SEC-02 (Anti-Screenshot QR)**: QR Token dienkripsi AES-256-CBC menggunakan `SUPABASE_SERVICE_ROLE_KEY` dan dilindungi masa kadaluarsa 5 menit untuk mencegah kecurangan _screenshot sharing_.
- **NFR-SEC-03 (Audit Trail)**: Setiap tindakan pemindaian QR maupun perizinan wajib mencatat UUID pemindai/pemeriksa pada kolom `verified_by`.

### 4.2 Performa (Performance)

- **NFR-PRF-01**: Waktu respon pemrosesan pemindaian QR Code dari kamera hingga mendapat balasan dari server tidak boleh melebihi 2.0 detik pada jaringan seluler 4G.
- **NFR-PRF-02**: Perhitungan poin akumulasi dioptimalkan menggunakan Database View (`v_user_discipline_summary`) agar tidak membebani Server Action.

### 4.3 Aksesibilitas & Antarmuka (Usability & Mobile Accessibility)

- **NFR-USB-01**: Antarmuka pemindai QR dan antarmuka penampil QR Code dirancang dengan pendekatan _Mobile-First_, responsif di layar smartphone (Android/iOS).

---

## 5. Gambaran Arsitektur Teknis & Database

### 5.1 Tech Stack Spesifikasi

- **Framework**: Next.js 16 App Router (Tanpa direktori `src/`).
- **Language**: TypeScript (`strict: true`).
- **Database & Auth**: Supabase PostgreSQL + Auth (Native SQL Client `@supabase/ssr`, tanpa ORM).
- **Validation**: Zod.
- **Hosting**: Vercel.

### 5.2 Skema Entitas Database Utama

```
┌─────────────────────────┐       ┌─────────────────────────┐
│       activities        │       │       profiles          │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ title (TEXT)            │       │ full_name (TEXT)        │
│ start_date (TIMESTAMPTZ)│       │ nim (TEXT, UNIQUE)      │
│ target_audience (ENUM)  │       │ role (USER-DEFINED)     │
│ checkin_open_at (...)   │       └────────────┬────────────┘
│ late_tolerance_minutes  │                    │
└────────────┬────────────┘                    │
             │ 1                               │ 1
             │                                 │
             │ N                               │ N
┌────────────┴────────────┐       ┌────────────┴────────────┐
│       attendances       │       │  discipline_point_logs  │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ activity_id (FK)        │       │ profile_id (FK)         │
│ profile_id (FK)         │       │ points (INT, e.g. -10)  │
│ status (ENUM)           │       │ category (TEXT)         │
│ approval_status (TEXT)  │       │ description (TEXT)      │
│ points_awarded (INT)    │       └─────────────────────────┘
│ verified_by (FK)        │
└─────────────────────────┘

```

### 5.3 Spesifikasi Endpoint / Server Actions Contract (`lib/actions/komdis.ts`)

| Nama Server Action        | Payload Input (Zod)                   | Functionality                                                          |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `createKomdisActivity`    | `CreateKomdisActivitySchema`          | Membuat agenda rapat/kegiatan formal Komdis.                           |
| `scanAttendanceQRByAdmin` | `activityId: string, qrToken: string` | Mendekripsi QR Token, memvalidasi TTL, dan mencatat presensi.          |
| `reviewLeaveRequest`      | `ReviewLeaveSchema`                   | Menyetujui/menolak pengajuan izin dan memberikan poin sanksi.          |
| `batchMarkAlfa`           | `activityId: string`                  | Memroses otomatis status `alfa` (+15 poin) bagi anggota tidak hadir.   |
| `logPointReduction`       | `LogPointReductionSchema`             | Mencatat pengurangan poin setelah sanksi Goro tuntas (-10 / -15 poin). |
| `issueSanction`           | `IssueSanctionSchema`                 | Menerbitkan data SP1, SP2, atau SP3 ke dalam tabel `sanctions`.        |

---

### 5.4 Matriks Rute Halaman (Routing Matrix)

```
app/(private)/
├── dashboard/                  ──> Widget Poin Kedisiplinan & Alert SP Anggota
├── kegiatan/                   ──> Daftar Agenda Formal (Terfilter RLS)
│   └── [id]/
│       ├── page.tsx            ──> Detail & Monitoring Presensi Real-time
│       └── absensi/page.tsx    ──> [Anggota: Dynamic QR / Izin] [Komdis: Camera Scanner]
├── perizinan/                  ──> Antrean Review Surat Izin/Sakit
└── kedisiplinan/               ──> Direktori Rekap Poin Anggota
    └── [profileId]/page.tsx    ──> Detail Poin, Input Pemutihan Goro, & Terbit SP

```
