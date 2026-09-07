# Induk Kerangka Kerja Keamanan Informasi & Kepatuhan Regulasi (ISMS Master Framework)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| **ID Dokumen Master**                 | `DOC-SEC-MST-00`                                                                                     |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Audit-Ready Release)                                                      |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                                       |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                              |
| **Sistem Induk (_Master Framework_)** | **Information Security Management System (ISMS)** & **Privacy Information Management System (PIMS)** |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Security Governance UKM Robotik PNP                                                         |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                                             |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                         |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Folder `07-compliance-security` merupakan **Pusat Tata Kelola Keamanan Informasi, Pelindungan Data Pribadi, dan Kepatuhan Regulasi (ISMS Master Directory)** pada Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.

Arsitektur tata kelola ini dirancang secara komprehensif untuk menghubungkan:

1. **Aturan Kebijakan Internal Keamanan Siber** (`security-policies/`).
2. **Prosedur Operasional Tanggap Insiden, Log Audit, & Backup** (`audit-trails/`).
3. **Landasan Hukum & Perundang-undangan Nasional Indonesia** (`regulations/`).
4. **Standar Keamanan Informasi Internasional** (`standards/`).

---

## 2. Landasan Hukum & Pemetaan Standar Internasional

Sistem ini wajib mematuhi hirarki regulasi nasional dan standar teknis siber berikut:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    HIRARKI STANDAR & REGULASI                          │
 ├──────────────────────────────────┬─────────────────────────────────────┤
 │ Regulasi Nasional Indonesia      │ Standar Keamanan Internasional      │
 ├──────────────────────────────────┼─────────────────────────────────────┤
 │ • UU No. 27 Tahun 2022 (UU PDP)  │ • ISO/IEC 27001:2022 (ISMS)         │
 │ • PP No. 71 Tahun 2019 (PSTE)    │ • ISO/IEC 27701:2019 (PIMS)         │
 │ • UU ITE (No. 11/2008 & 19/2016) │ • ISO/IEC 27035 (Incident Mgmt)     │
 │ • Permenkominfo No. 5 Tahun 2020 │ • NIST SP 800-63B / SP 800-34       │
 │ • Pedoman IT & Kemahasiswaan PNP │ • OWASP ASVS v4.0 & OWASP Top 10    │
 └──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Peta Navigasi & Indeks Dokumen Terstruktur

Pengelolaan tata kelola dibagi ke dalam **4 (empat) subfolder utama**:

```
docs/07-compliance-security/
├── README.md                           # Master Framework & Central Index (Dokumen Ini)
├── security-policies/                  # Subfolder 1: Kebijakan Keamanan Siber Utama
│   ├── access-control-policy.md        # DOC-SEC-ACC-03 (v2.0.0) - Policy RBAC, SoD & RLS
│   ├── data-classification-handling.md # DOC-SEC-DAT-04 (v2.0.0) - Klasifikasi Data 4-Tier & KMS
│   ├── password-security-standards.md  # DOC-SEC-PWD-02 (v2.0.0) - Standar NIST SP 800-63B & HIBP
│   ├── session-management.md           # DOC-SEC-SES-01 (v2.0.0) - Policy Sesi HTTP-Only & Upstash
│   └── revisi.md                       # Catatan Review & Audit Kebijakan
├── audit-trails/                       # Subfolder 2: Prosedur Operasional & Bukti Audit
│   ├── backup-recovery-procedure.md   # DOC-AUD-BCP-03 (v2.0.0) - Arsitektur Backup 3-2-1-1-0
│   ├── compliance-checklist.md         # DOC-AUD-CHK-04 (v2.0.0) - Compliance Program & CI/CD SAST
│   ├── incident-response-plan.md       # DOC-AUD-IRP-02 (v2.0.0) - IRP SLA, Playbooks & Forensik
│   └── logging-strategy.md             # DOC-AUD-LOG-01 (v2.0.0) - Log Strategy, Immutability & Audit
├── regulations/                        # Subfolder 3: Perundang-undangan Nasional & Kampus
│   ├── uu-pdp-27-2022.md               # UU No. 27/2022 (Pelindungan Data Pribadi)
│   ├── pp-71-2019.md                   # PP No. 71/2019 (PSTE)
│   ├── uu-11-2008.md                   # UU ITE No. 11/2008
│   ├── uu-19-2016.md                   # Perubahan UU ITE No. 19/2016
│   ├── permenkominfo-5-2020.md         # Permenkominfo No. 5/2020 (PSE Privat)
│   └── pedoman-pnp.md                  # Pedoman Kampus Politeknik Negeri Padang
└── standards/                          # Subfolder 4: Standar Keamanan Internasional
    ├── iso-iec-27701-2019-pims.md      # ISO/IEC 27701:2019 Privacy Management
    └── owasp_10_2025.md                # OWASP Top 10 (Release 2025)
```

---

## 4. Ringkasan Fungsi Berkas per Subfolder

### 4.1 Subfolder `security-policies/` (Kebijakan Keamanan Siber)

- 📄 **[access-control-policy.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/security-policies/access-control-policy.md)** (`v2.0.0`): Mengatur hierarki 8 Role RBAC, pengetatan _least privilege_ (pencabutan CRUD `legacy_members` dari `admin-or`), penegakan _Dual Control / Maker-Checker_ untuk keuangan `or_settings`, kontrol pengubahan status pendaftaran (`registrations`), template policy RLS Supabase, pengujian `pgTAP`, dan wajib MFA Admin.
- 📄 **[data-classification-handling.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/security-policies/data-classification-handling.md)** (`v2.0.0`): Mengatur klasifikasi 4 tingkat data (Publik, Internal, Rahasia, Sangat Rahasia/Restricted), pemisahan tegas Hashing (Argon2id/Bcrypt) vs Enkripsi Disk (AES-256) vs Key Management System (KMS), pengamanan Signed URL 15 menit, penyamaran PII (`****1234`), verifikasi identitas hak subjek data (SLA $\le 3 \times 24$ Jam UU PDP), dan larangan PII produksi untuk testing.
- 📄 **[password-security-standards.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/security-policies/password-security-standards.md)** (`v2.0.0`): Mengatur keamanan password selaras NIST SP 800-63B (dukungan passphrase Unicode/spasi, minimal 8/12 karakter, tanpa aturan komposisi kaku), pemindaian kata sandi bocor via HaveIBeenPwned k-Anonymity API, estimator entropi `zxcvbn`, penegakan MFA Admin, rate limiting per-akun Upstash, dan token reset password TTL 15–30m.
- 📄 **[session-management.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/security-policies/session-management.md)** (`v2.0.0`): Mengatur batas waktu sesi (_Idle & Absolute Timeout_ per role), batasan sesi konkuren, rotasi Refresh Token dengan _reuse detection_, cookie HTTP-Only `SameSite=Lax`, Upstash Distributed Rate Limiting, dan prosedur _break-glass_ rotasi JWT Secret.

---

### 4.2 Subfolder `audit-trails/` (Prosedur Operasional & Bukti Audit)

- 📄 **[incident-response-plan.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/audit-trails/incident-response-plan.md)** (`v2.0.0`): Menyediakan alur 6 fase tanggap insiden, matriks SLA waktu per severity (SEV-0 s.d. SEV-3), 6 Playbooks operasional spesifik stack (Next.js/Supabase/Vercel/Upstash), prosedur preservasi bukti digital (SHA-256 & ISO 27001 A.5.28), template notifikasi UU PDP, dan jadwal _tabletop exercise_.
- 📄 **[logging-strategy.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/audit-trails/logging-strategy.md)** (`v2.0.0`): Memetakan log full-stack, matriks retensi log Hot (12 bln) vs Cold Archive, multi-layer immutability (PL/pgSQL trigger `prevent_audit_log_tampering()`, revokasi DB role, & SHA-256 hash signature), matriks alerting threshold, skema JSON v2.0 dengan correlation ID, dan sinkronisasi NTP UTC.
- 📄 **[backup-recovery-procedure.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/audit-trails/backup-recovery-procedure.md)** (`v2.0.0`): Menerapkan arsitektur backup 3-2-1-1-0 (CISA / NIST SP 800-34), penyetaraan RPO/RTO harian per komponen, backup konfigurasi & IaC code, KMS Key Management (ISO 27001 A.8.24), immutable S3 WORM storage, clean-room restore ransomware, dan 10-step cutover checklist.
- 📄 **[compliance-checklist.md](file:///d:/Project/robotik-pnp/docs/07-compliance-security/audit-trails/compliance-checklist.md)** (`v2.0.0`): Menyediakan program kepatuhan berkelanjutan, pemetaan ke ISO 27001/CIS/OWASP/UU PDP, matriks SLA remediasi temuan ($\le 24$j s.d. $\le 90$j), kontrol otomatis CI/CD (SAST `npm audit`/Secret Scan), sertifikasi ulang akses triwulanan, DPIA, dan kewajiban artefak bukti digital.

---

### 4.3 Subfolder `regulations/` (Hukum & Perundang-undangan)

- 📄 **`uu-pdp-27-2022.md`**: Rujukan resmi Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Asas, Hak Subjek Data, Kewajiban Pengendali Data, Breach Notification SLA $3 \times 24$ Jam, dan Sanksi Pidana/Administratif).
- 📄 **`pp-71-2019.md`**: Peraturan Pemerintah No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE).
- 📄 **`uu-11-2008.md`** & **`uu-19-2016.md`**: Undang-Undang Informasi dan Transaksi Elektronik (ITE) beserta perubahannya (Aturan Akses Ilegal, Intersepsi, Alterasi Data, dan Keabsahan Dokumen Elektronik).
- 📄 **`permenkominfo-5-2020.md`**: Peraturan Menteri Kominfo No. 5 Tahun 2020 tentang Penyelenggara Sistem Elektronik (PSE) Lingkup Privat.
- 📄 **`pedoman-pnp.md`**: Aturan internal Kode Etik Kemahasiswaan, Aturan IT Kampus, dan Tata Kelola Organisasi Mahasiswa Politeknik Negeri Padang.

---

### 4.4 Subfolder `standards/` (Standar Keamanan Internasional)

- 📄 **`iso-iec-27701-2019-pims.md`**: Standar Privacy Information Management System (PIMS) sebagai ekstensi ISO/IEC 27001 untuk tata kelola privasi data pribadi.
- 📄 **`owasp_10_2025.md`**: Panduan mitigasi top 10 ancaman kerentanan aplikasi web mutakhir riset OWASP 2025 (Broken Access Control, Cryptographic Failures, Injection, SSRF, dsb).

---

## 5. Matriks Pemetaan Kepatuhan Lintas Dokumen (_Cross-Standard Mapping Matrix_)

Seluruh dokumen kebijakan dan audit trail terhubung secara langsung dengan standar internasional:

| Berkas Dokumen ISMS               | Referensi UU PDP            | ISO/IEC 27001:2022    | CIS Controls v8       | NIST / OWASP Standard      |
| :-------------------------------- | :-------------------------- | :-------------------- | :-------------------- | :------------------------- |
| `access-control-policy.md`        | Pasal 16, 31                | Annex A.5.15, A.5.18  | Control 5, Control 6  | OWASP ASVS V2 & V3         |
| `data-classification-handling.md` | Pasal 4, 16, 32, 43         | Annex A.8.10, A.8.24  | Control 3, Control 13 | NIST SP 800-57 (KMS)       |
| `password-security-standards.md`  | Pasal 35                    | Annex A.5.17          | Control 5.2, 5.4      | NIST SP 800-63B            |
| `session-management.md`           | Pasal 35                    | Annex A.8.20, A.8.24  | Control 6.3, 6.5      | OWASP Session Mgmt         |
| `incident-response-plan.md`       | Pasal 46 (SLA $3\times24$j) | Annex A.5.24 - A.5.28 | Control 17            | NIST SP 800-61 / ISO 27035 |
| `logging-strategy.md`             | Pasal 31                    | Annex A.8.15, A.8.16  | Control 8             | NIST SP 800-92             |
| `backup-recovery-procedure.md`    | Pasal 35                    | Annex A.8.13, A.8.14  | Control 11            | NIST SP 800-34 (3-2-1-1-0) |
| `compliance-checklist.md`         | Pasal 35, 39                | Annex A.5.35, A.8.8   | Control 7, Control 18 | OWASP ASVS v4.0            |

---

## 6. Ritme Operasional Keamanan (_Security Operational Rhythm Calendar_)

Pelaksanaan pengawasan keamanan dijalankan berdasarkan ritme waktu yang teratur:

```
  HARIAN               MINGGUAN               BULANAN              TRIWULANAN            TAHUNAN / H-30 OPREC
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
 │ • Backup DB  │ ──> │ • Review Log │ ──> │ • Uji Restore│ ──> │ • Access     │ ──> │ • Tabletop IRP      │
 │   02.00 WIB  │     │   Sentry     │     │   Staging    │     │   Recert.    │     │ • Annual DPIA       │
 │ • Storage Sync│     │ • Review Rate│     │ • Cleanup    │     │ • Rotasi     │     │ • PenTest System    │
 │   03.00 WIB  │     │   Limit      │     │   Demisioner │     │   Secret Key │     │ • Vendor Risk Review│
 └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └─────────────────────┘
```

---

## 7. Prosedur Pembaruan & Kontrol Perubahan Dokumen ISMS

1. Dokumen di dalam folder `07-compliance-security` ditinjau secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi insiden siber major (SEV-0/SEV-1).
2. Setiap perubahan wajib mencantumkan versi baru pada tabel _Document Control_ dan mendapat persetujuan tertulis dari **Lead IT**, **Ketua Umum**, dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Tata Kelola Keamanan Informasi & Kepatuhan Resmi UKM Robotik Politeknik Negeri Padang._
