# Prosedur Cadangan & Pemulihan Data (Backup & Recovery Procedure)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                          |
| :------------------------------------ | :--------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-AUD-BCP-03`                                                                               |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Disaster Recovery Release)                                          |
| **Tanggal Efektif**                   | 2 Agustus 2026                                                                                 |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                        |
| **Induk Kebijakan (_Master Policy_)** | _Backup & Recovery Policy_ (Bagian dari Business Continuity Plan / BCP & ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Infrastructure Operations UKM Robotik PNP                                             |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                           |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                   |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                                                    |
| :------: | :--------: | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal jadwal backup harian 02.00 WIB & RTO/RPO target.                                                                                                                                                                                                                             |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan Document Control ISO 27001, Master Policy BCP, RACI Matrix dengan Alternate Operators, dan KPI Keberhasilan.                                                                                                                                                                |
| `v2.0.0` | 02/08/2026 | Security Architect | Revisi Total: Penerapan Arsitektur Backup 3-2-1-1-0, Penyetaraan RPO Storage Harian (<24j), Backup Konfigurasi & IaC, Management Kunci Enkripsi (KMS), Immutable WORM Storage, Alerting Kegagalan Backup, Clean-Room Restore, Batasan PITR, Legal Hold, dan 10-Step Cutover Checklist. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Dokumen ini berkedudukan sebagai standar operasional utama dari **Backup & Recovery Policy** yang bernaung di bawah **Business Continuity Plan (BCP)** dan **Information Security Management System (ISMS)** UKM Robotik PNP. Dokumen ini terintegrasi secara teknis dengan _Data Protection Policy_ (`data-classification-handling.md`) dan _Incident Response Plan_ (`incident-response-plan.md`).

Tujuan utama prosedur ini adalah:

1. Menjamin ketersediaan dan keutuhan data (_Data Integrity_) saat terjadi bencana infrastruktur, serangan ransomware, atau kerusakan data.
2. Menerapkan standar arsitektur cadangan **3-2-1-1-0** sesuai rekomendasi NIST SP 800-34 & CISA.
3. Menetapkan target **Recovery Time Objective (RTO)** dan **Recovery Point Objective (RPO)** spesifik per komponen.

---

## 2. Arsitektur Backup 3-2-1-1-0

Sistem menerapkan prinsip arsitektur pemulihan bencana modern **3-2-1-1-0**:

```
                                 ┌───────────────────────────┐
                                 │   PRIMARY LIVE DATABASE   │
                                 └───────────────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                     ┌───────────────────────┐   ┌───────────────────────┐
                     │ 1. Supabase Cloud DB  │   │ 2. Storage Objects    │
                     │    (PITR Enabled)     │   │    (Media Buckets)    │
                     └───────────────────────┘   └───────────────────────┘
                                 │                           │
                                 └─────────────┬─────────────┘
                                               │
                                               ▼ (Encrypted AES-256)
                                 ┌───────────────────────────┐
                                 │ 3. Secondary Offsite S3   │
                                 │    (Immutable WORM Lock)  │
                                 └───────────────────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │ 0. Verified Restore Test  │
                                 │    (Monthly Zero Error)   │
                                 └───────────────────────────┘
```

- **3 Salinan Data**: 1 Live Primary Data, 1 Supabase Managed Backup, 1 Secondary Off-Site Backup.
- **2 Media Storage Berbeda**: Managed Cloud Database Storage & Off-Site S3 Object Storage.
- **1 Off-Site Location**: Disimpan di Region terpisah (misal: AWS Singapore / Cloudflare R2).
- **1 Immutable / Air-Gapped**: Salinan dikunci dengan **S3 Object Lock (WORM - Write Once Read Many)** agar tidak dapat dihapus/diubah oleh akun admin terkompromi.
- **0 Error**: $0$ error terverifikasi pada uji coba simulasi restore bulanan.

---

## 3. Matriks RPO & RTO Spesifik per Komponen Teknis

Untuk mengeliminasi kontradiksi, target RPO & RTO ditetapkan secara eksplisit per jenis aset:

| Komponen Aset                          |    Tingkat Sensitivitas     |           Target RPO            |  Target RTO   | Frekuensi & Metode Backup                 |
| :------------------------------------- | :-------------------------: | :-----------------------------: | :-----------: | :---------------------------------------- |
| **PostgreSQL Database**                | **Data Rahasia & Internal** | **$< 24$ Jam** (PITR per Detik) | **$< 2$ Jam** | Harian 02.00 WIB + Supabase PITR          |
| **Storage Objects (KTM, Bukti Bayar)** |      **Data Rahasia**       |         **$< 24$ Jam**          | **$< 4$ Jam** | **Harian 03.00 WIB** (Off-Site S3 Export) |
| **Configs, Migrations & IaC Code**     |    **Sistem & Aplikasi**    |         **$< 24$ Jam**          | **$< 1$ Jam** | Real-time via Git Version Control         |
| **External Audit Logs**                |       **Audit Trail**       |          **$< 1$ Jam**          | **$< 4$ Jam** | Real-time Streaming Log Drain             |

---

## 4. Backup Konfigurasi & Infrastructure as Code (IaC)

Pemusnahan bencana tidak hanya memulihkan database, tetapi juga seluruh konfigurasi aplikasi:

1. **Database Schemas & Migrations**: Seluruh skema tabel, triggers (`protect_profile_role_update`), dan RLS Policies tersimpan di Git repository (`supabase/migrations/`).
2. **Environment Variables & Secrets**: Seluruh variabel lingkungan terenkripsi dicadangkan di Key Vault / Vercel Environment Backup.
3. **Storage Bucket Policies**: Kebijakan RLS privat Supabase Storage dicadangkan dalam skrip migrasi SQL.

---

## 5. Manajemen Kunci Enkripsi (_Key Management System / KMS_)

Sesuai standar **ISO/IEC 27001 A.8.24** dan **NIST SP 800-57**:

1. **Algoritma Enkripsi**: Seluruh file dump backup off-site wajib dienkripsi menggunakan **AES-256-GCM**.
2. **Pemisahan Peran Kunci (_Key Custodian_)**:
   - **Storage Operator (DevOps)**: Mengelola eksekusi file backup tetapi **TIDAK** memegang kunci dekripsi.
   - **Key Custodian (Lead IT)**: Memegang kunci dekripsi utama yang disimpan terisolasi di Cloud KMS / Vault.
3. **Jadwal Rotasi Kunci**: Kunci enkripsi backup dirotasi secara berkala **1 tahun sekali**.

---

## 6. Verifikasi Integritas Checksum SHA-256 & Alerting Failure

1. **Checksum Verification**: Setiap kali proses backup selesai, skrip otomatis membuat file nilai hash SHA-256:
   ```bash
   sha256sum backup_daily_[timestamp].dump > backup_daily_[timestamp].sha256
   ```
   Sebelum proses restore dijalankan, skrip wajib memverifikasi kecocokan nilai hash.
2. **Monitoring & Alerting Kegagalan Backup**:
   - Jika backup harian 02.00 WIB atau 03.00 WIB gagal, sistem otomatis memicu **Critical Alert** ke Telegram/Slack/Email Tim IT.

---

## 7. Penjelasan Batasan & Fitur Point-In-Time Recovery (PITR)

- **Batasan Retensi PITR**: Supabase Managed PITR aktif dengan _retention window_ **7 hari** (dapat diperpanjang hingga 30 hari pada Pro Plan).
- **Granularitas**: Memungkinkan restore posisi database hingga tingkat **detik spesifik** sebelum terjadinya kesalahan manipulasi data.
- **Uji Coba PITR**: Pemulihan PITR diuji 1x per semester di environment staging.

---

## 8. Prosedur Pemulihan Ruang Bersih (_Clean-Room Restore Procedure_)

Jika terjadi serangan **Ransomware** atau pencemaran malware:

1. **Isolasi Environment (_Clean Room_)**: Menyiapkan Virtual Private Cloud (VPC) staging baru yang terisolasi total dari jaringan lama.
2. **Pemindaian Malware**: Memindai file dump backup dari _Off-site Storage_ sebelum dimasukkan ke database bersih.
3. **Validasi Kebersihan Data**: Memastikan tidak ada _backdoor_, skrip berbahaya, atau kredensial terkompromi sebelum _cutover_ produksi.

---

## 9. Prosedur Penahanan Hukum (_Legal Hold Procedure_)

Jika terjadi investigasi sengketa hukum atau permintaan otoritas resmi:

1. **Pembekuan Retensi**: Super Admin dapat mengaktifkan status **Legal Hold** pada salinan backup tertentu.
2. **Penghentian Auto-Purge**: File backup yang ditandai _Legal Hold_ **DIKECUALIKAN dari pemusnahan otomatis** sampai proses hukum dinyatakan selesai secara tertulis.

---

## 10. Checklist Operasional Cutover 10 Langkah (_10-Step Cutover Checklist_)

Saat pemulihan bencana dinyatakan selesai, tim wajib mengeksekusi 10 langkah _cutover_ secara berurutan:

- [ ] **Step 1: DNS & Proxy Verification** — Memastikan domain mengarah ke instance baru.
- [ ] **Step 2: Environment Variables Validation** — Memeriksa kelengkapan variabel `.env`.
- [ ] **Step 3: Database Connection & Auth Test** — Menguji autentikasi login Supabase Auth.
- [ ] **Step 4: RLS Policies Verification** — Memastikan seluruh RLS Policy aktif 100%.
- [ ] **Step 5: Storage Access Validation** — Menguji akses Private Bucket KTM/Bukti Bayar.
- [ ] **Step 6: Database Functions & Triggers Test** — Menguji fungsi `get_my_role` & triggers.
- [ ] **Step 7: Smoke Testing** — Menguji alur utama registrasi dan dashboard.
- [ ] **Step 8: Canary Release** — Membuka akses secara bertahap untuk $10\%$ pengguna.
- [ ] **Step 9: User Communication** — Mengumumkan pemulihan layanan via Email & Social Media.
- [ ] **Step 10: Post-Restore Monitoring** — Pemantauan intensif log error 24 jam pasca-restore.

---

_Dokumen ini diterbitkan sebagai standar prosedur cadangan dan pemulihan data resmi UKM Robotik Politeknik Negeri Padang._
