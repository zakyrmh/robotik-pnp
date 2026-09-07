# Strategi Backup, Disaster Recovery & Isolasi Multi-Proyek Supabase (Supabase Backup, Disaster Recovery & Multi-Project Isolation Strategy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                        |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-BCK-01`                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                      |
| **Induk Kebijakan (_Master Policy_)** | _Deployment Architecture & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                         |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                 |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis         | Ringkasan Perubahan                                                                      |
| :------: | :--------: | :-------------- | :--------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | DevOps Engineer | Draf awal strategi multi-project isolation, backup SOP, dan disaster recovery procedure. |
| `v2.0.0` | 09/08/2026 | System Analyst  | Revisi: Penambahan Document Control, perbaikan format ASCII diagram, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis strategi pencadangan (_backup_), pemulihan data (_disaster recovery_), dan keputusan arsitektur pemisahan proyek Supabase (**Multi-Project Instance Strategy**) pada **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Keputusan Arsitektur: Pemisahan Instance Supabase (Multi-Project Isolation)

### 2.1. Keputusan & Evaluasi Risiko

Sebelumnya, sistem dipertimbangkan menggunakan 1 project Supabase bersama untuk seluruh lingkungan (_development_, _testing_, dan _production_). Namun, strategi 1 project **DINILAI SANGAT TIDAK OPTIMAL DAN BERISIKO TINGGI**.

#### Risiko Utama Jika Menggunakan 1 Project Sama:

1. **Pencemaran Data Produksi (_Data Corruption_)**: Aktivitas _testing_ atau eksekusi _seed data_ pengembang lokal berisiko menghapus atau menimpa data riil anggota dan data pribadi calon anggota (_caang_) Minangkabau Robot Contest (MRC).
2. **Kegagalan Migrasi Database**: Perubahan skema SQL yang diuji di lokal/dev dapat secara tidak sengaja mengubah struktur tabel produksi secara langsung (_destructive schema changes_).
3. **Kebocoran Akses & Privasi Data**: Anggota tim pengembang/penguji dapat melihat data pribadi sensitif (KTM, Transkrip Nilai, Nomor Telepon) milik calon pendaftar MRC.

### 2.2. Solusi Terpilih: Pemisahan Terisolasi 2 Instance Project Supabase

Sesuai batas **Free Tier Supabase (Mengizinkan hingga 2 Project Aktif Gratis per Akun Organisasi)**, proyek **DISEPAKATI DIBAGI MENJADI 2 INSTANCE TERPISAH**:

```
                   [ Supabase Multi-Project Architecture ]
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        ▼                                                           ▼
[ Project 1: Dev & Staging DB ]                            [ Project 2: Production DB ]

  * Project Ref: `dev-ukmrobotik-pnp`                       - Project Ref: `qtblwlzbxfopcvyvplfh`
  * Data: Dummy & Mock Data Only                             - Data: Real Anggota & Peserta MRC
  * Usage: Testing, Local CLI & PR Preview                   - Usage: Live Platform (`ukmrobotik-pnp.or.id`)
```

---

## 3. Strategi Backup Supabase Berdasarkan Plan Tier

Strategi pencadangan disesuaikan dengan fitur ketersediaan pada **Supabase Free Tier** dan kesiapan eskalasi ke **Supabase Pro Tier**.

### 3.1. Matriks Rencana Backup & Recovery Objectives

| Lingkungan / Project            | Strategy Backup                             | Frekuensi Exec                             | Retensi Data  | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
| :------------------------------ | :------------------------------------------ | :----------------------------------------- | :------------ | :----------------------------: | :---------------------------: |
| **Production DB (Free Tier)**   | Automated Daily Snapshot + CLI Logical Dump | Daily (02:00 WIB) + Manual Sebelum Migrasi | 7 s/d 30 Hari |           **24 Jam**           |        **< 30 Menit**         |
| **Production DB (If Pro Tier)** | Continuous Point-in-Time Recovery (PITR)    | Continuous WAL Stream                      | 7 s/d 14 Hari |         **< 1 Detik**          |        **< 15 Menit**         |
| **Dev/Staging DB (Free Tier)**  | Disposable Reset / Seed Scripts             | On-Demand (`npm run db:reset`)             | Non-Critical  |     **N/A** (Rebuildable)      |         **< 5 Menit**         |

---

## 4. Prosedur Operasi Standar (SOP) Pencadangan Data

### 4.1. Automatic Daily Snapshot (Supabase Dashboard Managed)

Supabase Platform secara otomatis melakukan _daily physical backup_ pada instance produksi setiap pukul 02:00 WIB. File cadangan ini dapat diunduh langsung melalui **Supabase Dashboard** $\rightarrow$ **Database** $\rightarrow$ **Backups**.

### 4.2. Manual Logical Dump via Supabase CLI (`pg_dump`)

Sebelum melakukan eksekusi migrasi skema besar (`supabase db push`) pada database produksi, pengembang wajib mengeksekusi dump lokal:

```bash
# 1. Login ke Supabase CLI
npx supabase login

# 2. Hubungkan ke Instance Production
npx supabase link --project-ref qtblwlzbxfopcvyvplfh

# 3. Dump Hanya Skema Database (Schema Only)
npx supabase db dump -f supabase/backups/prod_schema_$(date +%Y%m%d_%H%M%S).sql

# 4. Dump Data Produksi (Encrypted Dump)
npx supabase db dump --data-only -f supabase/backups/prod_data_$(date +%Y%m%d_%H%M%S).sql
```

---

## 5. SOP Disaster Recovery & Restore (Mitigasi Human Error)

### 5.1. Skenario A: Data Terhapus/Rusak di Database Produksi (Human Error Mitigation)

1. **Langkah 1 (Isolasi Traffic)**: Buka Vercel Dashboard dan alihkan trafik ke halaman `maintenance.html` untuk menghentikan mutasi data baru.
2. **Langkah 2 (Restore via Dashboard Snapshot)**:

- Buka **Supabase Dashboard** $\rightarrow$ **Database** $\rightarrow$ **Backups**.
- Pilih snapshot harian paling stabil sebelum insiden terjadi.
- Klik **Restore Backup** atau gunakan cadangan logical `.sql` terbaru.

3. **Langkah 3 (Restore via Logical Dump CLI)**:
   Jika memulihkan dari file dump SQL lokal:

```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 5432 -U postgres.qtblwlzbxfopcvyvplfh -d postgres -f supabase/backups/prod_data_20260809.sql
```

4. **Langkah 4 (Verifikasi & Re-open Traffic)**:
   Periksa integritas data tabel `profiles`, `attendances`, dan `mrc_registrations`, kemudian aktifkan kembali rute Vercel.

---

## 6. Checklist Verifikasi Backup & Safety Policy

- [x] Instance Supabase dipisah penuh menjadi 2 project (Dev/Staging vs Production).
- [ ] File backup `.sql` tersimpan di _encrypted cloud storage_ sekunder (Google Drive/S3 khusus internal).
- [ ] File `.sql` cadangan berisi data produksi terdaftar di `.gitignore` dan **DILARANG** di-commit ke repositori GitHub.
- [ ] Uji coba prosedur pemulihan data (_restore dry-run_) dijalankan minimal 1 bulan sekali pada lingkungan lokal.

---

_Dokumen ini diterbitkan sebagai standar strategi backup, disaster recovery & isolasi multi-proyek Supabase resmi untuk UKM Robotik Politeknik Negeri Padang._
