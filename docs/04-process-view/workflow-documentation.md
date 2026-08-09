# Panduan Dokumentasi Alur Kerja Bisnis (Business Workflow Documentation Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                     |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PRC-WKF-01`                                                                                          |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                                           |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                                            |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                                   |
| **Induk Kebijakan (_Master Policy_)** | _Business Process & Workflow Governance Policy_ (Bagian dari ISMS & Process Architecture UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Process Governance UKM Robotik PNP                                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis          | Ringkasan Perubahan                                                                                         |
| :------: | :--------: | :--------------- | :---------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Business Analyst | Draf awal dokumentasi alur kerja presensi, piket, dan rekrutmen berbasis diagram BPMN 2.0.                  |
| `v2.0.0` | 09/08/2026 | System Architect | Pembaruan Total: Sinkronisasi model BPMN XMI, penambahan Document Control baku, matriks RBAC, dan automasi. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Dokumen ini berkedudukan sebagai pedoman teknis utama operasional **Business Process & Workflow Governance Policy** pada **Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**. Dokumen ini secara eksplisit menguraikan alur kerja bisnis digital berbasis standar ISO 19510 (BPMN 2.0) yang dimodelkan dalam 3 (tiga) domain proses utama:

1. **Manajemen Presensi Digital & Sanksi Kehadiran** (`attendance.bpmn.xml`).
2. **Manajemen Operasional Piket Laboratorium & Denda** (`piket.bpmn.xml`).
3. **Penerimaan Anggota Baru (Oprec), Pelatihan, Magang & Pelantikan** (`recruitment.bpmn.xml`).

Tujuan utama panduan ini adalah:

1. Menjamin transparansi, akuntabilitas, dan standarisasi pelaksanaan kegiatan operasional organisasi.
2. Memastikan pemetaan peran berbasis **Role-Based Access Control (RBAC)** terdefinisi secara presisi pada setiap langkah proses.
3. Menyediakan acuan pengembang dalam mengimplementasikan logika otomatisasi backend (_Server Actions & Triggers_).

---

## 2. Arsitektur Alur Kerja & Pembagian Peran (_Swimlane Matrix_)

Proses bisnis organisasi dikelompokkan ke dalam pembagian jalur (_swimlane_) interaktif antara pemangku kepentingan (_actors_) dan subsistem:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      PETA INTEGRASI SWIMLANE OPERASIONAL                         │
├──────────────────────┬───────────────────────────────────────────────────────────┤
│ Peran / Swimlane     │ Deskripsi Tanggung Jawab & Cakupan Aksi                   │
├──────────────────────┼───────────────────────────────────────────────────────────┤
│ • Pemrakarsa Rapat   │ Membuat agenda kegiatan, menerbitkan QR presensi.         │
│ • Komisi Disiplin    │ Memantau piket lab, verifikasi izin, validasi sanksi/SP.  │
│ • Anggota / Caang    │ Melakukan check-in presensi, tugas piket, ikuti pelatihan.│
│ • Pengurus / Admin   │ Pengelolaan Oprec, seleksi berkas, wawancara, pelantikan. │
│ • Sistem (Backend)   │ Hitung poin otomatis, rotasi shift, gatekeeping RBAC.    │
└──────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 3. Alur Kerja 1: Manajemen Presensi Digital & Sanksi Kehadiran (`attendance.bpmn.xml`)

Alur kerja presensi mengatur pelaksanaan absensi rapat/kegiatan formal, pengelolaan pengajuan izin, perhitungan akumulasi poin kehadiran, hingga penerbitan Surat Peringatan (SP) secara otomatis.

### 3.1. Spesifikasi Langkah-demi-Langkah (_Step-by-Step Execution_)

```
[ Pemrakarsa ] ──(Buat Rapat)──> [ Sistem ] ──(Formal?)──┬──[Tidak]──> [ End: Tanpa Presensi ]
                                                         │
                                                       [Ya]
                                                         │
                                                         ▼
[ Anggota ] ──(Scan QR / Link)──> [ Sistem ] ──(Tutup Sesi)──> [ Sistem Hitung Poin ]
     │                                                                 │
     └──(Ajukan Izin)──> [ Komdis Approve ] ───────────────────────────┘
                                                                       │
                                                         ┌─────────────┴─────────────┐
                                                         ▼                           ▼
                                                  [ Poin > Ambang? ]           [ Poin Aman ]
                                                         │                           │
                                                       [Ya]                       [Tidak]
                                                         │                           │
                                                         ▼                           ▼
                                                [ Sistem Generate SP ]      [ Rekap Tersimpan ]
                                                         │
                                                         ▼
                                                [ Komdis Review & Send ] ──> [ End: SP Sent ]
```

#### Detail Tahapan Operasional:

1. **Inisiasi Kegiatan**: Pemrakarsa Rapat memilih jenis kegiatan di dashboard (`/dashboard/kegiatan/create`).
2. **Evaluasi Formallitas**: Gateway `Apakah Rapat Formal?` mengevaluasi jenis kegiatan:
   - _Jika Tidak_: Rapat informal selesai tanpa pencatatan presensi.
   - _Jika Ya_: Sistem meng-generate token QR Code dinamis (`ukmrobotik:qr:session`) yang berganti setiap 30 detik.
3. **Eksekusi Presensi & Pengajuan Izin**:
   - Anggota yang hadir melakukan pemindaian QR Code via kamera smartphone (`/kegiatan-absensi-caang/scan`).
   - Anggota yang berhalangan mengunggah surat bukti izin/sakit. Komdis meninjau dan melakukan _Approve/Reject_.
4. **Penutupan Sesi & Perhitungan Poin**:
   - Sistem menutup sesi presensi secara otomatis saat _expiration time_ tercapai.
   - Algoritma `calculateAttendancePoint()` mengkategorikan status (Hadir: +10 poin, Late Tolerance: +7.5 poin, Late >15m: +5 poin, Izin/Sakit: +5 poin, Alpha: 0 poin).
5. **Evaluasi Ambang Sanksi (Disciplinary Gate)**:
   - Gateway `Poin Melewati Ambang?` mengevaluasi akumulasi poin akumulatif.
   - Jika poin pelanggaran melewati ambang batas, sistem secara otomatis menerbitkan _Draft Surat Peringatan (SP)_.
   - Komdis melakukan _Review & Kirim SP_ yang diteruskan via email transaksional dan notifikasi dashboard.

---

## 4. Alur Kerja 2: Manajemen Operasional Piket Laboratorium & Denda (`piket.bpmn.xml`)

Alur kerja piket laboratorium mengatur penjadwalan otomatis tugas kebersihan lab, notifikasi pengingat, validasi bukti foto pelaksanaan piket, dan pengenaan denda finansial/penalti.

### 4.1. Spesifikasi Langkah-demi-Langkah (_Step-by-Step Execution_)

```
[ Admin Komdis ] ──(Input Jadwal)──> [ Sistem ] ──(Kirim Reminder H-1)──> [ Calon Anggota ]
                                                                                   │
                                                                         (Laksanakan Piket)
                                                                                   │
                                                                                   ▼
                                                                        [ Upload Foto Bukti ]
                                                                                   │
                                                                                   ▼
                                                                        [ Komdis Cek & Approve ]
                                                                                   │
                                                                   ┌───────────────┴───────────────┐
                                                                   ▼                               ▼
                                                            [ Laporan Valid? ]           [ Absen / Tidak Valid ]
                                                                   │                               │
                                                                 [Ya]                           [Tidak]
                                                                   │                               │
                                                                   ▼                               ▼
                                                          [ Status Selesai ]             [ Denda Rp10.000 ]
```

#### Detail Tahapan Operasional:

1. **Penyusunan Jadwal Shift**: Admin Komdis mengkonfigurasi jadwal rotasi piket harian calon anggota di awal periode (`/dashboard/piket/schedule`).
2. **Notifikasi Otomatis**:
   - Sistem mengirimkan notifikasi penugasan jadwal sekali di awal rilis.
   - Cron Job / Schedule trigger mengirimkan _Reminder H-1 Piket_ setiap pukul 18.00 WIB kepada petugas shift besok.
3. **Pelaksanaan & Pelaporan**:
   - Petugas piket melaksanakan pembersihan laboratorium dan mengambil foto kondisi lab.
   - Petugas mengunggah foto bukti ke Supabase Private Storage Bucket `piket-proofs`.
4. **Verifikasi & Pengenaan Denda**:
   - Komdis memeriksa kelayakan laporan bukti foto.
   - Jika laporan disetujui (_Approve_), status piket ditandai _Completed_.
   - Jika petugas tidak piket (_Alfa_) atau laporan ditolak, sistem mencatat denda otomatis sebesar **Rp10.000** dan poin penalti ke dalam rekam jejak kandidat.

---

## 5. Alur Kerja 3: Open Recruitment, Pelatihan, Magang & Pelantikan (`recruitment.bpmn.xml`)

Alur rekrutmen merupakan proses paling kompleks yang mencakup pendaftaran online, seleksi administrasi, wawancara 2 tahap, pelatihan divisi, masa magang proyek robotik, hingga pelantikan resmi anggota.

### 5.1. Spesifikasi Tahapan Rekrutmen (_Multi-Phase Execution_)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ FASE 1: PENDAFTARAN & SELEKSI BERKAS                                                    │
│ [ Admin-OR ] ──> Publish Oprec ──> [ Caang ] Isi Form ──> [ Sistem ] Email Konfirmasi   │
│                                                                    │                    │
│                                                          [ Seleksi Berkas ]             │
│                                                                    │                    │
│                                          ┌─────────────────────────┼───────────────────┐│
│                                          ▼                         ▼                   ▼│
│                                   [ Lolos Berkas ]       [ Perbaikan Data ]      [ Ditolak ]│
└──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────────────────┐
│ FASE 2: WAWANCARA & SELEKSI DIVISIONAL                                                  │
│ [ Admin-OR ] Susun Jadwal Wawancara ──> [ Caang ] Wawancara 1 & Wawancara 2             │
│                                                                 │                       │
│                                                      [ Alokasi Divisi ]                 │
└─────────────────────────────────────────────────────────┬───────────────────────────────┘
                                                          │
┌─────────────────────────────────────────────────────────▼───────────────────────────────┐
│ FASE 3: PELATIHAN, MAGANG & EVALUASI AKHIR                                              │
│ [ Caang ] Pelatihan (Elektronika, Mekanik, Pemrograman) + Demo Robot                    │
│    │                                                                                    │
│    └──> [ Sesi Magang & Mini Project ] ──> [ Logbook ] ──> [ Rapat Evaluasi ]          │
└─────────────────────────────────────────────────────────┬───────────────────────────────┘
                                                          │
┌─────────────────────────────────────────────────────────▼───────────────────────────────┐
│ FASE 4: PELANTIKAN & PENERBITAN SK ANGGOTA                                              │
│ [ Sistem ] Generate Draft SK ──> [ Pembina ] Tanda Tangan ──> [ Admin ] Upload SK Scan  │
│                                                                        │                │
│                                                              [ End: Pelantikan ]        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Detail Rincian Fase Rekrutmen:

1. **Fase 1: Pendaftaran & Seleksi Berkas**:
   - Admin-OR mengaktifkan jendela periode rekrutmen.
   - Pendaftar (_Caang_) mengisi form pendaftaran dan mengunggah berkas persyaratannya.
   - Evaluasi berkas menghasilkan 3 jalur: _Lolos Berkas_ (lanjut wawancara), _Perbaikan Data_ (notifikasi kirim ulang), atau _Ditolak_ (kirim email penolakan).
2. **Fase 2: Wawancara & Alokasi Divisi**:
   - Pendaftar yang lolos mengikuti Wawancara 1 (Kepribadian/Keorganisasian) dan Wawancara 2 (Keahlian Teknis).
   - Penguji memasukkan nilai ke sistem; sistem secara otomatis mengalokasikan slot magang divisi (KRSBI, KRI, KRSTI, dll.).
3. **Fase 3: Pelatihan & Masa Magang**:
   - Caang mengikuti 3 modul pelatihan (Elektronika 5 sesi, Mekanik 4 sesi, Pemrograman 4 sesi) dan Demo Robot.
   - Masa magang diisi dengan pengerjaan _Mini Project_, pengisian logbook harian, dan evaluasi berkala.
4. **Fase 4: Pelantikan Anggota**:
   - Rapat pleno menentukan kelulusan akhir.
   - Sistem meng-generate _Draft SK Anggota_, dicetak dan ditandatangani Pembina/Ketua, diunggah kembali ke sistem, dan ditutup dengan acara Pelantikan Anggota Resmi.

---

## 6. Matriks Integrasi Peran & Hak Akses (RBAC Workflow Matrix)

| Kode Alur Kerja | Tahapan Akses                | Super Admin | Admin-OR | Admin-Komdis | Anggota | Caang |
| :-------------- | :--------------------------- | :---------: | :------: | :----------: | :-----: | :---: |
| `WF-ATT-01`     | Buat Sesi Rapat              |     [x]     |   [x]    |     [x]      |   [-]   |  [-]  |
| `WF-ATT-02`     | Scan Presensi QR             |     [x]     |   [x]    |     [x]      |   [x]   |  [x]  |
| `WF-ATT-03`     | Approve Pengajuan Izin       |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-PIK-01`     | Setup Jadwal Piket           |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-PIK-02`     | Upload Bukti Foto Piket      |     [-]     |   [-]    |     [-]      |   [-]   |  [x]  |
| `WF-PIK-03`     | Verifikasi & Catat Denda     |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
| `WF-REC-01`     | Publish Open Recruitment     |     [x]     |   [x]    |     [-]      |   [-]   |  [-]  |
| `WF-REC-02`     | Seleksi Berkas & Input Nilai |     [x]     |   [x]    |     [x]      |   [-]   |  [-]  |
| `WF-REC-03`     | Upload Scan SK Anggota Resmi |     [x]     |   [x]    |     [-]      |   [-]   |  [-]  |

---

## 7. Automasi Backend & Integrasi Sistem (_System Triggers_)

Seluruh alur kerja didukung oleh otomatisasi logika serverless:

1. **Database Triggers & RLS Policies**: Penjagaan keamanan mutasi data di tingkat PostgreSQL skema `public`.
2. **Scheduled Cron Jobs (Upstash / Vercel Cron)**:
   - _Automated Session Closer_: Memutus akses scanner QR presensi tepat waktu.
   - _Daily Piket Reminder_: Pengiriman pengingat tugas piket H-1 pukul 18.00 WIB.
3. **Email Notification Engine (Resend / Supabase Auth SMTP)**:
   - Pengiriman otomatis email konfirmasi pendaftaran, notifikasi wawancara, dan draf SP.

---

## 8. Checklist Verifikasi Operasional Alur Kerja

- [ ] Seluruh diagram alur BPMN 2.0 tersinkronisasi penuh dengan logika aplikasi Next.js App Router.
- [ ] Hak akses RBAC terpasang ketat pada setiap rute Server Actions terkait presensi, piket, dan rekrutmen.
- [ ] Sistem notifikasi email dan Cron Job pengingat piket berjalan $100\%$ tanpa hambatan.
- [ ] Pengujian kasus batas (_edge cases_) seperti token QR kadaluarsa dan perbaikan berkala pendaftaran lulus verifikasi QA.

---

_Dokumen ini diterbitkan sebagai standar panduan dokumentasi alur kerja bisnis resmi UKM Robotik Politeknik Negeri Padang._
