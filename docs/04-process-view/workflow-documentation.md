# Panduan Dokumentasi Alur Kerja Bisnis (Business Workflow Documentation Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                     |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PRC-WKF-01`                                                                                          |
| **Versi Dokumen**                     | `v2.1.0` (Operational Production-Ready Release)                                                           |
| **Tanggal Efektif**                   | 25 Agustus 2026                                                                                           |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                                   |
| **Induk Kebijakan (_Master Policy_)** | _Business Process & Workflow Governance Policy_ (Bagian dari ISMS & Process Architecture UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Process Governance UKM Robotik PNP                                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis          | Ringkasan Perubahan                                                                                                                                                                                                         |
| :------: | :--------: | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Business Analyst | Draf awal dokumentasi alur kerja presensi, piket, dan rekrutmen berbasis diagram BPMN 2.0.                                                                                                                                  |
| `v2.0.0` | 09/08/2026 | System Architect | Pembaruan: Sinkronisasi model BPMN XMI, penambahan Document Control baku, matriks RBAC, dan automasi.                                                                                                                       |
| `v2.1.0` | 25/08/2026 | Lead Architect   | Pembaruan Total: Standarisasi 8 Role, penegasan Anggota Resmi, integrasi SOP Komdis (poin sanksi & ambang SP), peralihan Piket Workshop & Denda Dinamis ke Kestari, Cloudflare R2 Storage, dan pembaruan 8 Tahapan Alur OR. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Dokumen ini berkedudukan sebagai pedoman teknis utama operasional **Business Process & Workflow Governance Policy** pada **Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**. Dokumen ini secara eksplisit menguraikan alur kerja bisnis digital berbasis standar ISO 19510 (BPMN 2.0) yang dimodelkan dalam 3 (tiga) domain proses utama:

1. **Manajemen Presensi Digital & Sanksi Kedisiplinan** (`attendance.bpmn.xml`): Mengatur penyelenggaraan sesi kegiatan resmi organisasi dan kegiatan calon anggota, pemindaian QR dinamis, persetujuan izin, akumulasi poin pelanggaran kehadiran, serta penerbitan Surat Peringatan (SP) Komisi Disiplin.
2. **Manajemen Operasional Piket Workshop & Denda Administratif** (`piket.bpmn.xml`): Mengatur penjadwalan rotasi piket kebersihan workshop oleh Kesekretariatan (`admin-kestari`), pengiriman pengingat H-1, unggah bukti foto ke Cloudflare R2 privat, verifikasi laporan, dan pencatatan denda administratif dinamis.
3. **Penerimaan Calon Anggota (Open Recruitment / OR), Pelatihan, Magang, Project & Pelantikan** (`recruitment.bpmn.xml`): Mengatur 8 tahapan terstruktur mulai dari Pendaftaran, Demo Robot, Wawancara 1, Pelatihan dasar, Magang Divisi & Departemen, Project robotika, Wawancara 2, hingga evaluasi kelulusan dan Pelantikan resmi.

Tujuan utama panduan ini adalah:

1. Menjamin transparansi, akuntabilitas, dan standarisasi pelaksanaan kegiatan operasional organisasi.
2. Memastikan pemetaan peran berbasis **Role-Based Access Control (RBAC 8 Role)** terdefinisi secara presisi pada setiap langkah proses.
3. Menyelaraskan sanksi kedisiplinan dengan ketentuan baku **[SOP_KEGIATAN_KOMDIS.md](SOP_KEGIATAN_KOMDIS.md)**.
4. Menyediakan acuan bagi pengembang dalam mengimplementasikan logika otomatisasi backend (_Server Actions, Database Triggers & Scheduled Cron_).

---

## 2. Arsitektur Alur Kerja & Pembagian 8 Role Sistem (_Swimlane Matrix_)

Pada sistem ini, hak akses dan batas wewenang dipetakan secara ketat ke dalam **8 (delapan) role resmi**:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             PETA INTEGRASI 8 ROLE SISTEM & SWIMLANE                              │
├──────────────────────┬───────────────────────────────────────────────────────────────────────────┤
│ Peran / Role Sistem  │ Deskripsi Tanggung Jawab & Cakupan Wewenang Utama                         │
├──────────────────────┼───────────────────────────────────────────────────────────────────────────┤
│ • `super-admin`      │ Role tertinggi sistem; kontrol konfigurasi penuh, bypass seluruh domain,  │
│                      │ manajemen akun, audit log, dan hak override seluruh operasional.          │
│ • `admin-komdis`     │ Manajemen kedisiplinan anggota resmi; CRUD sesi kegiatan resmi organisasi,│
│                      │ scanner presensi anggota, approval izin anggota, rekap poin & draf SP.    │
│ • `admin-or`         │ Manajemen Open Recruitment (OR); CRUD sesi kegiatan caang, scanner presensi│
│                      │ caang, approval izin caang, seleksi berkas, wawancara, dan alur magang.  │
│ • `admin-kestari`    │ Manajemen operasional kesekretariatan; penyusunan jadwal piket workshop,  │
│                      │ verifikasi foto bukti piket di Cloudflare R2, dan pencatatan denda dinamis│
│ • `admin-divisi`     │ Bekerja sama dengan `admin-or` dalam pelaksanaan magang divisi teknis;     │
│                      │ pengecekan kehadiran internal divisi dan penilaian keaktifan calon anggota│
│ • `anggota`          │ Anggota aktif UKM Robotik PNP; wajib piket workshop, menghadiri kegiatan  │
│                      │ resmi, mengajukan izin, dan generate QR presensi pribadi.                 │
│ • `caang`            │ Calon Anggota yang sedang menjalani tahapan OR; wajib menghadiri kegiatan │
│                      │ pelatihan/magang, submit logbook project, dan generate QR presensi pribadi│
│ • `alumni`           │ Alumni UKM Robotik PNP; akses terbatas pada jejaring profil dan direktori, │
│                      │ tidak memiliki beban piket workshop maupun sanksi operasional.            │
└──────────────────────┴───────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Prinsip Anggota Resmi UKM Robotik PNP:**
> Di dalam sistem, entitas **"Anggota Resmi"** mencakup seluruh pengguna dengan role: `super-admin`, `admin-komdis`, `admin-or`, `admin-kestari`, `admin-divisi`, dan `anggota`. Seluruh anggota resmi ini terikat pada kewajiban menghadiri kegiatan resmi organisasi, melaksanakan piket kebersihan workshop, serta tunduk pada tata tertib kedisiplinan Komdis.

> [!NOTE]
> **Definisi Peran Pemrakarsa (Event/Meeting Initiator):**
> Istilah _Pemrakarsa_ pada diagram BPMN merujuk pada peran logis inisiator kegiatan. Dalam implementasi sistem, peran ini dijalankan oleh:
>
> - **`admin-komdis` / `super-admin`** untuk kegiatan resmi organisasi (sasaran: seluruh anggota resmi).
> - **`admin-or` / `super-admin`** untuk kegiatan Open Recruitment (sasaran: calon anggota / caang).

---

## 3. Alur Kerja 1: Manajemen Presensi Digital & Sanksi Kehadiran (`attendance.bpmn.xml`)

Alur kerja presensi mengatur pelaksanaan absensi kegiatan/rapat, pengelolaan pengajuan izin, perhitungan akumulasi poin pelanggaran kehadiran, hingga penerbitan Surat Peringatan (SP) sesuai aturan [SOP_KEGIATAN_KOMDIS.md](SOP_KEGIATAN_KOMDIS.md).

### 3.1. Klasifikasi 2 Kategori Kegiatan & Presensi

Sistem membagi manajemen kegiatan dan presensi ke dalam 2 (dua) kategori terpisah:

1. **Kegiatan Resmi Organisasi**:
   - **Sasaran Peserta**: Seluruh Anggota Resmi (`super-admin`, `admin-komdis`, `admin-or`, `admin-kestari`, `admin-divisi`, dan `anggota`).
   - **Contoh Agenda**: Musyawarah Besar (Mubes), Rapat Global, Rapat Kerja (Raker), Pelantikan DPH, Pelantikan Baju, dsb.
   - **Penyelenggara (CRUD & Scanner)**: `admin-komdis` dan `super-admin`.
   - **Approval Izin**: `admin-komdis` dan `super-admin`.
   - **Sanksi**: Berupa **Poin Pelanggaran Kedisiplinan** (bukan denda finansial) yang diakumulasi untuk penerbitan SP oleh Komdis.

2. **Kegiatan Khusus Calon Anggota (OR / Caang)**:
   - **Sasaran Peserta**: Calon Anggota (`caang`).
   - **Contoh Agenda**: Demo Robot, Pelatihan Dasar Teknis, Pembekalan Magang, Evaluasi Mini Project, dsb.
   - **Penyelenggara (CRUD & Scanner)**: `admin-or` dan `super-admin`.
   - **Approval Izin**: `admin-or` dan `super-admin`.
   - **Sanksi**: Evaluasi kelulusan tahapan OR. Anggota resmi yang bertugas wajib hadir pada pelatihan caang dikenakan sanksi 5 poin jika tidak hadir.

### 3.2. Spesifikasi Alur Kerja Presensi

```text
[ Pemrakarsa: Admin ] ──(Buat Kegiatan)──> [ Sistem ] ──(Rilis Sesi Presensi)
                                                                 │
┌────────────────────────────────────────────────────────────────┴─────────────────────────────────┐
│                                       PROSES PRESENSI                                            │
│ [ Peserta: Anggota/Caang ] ──(Generate QR Pribadi)──> [ Admin Scanner ] ──(Scan QR)──> [ Tercatat] │
│           │                                                                                      │
│           └──(Ajukan Izin / Sakit)──> [ Verifikasi Admin: Approve/Reject ] ──────────────────────┤
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                 │
                                                                 ▼
                                                  [ Tutup Sesi & Hitung Poin ]
                                                                 │
                                                   (Khusus Kegiatan Anggota)
                                                                 │
                                                ┌────────────────┴────────────────┐
                                                ▼                                 ▼
                                       [ Poin >= Ambang SP? ]              [ Poin Aman ]
                                                │                                 │
                                              [Ya]                             [Tidak]
                                                │                                 │
                                                ▼                                 ▼
                                      [ Sistem Generate Draf SP ]       [ Rekap Tersimpan ]
                                                │
                                                ▼
                                      [ Komdis Review & Terbitkan ]
```

### 3.3. Skema Poin Pelanggaran Kedisiplinan (SOP Komdis)

Berdasarkan [SOP_KEGIATAN_KOMDIS.md](SOP_KEGIATAN_KOMDIS.md), penalti ketidakhadiran pada kegiatan resmi organisasi dihitung sebagai berikut:

| Kategori Kehadiran / Pelanggaran                                | Poin Pelanggaran | Tindakan & Sanksi Tambahan                                        |
| :-------------------------------------------------------------- | :--------------: | :---------------------------------------------------------------- |
| **Hadir Tepat Waktu (Atribut Lengkap)**                         |     `0 Poin`     | Presensi terverifikasi normal.                                    |
| **Tidak Hadir Tanpa Kabar (Alfa)**                              |    `+15 Poin`    | Pelanggaran berat absensi kegiatan formal.                        |
| **Tidak Hadir dengan Alasan Tidak Diterima (Izin Ditolak)**     |    `+10 Poin`    | Bukti tidak sah / alasan tidak dapat dipertanggungjawabkan.       |
| **Tidak Hadir dengan Alasan Diterima (Izin Disetujui)**         |    `+5 Poin`     | Wajib disertai bukti pendukung yang sah dan disetujui Komdis.     |
| **Tidak Hadir Pelatihan Caang (Bagi Anggota yang Wajib Hadir)** |    `+5 Poin`     | Dikenakan per sesi pelatihan yang ditinggalkan.                   |
| **Terlambat > 1 Jam (Izin Diterima)**                           |    `+3 Poin`     | Diizinkan masuk + sanksi fisik setengah dari waktu keterlambatan. |
| **Terlambat > 1 Jam (Izin Ditolak)**                            |    `+5 Poin`     | Diizinkan masuk + sanksi fisik setengah dari waktu keterlambatan. |
| **Terlambat < 1 Jam**                                           |     `0 Poin`     | Sanksi fisik langsung di tempat oleh Komdis.                      |
| **Atribut Tidak Lengkap**                                       |     `0 Poin`     | Sanksi fisik $15\times$ per atribut yang tidak lengkap.           |

### 3.4. Ambang Batas Akumulasi Poin & Surat Peringatan (SP)

Akumulasi poin kedisiplinan dievaluasi secara otomatis oleh sistem untuk memicu draf sanksi:

1. **Surat Peringatan 1 (SP 1) — Akumulasi $\ge 30$ Poin**:
   - **Sanksi**: Melaksanakan gotong royong (goro) kebersihan minimal **4 (empat) kali dalam sebulan**.
   - **Pemulihan**: Jika dilaksanakan sungguh-sungguh dan diverifikasi Komdis, dilakukan pemutihan/pengurangan sebesar **10 Poin**.
2. **Surat Peringatan 2 (SP 2) — Akumulasi $\ge 50$ Poin**:
   - **Sanksi**: Penahanan seragam (baju PDH), peninjauan ulang kelayakan mengikuti Kontes Robot Indonesia (KRI), dan kewajiban goro minimal **6 (enam) kali dalam sebulan**.
   - **Pemulihan**: Jika dilaksanakan sungguh-sungguh, dilakukan pemutihan sebesar **15 Poin** dan evaluasi pengembalian baju.
3. **Surat Peringatan 3 (SP 3) — Akumulasi $\ge 100$ Poin**:
   - **Kriteria**: Akumulasi mencapai 100 poin atau terbukti tidak berkontribusi dalam organisasi/divisi dalam kurun waktu yang ditentukan.
   - **Sanksi**: **Dikeluarkan dari keanggotaan UKM Robotik PNP**.

---

## 4. Alur Kerja 2: Manajemen Operasional Piket Workshop & Denda Administratif (`piket.bpmn.xml`)

Alur kerja piket workshop mengatur penjadwalan pembersihan workshop, notifikasi pengingat H-1, pengunggahan bukti kondisi workshop, validasi oleh Kesekretariatan, serta pengenaan denda administratif finansial bagi yang melanggar.

> [!IMPORTANT]
> **Pemisahan Wewenang Kesekretariatan:**
> Manajemen piket workshop sepenuhnya dikelola oleh **Kesekretariatan (`admin-kestari`)** dan `super-admin`. Komisi Disiplin (`admin-komdis`) **tidak mengurus** piket workshop maupun pengenaan denda finansialnya.

### 4.1. Spesifikasi Langkah-demi-Langkah Piket Workshop

```text
[ Admin-Kestari ] ──(Input Jadwal Rotasi)──> [ Sistem ] ──(Reminder H-1 Pukul 18.00 WIB)
                                                                    │
                                                                    ▼
                                                        [ Petugas: Anggota Resmi ]
                                                                    │
                                                           (Laksanakan Piket)
                                                                    │
                                                                    ▼
                                                      [ Upload Foto Bukti Workshop ]
                                                       (Private Cloudflare R2 Bucket)
                                                                    │
                                                                    ▼
                                                      [ Admin-Kestari Cek & Review ]
                                                                    │
                                                    ┌───────────────┴───────────────┐
                                                    ▼                               ▼
                                             [ Bukti Valid? ]             [ Alfa / Tidak Valid ]
                                                    │                               │
                                                  [Ya]                           [Tidak]
                                                    │                               │
                                                    ▼                               ▼
                                           [ Status: Selesai ]          [ Catat Denda Dinamis ]
```

#### Detail Tahapan Operasional:

1. **Penyusunan Jadwal Shift**:
   - `admin-kestari` / `super-admin` menyusun jadwal rotasi piket harian anggota resmi di dashboard (`/dashboard/piket/schedule`).
   - Petugas yang dijadwalkan adalah seluruh **Anggota Resmi** (`super-admin`, `admin-komdis`, `admin-or`, `admin-kestari`, `admin-divisi`, `anggota`). Role `caang` dan `alumni` **tidak** memiliki tugas piket workshop.
2. **Notifikasi Pengingat Otomatis**:
   - Sistem mengirimkan pengingat otomatis H-1 setiap hari pukul 18.00 WIB kepada petugas shift besok via push notification dashboard dan email.
3. **Pelaksanaan & Pelaporan Bukti**:
   - Petugas melaksanakan pembersihan area workshop sesuai checklist standar operasional.
   - Petugas mengunggah foto kondisi workshop setelah dibersihkan ke private storage **Cloudflare R2** (`piket-proofs`).
4. **Verifikasi & Pengenaan Denda Finansial Dinamis**:
   - `admin-kestari` memeriksa dan memvalidasi keabsahan foto bukti yang diunggah.
   - Jika laporan disetujui (_Approve_), status piket ditandai _Completed_.
   - Jika petugas tidak piket (_Alfa_) atau laporan ditolak/tidak memenuhi standar kebersihan, sistem secara otomatis mencatat **Denda Administratif Keuangan** ke dalam rekapitulasi kas kesekretariatan.
   - **Ketentuan Nominal Denda**: Bersifat **dinamis** dan ditetapkan berdasarkan keputusan kepengurusan pada periode yang berjalan (sebagai referensi, pada periode 2025/2026 denda ditetapkan sebesar Rp10.000 per kejadian tidak piket).

---

## 5. Alur Kerja 3: Open Recruitment (OR), Pelatihan, Magang, Project & Pelantikan (`recruitment.bpmn.xml`)

Alur Open Recruitment (OR) merupakan siklus penerimaan calon anggota baru yang dikelola secara terpusat oleh **`admin-or`** bersama **`admin-divisi`** dan **`super-admin`**. (`admin-komdis` tidak memiliki hak akses seleksi berkas ataupun input nilai pada alur ini).

### 5.1. Spesifikasi 8 Tahapan Open Recruitment (OR)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: PENDAFTARAN & SELEKSI ADMINISTRASI BERKAS                                      │
│ [ Admin-OR ] Publish OR Window ──> [ Caang ] Isi Formulir Online ──> [ Seleksi Berkas ] │
│                                                                            │            │
│                                              ┌─────────────────────────────┼───────────┐│
│                                              ▼                             ▼           ▼│
│                                       [ Lolos Berkas ]             [ Perbaikan Data ]  [ Ditolak ]
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 2: DEMO ROBOT                                                                     │
│ [ UKM Robotik ] Demonstrasi Divisi Robotika & Pengenalan Teknologi ──> [ Caang Hadir ]  │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 3: WAWANCARA 1 (KEPRIBADIAN & MOTIVASI)                                           │
│ [ Admin-OR ] Jadwalkan Wawancara 1 ──> [ Caang ] Wawancara Keorganisasian & Minat Bakat │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 4: PELATIHAN DASAR TEKNIS                                                         │
│ [ Pemateri ] Pelatihan 3 Modul (Elektronika, Mekanik, Pemrograman) ──> [ Caang Praktik ] │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 5: MAGANG DIVISI & MAGANG DEPARTEMEN                                              │
│ [ Admin-OR & Admin-Divisi ] Alokasi Slot Divisi (KRSBI/KRI/KRSTI) & Departemen          │
│ [ Admin-Divisi ] Monitoring Kehadiran Khusus Divisi & Evaluasi Keaktifan                │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 6: PENGERJAAN MINI PROJECT ROBOTIKA                                               │
│ [ Caang ] Pengerjaan Project Terapan Kelompok ──> [ Caang ] Submit Logbook Progres      │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 7: WAWANCARA 2 (PENGUJIAN TEKNIS & PROJECT)                                       │
│ [ Admin-OR & Penguji ] Sidang Evaluasi Mini Project, Penguasaan Teknis & Kesiapan       │
└──────────────────────────────────────────────┬──────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────────────────────┐
│ TAHAP 8: EVALUASI PLENO & PELANTIKAN ANGGOTA                                            │
│ [ Rapat Pleno ] Keputusan Kelulusan ──> [ End: Pelantikan Resmi Anggota Baru ]          │
│ *(Catatan: Penandatanganan & Upload Scan SK Pelantikan saat ini diproses secara manual)*│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Detail Rincian 8 Tahapan OR:

1. **Tahap 1 — Pendaftaran & Seleksi Berkas**:
   - `admin-or` membuka jendela pendaftaran OR di dashboard.
   - Pendaftar mengisi data profil, riwayat akademik, dan mengunggah dokumen persyaratan.
   - `admin-or` melakukan verifikasi: _Lolos Berkas_, _Perbaikan Data_, atau _Ditolak_.
2. **Tahap 2 — Demo Robot**:
   - Penyelenggaraan demonstrasi langsung seluruh divisi robotika (KRSBI Beroda, KRSBI Humanoid, KRI, KRSTI, dsb.) guna memberikan gambaran teknis dan etos kerja riset robotika kepada calon anggota.
3. **Tahap 3 — Wawancara 1 (Keorganisasian & Kepribadian)**:
   - Evaluasi komitmen waktu, kepribadian, integritas, visi keorganisasian, serta minat divisi calon anggota oleh `admin-or`.
4. **Tahap 4 — Pelatihan Dasar Teknis**:
   - Pembekalan teori dan praktikum 3 modul inti: Elektronika dasar, Mekanik & perancangan fisik, serta Pemrograman mikrokontroler/embedded system.
5. **Tahap 5 — Magang Divisi & Magang Departemen**:
   - Calon anggota ditempatkan pada divisi robotika pilihan serta departemen organisasi.
   - `admin-divisi` memantau presensi internal divisi dan menilai parameter keaktifan, inisiatif, serta adaptabilitas kerja tim.
6. **Tahap 6 — Pengerjaan Mini Project**:
   - Calon anggota mengerjakan proyek robotika dalam kelompok kecil dan mencatatkan logbook progres harian/mingguan.
7. **Tahap 7 — Wawancara 2 (Sidang Teknis & Evaluasi Project)**:
   - Pengujian pemahaman teknis, demonstrasi hasil kerja mini project, dan evaluasi kelayakan final calon anggota oleh tim penguji dan `admin-or`.
8. **Tahap 8 — Evaluasi Pleno & Pelantikan Resmi**:
   - Rapat pleno pengurus dan pembina menetapkan kelulusan akhir calon anggota.
   - Calon anggota yang lulus dikukuhkan dalam acara **Pelantikan Resmi Anggota UKM Robotik PNP**.
   - _Status Digitalisasi SK_: Proses penerbitan dan pengunggahan berkas scan Surat Keputusan (SK) Pelantikan saat ini masih berlangsung secara manual/non-digital sehingga belum disediakan fitur upload digital di sistem.

---

## 6. Matriks Integrasi Peran & Hak Akses (RBAC Workflow Matrix - 8 Role)

Matriks berikut menjabarkan hak akses operasional secara komprehensif untuk seluruh **8 (delapan) role**:

| Kode Alur Kerja | Tahapan Akses / Workflow Step                     | Super Admin |  Admin-Komdis   |   Admin-OR    | Admin-Kestari |  Admin-Divisi  | Anggota | Caang | Alumni |
| :-------------- | :------------------------------------------------ | :---------: | :-------------: | :-----------: | :-----------: | :------------: | :-----: | :---: | :----: |
| `WF-ATT-01A`    | Buat Sesi Kegiatan Resmi Organisasi               |     [x]     |       [x]       |      [-]      |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-ATT-01B`    | Buat Sesi Kegiatan Khusus OR / Caang              |     [x]     |       [-]       |      [x]      |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-ATT-02A`    | Scan Presensi QR (Admin Scanner)                  |     [x]     | [x] _(Anggota)_ | [x] _(Caang)_ |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-ATT-02B`    | Generate QR Presensi Pribadi (Peserta)            |     [x]     |       [x]       |      [x]      |      [x]      |      [x]       |   [x]   |  [x]  |  [x]   |
| `WF-ATT-03`     | Approve Pengajuan Izin Presensi                   |     [x]     | [x] _(Anggota)_ | [x] _(Caang)_ |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-PIK-01`     | Setup Jadwal Piket Workshop                       |     [x]     |       [-]       |      [-]      |      [x]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-PIK-02`     | Upload Bukti Foto Piket Workshop (Cloudflare R2)  |     [x]     |       [x]       |      [x]      |      [x]      |      [x]       |   [x]   |  [-]  |  [-]   |
| `WF-PIK-03`     | Verifikasi Bukti Piket & Catat Denda Dinamis      |     [x]     |       [-]       |      [-]      |      [x]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-REC-01`     | Publish Open Recruitment (OR) Window              |     [x]     |       [-]       |      [x]      |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |
| `WF-REC-02`     | Seleksi Berkas, Wawancara & Input Nilai OR        |     [x]     |       [-]       |      [x]      |      [-]      | [x] _(Magang)_ |   [-]   |  [-]  |  [-]   |
| `WF-REC-03`     | Upload Scan SK Pelantikan Resmi _(Belum Digital)_ |     [-]     |       [-]       |      [-]      |      [-]      |      [-]       |   [-]   |  [-]  |  [-]   |

> [!NOTE]
>
> - `WF-ATT-02B`: Seluruh 8 role memiliki hak menampilkan QR code dinamis pribadi di dashboard mereka untuk dipindai oleh admin scanner bertugas saat kegiatan berlangsung.
> - `WF-REC-03`: Ditandai `[-]` untuk seluruh role karena tahapan penandatanganan dan pengarsipan SK Pelantikan belum didigitalisasi ke dalam sistem.

---

## 7. Automasi Backend & Integrasi Sistem (_System Triggers_)

Seluruh alur kerja didukung oleh otomatisasi logika serverless yang tangguh:

1. **Database Triggers & RLS Policies (Supabase / PostgreSQL)**:
   - Enkapsulasi data dengan Row-Level Security (RLS) $100\%$ berbasis peran JWT token yang diverifikasi via `supabase.auth.getUser()`.
2. **Cloudflare R2 Private Storage**:
   - Penyimpanan aman berkas bukti foto piket workshop pada bucket `piket-proofs` dengan validasi MIME-type dan kompresi di sisi klien.
3. **Scheduled Cron Jobs (Upstash / Vercel Cron)**:
   - _Automated Session Closer_: Menutup jendela pemindaian sesi presensi secara otomatis saat batas waktu kedaluwarsa tercapai.
   - _Daily Piket Reminder_: Menembak pengingat tugas piket H-1 setiap hari pukul 18.00 WIB kepada anggota yang bertugas besok.
4. **Disciplinary & Audit Engine**:
   - Kalkulasi otomatis akumulasi poin kedisiplinan dan auto-generate draf SP Komdis sesuai ambang batas SOP.
   - Pencatatan log mutasi administrasi ke dalam tabel `audit_logs` yang bersifat _append-only_ / terlindungi pemicu anti-mutasi.

---

## 8. Checklist Verifikasi Operasional Alur Kerja

- [ ] Seluruh diagram alur BPMN 2.0 tersinkronisasi penuh dengan logika aplikasi Next.js App Router dan Server Actions.
- [ ] Hak akses RBAC terpasang ketat pada 8 role dengan pemisahan domain Komdis, OR, Kestari, dan Divisi.
- [ ] Logika akumulasi poin pelanggaran presensi berjalan presisi sesuai [SOP_KEGIATAN_KOMDIS.md](SOP_KEGIATAN_KOMDIS.md).
- [ ] Penyimpanan foto bukti piket workshop terkonfigurasi ke Cloudflare R2 dengan retensi yang aman.
- [ ] 8 tahapan alur Open Recruitment (OR) terpetakan jelas pada antarmuka dashboard dan repositori data.
- [ ] Seluruh Cron Job pengingat piket dan notifikasi otomatis berjalan optimal tanpa hambatan.

---

_Dokumen ini diterbitkan sebagai standar panduan dokumentasi alur kerja bisnis resmi UKM Robotik Politeknik Negeri Padang._
