# Induk Tata Kelola Pandangan Proses & Alur Kerja Bisnis (Process View & Business Workflow Master Framework)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                         |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------ |
| **ID Dokumen Master**                 | `DOC-PRC-MST-00`                                                                                              |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Audit-Ready Release)                                                               |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                                                |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                                       |
| **Sistem Induk (_Master Framework_)** | **Business Process & Workflow Governance Policy** (Bagian dari 4+1 Architectural View & ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Process Governance UKM Robotik PNP                                                                   |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                                  |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Folder `04-process-view` merupakan **Pusat Tata Kelola Pandangan Proses & Alur Kerja Bisnis (Process View Master Directory)** pada Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.

Arsitektur tata kelola ini dirancang secara komprehensif untuk menguraikan dinamika sistemik, alur proses bisnis operasional, serta interaksi antar-aktor dan subsistem berbasis standar internasional **BPMN 2.0 (ISO/IEC 19510)**.

Folder ini menghubungkan:

1. **Model Diagram Proses Bisnis BPMN 2.0** (`business-process/`).
2. **Dokumentasi & Pedoman Spesifikasi Alur Kerja Lengkap** (`workflow-documentation.md`).

---

## 2. Landasan Pemodelan Proses & Hirarki Standar

Pemodelan alur kerja organisasi mengacu pada hirarki standar proses berikut:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    HIRARKI PEMODELAN PROSES BISNIS                     │
 ├──────────────────────────────────┬─────────────────────────────────────┤
 │ Standar Internasional Pemodelan  │ Domain Proses Operasional Utama     │
 ├──────────────────────────────────┼─────────────────────────────────────┤
 │ • ISO/IEC 19510 (BPMN 2.0)       │ • Manajemen Presensi Digital        │
 │ • ISO 9001:2015 (Quality Mgmt)   │ • Manajemen Operasional Piket Lab   │
 │ • ISO/IEC 27001:2022 (ISMS RBAC) │ • Open Recruitment (Oprec) & Magang │
 └──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Peta Navigasi & Indeks Dokumen Terstruktur

Pengelolaan tata kelola dibagi ke dalam **1 (satu) subfolder model diagram** dan **1 (satu) berkas panduan dokumentasi operasional**:

```
docs/04-process-view/
├── README.md                                           # Master Framework & Central Index (Dokumen Ini)
├── workflow-documentation.md                           # DOC-PRC-WKF-01 (v2.0.0) - Panduan Spesifikasi Alur Kerja Lengkap
└── business-process/                                   # Subfolder 1: Model Diagram BPMN 2.0 (XML)
    ├── attendance.bpmn.xml                             # Diagram BPMN Alur Presensi & Sanksi Kehadiran
    ├── piket.bpmn.xml                                  # Diagram BPMN Alur Piket Laboratorium & Denda
    └── recruitment.bpmn.xml                            # Diagram BPMN Alur Open Recruitment, Pelatihan & Magang
```

---

## 4. Ringkasan Fungsi Berkas per Subfolder & Dokumen

### 4.1 Subfolder `business-process/` (Model Diagram BPMN 2.0 XML)

- 📄 **`attendance.bpmn.xml`**: Model BPMN 2.0 (Enterprise Architect XMI) untuk alur kerja pembuatan sesi rapat formal, pemindaian presensi QR Code dinamis, pengajuan izin/sakit, perhitungan poin otomatis per individu, hingga peng-generate-an draf Surat Peringatan (SP).
- 📄 **`piket.bpmn.xml`**: Model BPMN 2.0 untuk alur kerja operasional penjadwalan piket laboratorium, pengiriman reminder otomatis H-1, unggah foto bukti ke Supabase Storage privat, verifikasi Komdis, dan pencatatan denda otomatis Rp10.000 bagi pelanggar.
- 📄 **`recruitment.bpmn.xml`**: Model BPMN 2.0 komprehensif untuk alur penerimaan anggota baru (Oprec), seleksi administrasi berkas, wawancara 2 tahap, alokasi divisi magang, pelatihan 3 modul teknis (Elektronika, Mekanik, Pemrograman), logbook mini project, rapat evaluasi pleno, hingga penerbitan SK Anggota dan pelantikan.

---

### 4.2 Dokumen Panduan Operasional (_Root File_)

- 📄 **[workflow-documentation.md](file:///d:/Project/robotik-pnp/docs/04-process-view/workflow-documentation.md)** (`DOC-PRC-WKF-01`, `v2.0.0`): Berkas panduan dokumentasi alur kerja bisnis komprehensif yang menguraikan rincian _step-by-step_ dari ketiga diagram BPMN XML, dilengkapi diagram alur ASCII swimlane, pemetaan hak akses **RBAC Matrix**, serta matriks otomatisasi backend (_Cron Jobs, Triggers, & Email Engine_).

---

## 5. Matriks Pemetaan Integrasi Peran & Sistem Operasional

Seluruh alur proses bisnis terhubung langsung dengan pemetaan peran RBAC dan modul sistem:

| Domain Proses Bisnis   | Model BPMN XML         | Peran Utama (Swimlane)               | Modul Aplikasi / Server Action Target                     |
| :--------------------- | :--------------------- | :----------------------------------- | :-------------------------------------------------------- |
| **Manajemen Presensi** | `attendance.bpmn.xml`  | Pemrakarsa, Komdis, Anggota, Backend | `/dashboard/kegiatan`, `submitQRAttendance`, `score.ts`   |
| **Manajemen Piket**    | `piket.bpmn.xml`       | Komdis, Calon Anggota, Backend       | `/dashboard/piket`, `submitPiketProof`, Cron H-1 Reminder |
| **Open Recruitment**   | `recruitment.bpmn.xml` | Admin-OR, Komdis, Caang, Backend     | `/dashboard/oprec`, `registerCaangAction`, `caang.ts`     |

---

## 6. Ritme Operasional Proses Bisnis (_Business Operational Rhythm Calendar_)

Pelaksanaan alur kerja proses bisnis dijalankan berdasarkan ritme waktu yang teratur:

```
  HARIAN               MINGGUAN               BULANAN              MUSIMAN / PERIODIK
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
 │ • Presensi   │ ──> │ • Rekap Poin │ ──> │ • Rekap Denda│ ──> │ • Open Recruitment  │
 │   Rapat/Sesi │     │   Kehadiran  │     │   Piket Lab  │     │   Anggota Baru      │
 │ • Pelaksanaan│     │ • Evaluasi   │     │ • Uji coba   │     │ • Pelatihan 3 Modul │
 │   Piket Lab  │     │   Logbook    │     │   Automasi   │     │ • Pelantikan        │
 │ • Reminder   │     │   Magang     │     │   System     │     │   Anggota Resmi     │
 │   H-1 Piket  │     │              │     │              │     │                     │
 └──────────────┘     └──────────────┘     └──────────────┘     └─────────────────────┘
```

---

## 7. Prosedur Pembaruan & Kontrol Perubahan Dokumen Process View

1. Dokumen di dalam folder `04-process-view` ditinjau secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi penyesuaian alur kerja operasional organisasi / pembaruan struktur kepengurusan.
2. Setiap perubahan wajib mencantumkan versi baru pada tabel _Document Control_ dan mendapat persetujuan tertulis dari **Lead IT**, **Ketua Umum**, dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Tata Kelola Pandangan Proses & Alur Kerja Bisnis Resmi UKM Robotik Politeknik Negeri Padang._
