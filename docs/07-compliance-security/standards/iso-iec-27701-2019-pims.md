# DOKUMENTASI LENGKAP ISO/IEC 27701:2019 (PRIVACY INFORMATION MANAGEMENT SYSTEM - PIMS)

## Extension to ISO/IEC 27001 and ISO/IEC 27002 for Privacy Management

### Panduan Kepatuhan & Arsitektur Sistem untuk AI Agent dan System Architect

---

## BAGIAN I: PANDUAN INTEGRASI REKAYASA SISTEM & AI AGENT (COMPLIANCE & ARCHITECTURE SPECIFICATION)

Dokumentasi ini dirancang khusus sebagai panduan operasional bagi **AI Agent**, **Software Architect**, **Data Protection Officer (DPO)**, dan **Development Team** dalam merancang, mengoperasikan, dan mengevaluasi sistem elektronik yang terakreditasi dan patuh (_compliant_) terhadap standar internasional **ISO/IEC 27701:2019 (Privacy Information Management System / PIMS)**.

---

### 1. DUAL-ROLE SYSTEM ARCHITECTURE (PII CONTROLLER VS PII PROCESSOR)

Dalam arsitektur ISO/IEC 27701:2019, sistem elektronik wajib menentukan perannya secara eksplisit untuk setiap instance pemrosesan data (Clause 5.2.1):

```
+-----------------------------------------------------------------------------------+
|                        ISO/IEC 27701:2019 ROLE DETERMINATION                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ PII Principal ] ---> ( Consent / Contract ) ---> [ PII Controller ]            |
|   (Data Subject)                                     (Menentukan Tujuan & Cara)   |
|                                                              |                    |
|                                                     (Instruksi & Kontrak Clause 7.2.6)
|                                                              v                    |
|                                                     [ PII Processor ]             |
|                                                      (Memproses atas Nama)        |
|                                                              |                    |
|                                                      (Izin Tertulis Clause 8.5.7) |
|                                                              v                    |
|                                                     [ Sub-Processor ]             |
+-----------------------------------------------------------------------------------+
```

| Peran Sistem                           | Tanggung Jawab Utama Sistem                                                                                                                                                   | Klausul Utama ISO 27701 |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| **PII Controller** _(Pengendali Data)_ | Menentukan tujuan dan cara pemrosesan PII, mengelola persetujuan (_consent_), melayani hak Subjek Data (PII Principal), melakukan PIA/DPIA.                                   | Clause 7 & Annex A      |
| **PII Processor** _(Prosesor Data)_    | Memproses PII **hanya berdasarkan instruksi موثوقة / terverifikasi dari PII Controller**, membatasi penggunaan internal (misal: dilarang untuk pemasaran sendiri tanpa izin). | Clause 8 & Annex B      |
| **Joint PII Controller**               | Dua atau lebih Pengendali Data yang bersama-sama menentukan tujuan dan cara pemrosesan PII melalui perjanjian tertulis.                                                       | Clause 7.2.7            |

---

### 2. PRIVACY BY DESIGN & PRIVACY BY DEFAULT TECHNICAL REQUIREMENTS (CLAUSE 7.4 & 8.4)

Sistem yang dibangun wajib menerapkan prinsip _Privacy by Design and Privacy by Default_ melalui kontrol rekayasa software:

```
+-----------------------------------------------------------------------------------+
|                     PRIVACY BY DESIGN & DEFAULT CHECKLIST                         |
+-----------------------------------------------------------------------------------+
| 1. Limit Collection (7.4.1) : Pengumpulan data dibatasi pada batas minimum esensial.|
| 2. Limit Processing (7.4.2) : Pemrosesan hanya untuk tujuan sah yang didokumentasi.|
| 3. Accuracy & Quality (7.4.3): Fitur konfirmasi & verifikasi keakuratan data.      |
| 4. PII Minimization (7.4.4)  : Masking, Pseudonymization, & Anonymization.        |
| 5. Automatic Deletion (7.4.5): Auto-purge temporary files & expired retention.    |
| 6. Transmission Controls (7.4.9): Enkripsi wajib TLS 1.3 / IPsec saat transfer.   |
+-----------------------------------------------------------------------------------+
```

#### Detail Spesifikasi Teknis Minimasi Data (Data Minimization & De-identification):

- **Pseudonimisasi & Anonimisasi (7.4.4):** Data identitas langsung (_Direct Identifiers_) diidentifikasi terpisah dari data transaksi menggunakan _salt hashing_ / tokenisasi.
- **Pembersihan Berkas Sementara / Temporary Files (7.4.6 & 8.4.1):** Cache, log, temporary tables, dan temp file wajib dihapus atau di-purge secara otomatis dalam jangka waktu **<= 24-72 jam** setelah proses selesai.
- **Masa Retensi & Disposal (7.4.7 & 7.4.8):** Setiap tabel/record PII memiliki atribut `retention_period` dan `disposal_due_date` dengan mekanisme _secure wipe_ (overwriting multi-pass) saat terlampaui.

---

### 3. PII PRINCIPAL RIGHTS REST API DESIGN (CLAUSE 7.3)

PII Controller wajib menyediakan REST API/GraphQL endpoints untuk melayani hak-hak PII Principal secara terotomatisasi:

```
[ PII Principal Rights ] ---------------> [ Endpoint API / System Workflow ]
• Hak Transparansi & Informasi ---------> GET  /api/v1/pims/privacy-notice
• Hak Penarikan Consent (7.3.4) --------> POST /api/v1/pims/consent/withdraw
• Hak Keberatan Pemrosesan (7.3.5) -----> POST /api/v1/pims/processing/object
• Hak Akses & Portabilitas (7.3.6/7.3.8)-> GET  /api/v1/pims/data-export (Format JSON/CSV)
• Hak Perbaikan Data (7.3.6) -----------> PUT  /api/v1/pims/profile
• Hak Penghapusan / Erasure (7.3.6) ----> DELETE /api/v1/pims/data-erasure
• Hak Keberatan Automated Decision (7.3.10)-> POST /api/v1/pims/automated-decision/opt-out
```

---

### 4. PRIVACY IMPACT ASSESSMENT (PIA) WORKFLOW (CLAUSE 7.2.5)

Sistem/Agent wajib memicu proses **Privacy Impact Assessment (PIA / DPIA)** secara otomatis saat terjadi kondisi risiko tinggi:

1. **Pemicu PIA:**
   - Penggunaan teknologi baru (misal: AI, Biometrik, Large Language Models).
   - Pemrosesan PII Spesifik/Spesifik (Kesehatan, Keuangan, Biometrik, Anak) dalam skala besar.
   - Pemrofilan (_profiling_) atau pengambilan keputusan otomatis (_automated decision making_).
   - Transfer PII antar-yurisdiksi (_cross-border data transfer_).
2. **Keluaran PIA:** Dokumen analisis dampak yang memuat penilaian risiko terhadap PII Principal dan rencana mitigasi keamanan/privasi.

---

### 5. MITIGASI TRANSFER DATA LINTAS YURISDIKSI (CLAUSE 7.5 & 8.5)

Saat sistem melakukan panggilan API, enkripsi, atau sinkronisasi database ke luar wilayah hukum asal (misal: Cloud Provider kawasan asing):

- **Identify Lawful Basis (7.5.1):** Sistem wajib mencatat dasar hukum transfer (Adequacy Decision, Standard Contractual Clauses / SCC, Binding Corporate Rules / BCR, atau Explicit Consent).
- **Records of Transfer (7.5.3):** Sistem wajib menyimpan rekam jejak (_Audit Log_) transfer data antar negara mencakup: Timestamp, Destination Country, Recipient Entity, Purpose, dan Volume Data.

---

## BAGIAN II: STRUKTUR & RINGKASAN KETENTUAN UTAMA ISO/IEC 27701:2019

### BAB 1: SCOPE (RUANG LINGKUP)

ISO/IEC 27701:2019 menentukan persyaratan dan memberikan panduan untuk membangun, mengimplementasikan, memelihara, dan meningkatkan PIMS secara berkelanjutan sebagai ekstensi dari ISO/IEC 27001 dan ISO/IEC 27002. Berlaku untuk seluruh tipe dan ukuran organisasi (Perusahaan, Pemerintah, NPO) baik bertindak sebagai PII Controller maupun PII Processor.

### BAB 2 & 3: NORMATIVE REFERENCES & TERMS / DEFINITIONS

- **ISO/IEC 27000:** Overview dan kosakata manajemen keamanan informasi.
- **ISO/IEC 27001:2013 & 27002:2013:** Persyaratan ISMS dan Kode Praktik Kontrol Keamanan.
- **ISO/IEC 29100:** Privacy Framework.
- **Definisi Utama:**
  - **PIMS (Privacy Information Management System):** Sistem manajemen keamanan informasi yang diperluas untuk mencakup perlindungan privasi PII.
  - **Joint PII Controller:** PII Controller yang bersama-sama menentukan tujuan dan cara pemrosesan PII.

---

### BAB 5: ELEMEN PERSYARATAN PIMS TERKAIT ISO/IEC 27001

ISO/IEC 27701 memperluas frasa "Information Security" pada ISO/IEC 27001 menjadi **"Information Security and Privacy"**:

- **5.2 Context of the Organization:**
  - **5.2.1 Understanding Context:** Wajib menentukan peran organisasi sebagai PII Controller, Joint Controller, atau PII Processor.
  - **5.2.2 Interested Parties:** Memasukkan PII Principal (Data Subject), Otoritas Pengawas (_Supervisory Authority_), dan Mitra Bisnis dalam daftar pemangku kepentingan.
  - **5.2.3 Scope:** Meninjau kembali ruang lingkup ISMS untuk mencakup aktivitas pemrosesan PII.
- **5.4 Planning:**
  - **5.4.1.2 Risk Assessment Refinement:** Penilaian risiko wajib mengidentifikasi risiko terhadap **Organisasi DAN PII Principal** (dampak privasi individu).
  - **5.4.1.3 Risk Treatment & SoA:** Statement of Applicability (SoA) wajib memuat evaluasi kontrol Annex A (untuk Controller) dan/atau Annex B (untuk Processor) selain ISO 27001 Annex A.

---

### BAB 6: PANDUAN PIMS TERKAIT ISO/IEC 27002 (KONTROL KEAMANAN DAN PRIVASI)

ISO/IEC 27701 memberikan panduan tambahan privasi pada 18 domain kontrol ISO 27002:

- **6.2 Security Policies:** Kebijakan keamanan informasi wajib mengintegrasikan komitmen perlindungan privasi dan PII.
- **6.3 Organization of Information Security:** Pembagian peran dan tanggung jawab spesifik privasi (DPO / Privacy Officer).
- **6.5 Asset Management:** Klasifikasi aset wajib menandai aset yang menyimpan/memproses PII.
- **6.6 Access Control:** Pengatasan akses PII berbasis _Need-to-Know_ dan _Least Privilege_.
- **6.7 Cryptography:** Kebijakan enkripsi PII (_At Rest_, _In Transit_, & _In Use_).
- **6.9 Operations Security:** Logging & Monitoring rekam jejak akses PII; pencegahan malware pada sistem pemroses PII.
- **6.11 System Acquisition, Development & Maintenance:** Keamanan privasi dalam siklus SDLC (DevSecOps), pemisahan test data dari PII nyata.
- **6.12 Supplier Relationships:** Evaluasi vendor/kontraktor yang memproses PII.
- **6.13 Incident Management:** Manajemen insiden keamanan yang mencakup prosedur notifikasi kebocoran data (_PII Breach Notification_).

---

### BAB 7: KONTROL KHUSUS UNTUK PII CONTROLLERS (PENGENDALI DATA)

```
[ CLAUSE 7: PII CONTROLLER CONTROLS ]
├── 7.2 Conditions for Collection & Processing
│   ├── 7.2.1 Purpose Identification & Documentation
│   ├── 7.2.2 Lawful Basis Identification
│   ├── 7.2.3 Consent Mechanism Determination
│   ├── 7.2.4 Obtain & Record Consent
│   ├── 7.2.5 Privacy Impact Assessment (PIA)
│   ├── 7.2.6 Contracts with PII Processors
│   ├── 7.2.7 Joint PII Controller Agreements
│   └── 7.2.8 Records of PII Processing
├── 7.3 Obligations to PII Principals
│   ├── 7.3.1 - 7.3.3 Privacy Notice & Transparency
│   ├── 7.3.4 Consent Withdrawal Mechanism
│   ├── 7.3.5 Objection Mechanism
│   ├── 7.3.6 Access, Correction, & Erasure
│   ├── 7.3.7 Informing Third Parties of Rectification/Erasure
│   ├── 7.3.8 Providing Copy of Processed PII
│   ├── 7.3.9 Request Handling Procedures
│   └── 7.3.10 Automated Decision Making Safeguards
├── 7.4 Privacy by Design & Privacy by Default
│   ├── 7.4.1 Collection Limitation
│   ├── 7.4.2 Processing Limitation
│   ├── 7.4.3 Data Accuracy & Quality
│   ├── 7.4.4 PII Minimization Objectives
│   ├── 7.4.5 De-identification & Deletion
│   ├── 7.4.6 Temporary Files Purging
│   ├── 7.4.7 - 7.4.8 Retention Schedule & Secure Disposal
│   └── 7.4.9 PII Transmission Controls (Encryption)
└── 7.5 PII Sharing, Transfer, & Disclosure
    ├── 7.5.1 Cross-Border Transfer Lawful Basis
    ├── 7.5.2 Transfer Countries & Orgs Verification
    ├── 7.5.3 Records of PII Transfer
    └── 7.5.4 Records of PII Disclosure to Third Parties
```

---

### BAB 8: KONTROL KHUSUS UNTUK PII PROCESSORS (PROSESOR DATA)

```
[ CLAUSE 8: PII PROCESSOR CONTROLS ]
├── 8.2 Conditions for Collection & Processing
│   ├── 8.2.1 Customer Agreement Compliance (SLA/DPA)
│   ├── 8.2.2 Restrictions on Organization's Own Purpose (No Unauthorized Mining)
│   ├── 8.2.3 Marketing & Advertising Use Restrictions
│   ├── 8.2.4 Infringing Instruction Notification (Warning Controller)
│   ├── 8.2.5 Customer Obligations Support
│   └── 8.2.6 Records of PII Processing Categories
├── 8.3 Obligations to PII Principals
│   └── 8.3.1 Forwarding PII Principal Requests to Controller
├── 8.4 Privacy by Design & Privacy by Default
│   ├── 8.4.1 Temporary Files Management
│   ├── 8.4.2 Return, Transfer, or Disposal at Contract End
│   └── 8.4.3 PII Transmission Security Controls
└── 8.5 PII Sharing, Transfer, & Disclosure
    ├── 8.5.1 Cross-Border Transfer Compliance
    ├── 8.5.2 Approved Transfer Jurisdictions
    ├── 8.5.3 Records of PII Disclosure
    ├── 8.5.4 - 8.5.5 Legally Binding Disclosure Notifications
    ├── 8.5.6 Subcontractor Disclosure Transparency
    ├── 8.5.7 Subcontractor Engagement (Written Authorization)
    └── 8.5.8 Subcontractor Change Notification Mechanism
```

---

### ANNEX A & B: NORMATIVE CONTROL TABLES

#### Annex A (PII Controllers Control Objectives & Controls Summary):

- **A.7.2:** Memastikan pemrosesan didasarkan pada hukum sah, tujuan jelas, consent terekam, PIA terlaksana, dan perjanjian processor terikat.
- **A.7.3:** Memastikan transparansi privacy notice, penyediaan fitur consent withdrawal, penanganan permohonan akses/hapus data, dan mitigasi automated profiling.
- **A.7.4:** Memastikan minimasi data, akurasi, pembersihan temp files, retensi teratur, dan enkripsi transmisi.
- **A.7.5:** Memastikan legalitas transfer data internasional dan dokumentasi pengungkapan data pihak ketiga.

#### Annex B (PII Processors Control Objectives & Controls Summary):

- **B.8.2:** Memastikan pemrosesan hanya sesuai instruksi pelanggan (Controller), tidak menggunakan PII untuk iklan sendiri, dan memberitahukan jika instruksi melanggar hukum.
- **B.8.3:** Membantu Controller melayani permohonan PII Principal.
- **B.8.4:** Mengembalikan, memindahkan, atau memusnahkan PII di akhir kontrak secara aman.
- **B.8.5:** Meminta izin tertulis Controller sebelum melibatkan Sub-processor dan mengelola rekam jejak transfer.

---

## BAGIAN III: MAPPING REGULASI LOKAL INDONESIA (UU PDP, PP 71, PERMENKOMINFO 5) KE ISO/IEC 27701:2019

| Domain Keamanan & Privasi                  | ISO/IEC 27701:2019         | UU No. 27 Tahun 2022 (UU PDP) | PP No. 71 Tahun 2019 (PP PSTE) | Permenkominfo No. 5 Tahun 2020 |
| :----------------------------------------- | :------------------------- | :---------------------------- | :----------------------------- | :----------------------------- |
| **Persetujuan & Dasar Hukum**              | Clause 7.2.2, 7.2.3, 7.2.4 | Pasal 20 & 22                 | Pasal 14 Ayat 3                | Pasal 3 Ayat 3c                |
| **Hak Akses & Perbaikan Data**             | Clause 7.3.6               | Pasal 6, 7, 30, 32            | Pasal 14 Ayat 1c, 1d           | Pasal 10 & 36                  |
| **Hak Penghapusan (Erasure/Delisting)**    | Clause 7.3.6, 7.4.5, 7.4.8 | Pasal 8, 43, 44               | Pasal 15, 16, 17, 18           | Pasal 13 - 16                  |
| **Privacy Impact Assessment (PIA)**        | Clause 7.2.5               | Pasal 34                      | Pasal 12                       | Pasal 3 Ayat 3d                |
| **DPO / Penunjukan Officer**               | Clause 5.3.3 & 6.3.1       | Pasal 53                      | Pasal 19 Ayat 2c               | Pasal 25 (Narahubung Local)    |
| **Notifikasi Kebocoran Data (Breach)**     | Clause 6.13.1              | Pasal 46                      | Pasal 14 Ayat 5 & 24(3)        | Pasal 15 & 16                  |
| **Transfer Data Lintas Negara**            | Clause 7.5 & 8.5           | Pasal 56                      | Pasal 20 & 21                  | Pasal 34                       |
| **Sub-Processor / Third Party Management** | Clause 7.2.6 & 8.5.7       | Pasal 51                      | Pasal 11                       | Pasal 12                       |

---

_Dokumentasi ini disusun secara lengkap dan terstruktur sebagai acuan standar pemrosesan sistem elektronik berstandar ISO/IEC 27701:2019 (PIMS)._
