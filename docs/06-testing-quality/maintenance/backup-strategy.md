# Strategi Pencadangan Data, Pemulihan Bencana & Restore (Data Backup, Disaster Recovery & Restore Strategy Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                   |
| :------------------------------------ | :-------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-BCK-01`                                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                 |
| **Induk Kebijakan (_Master Policy_)** | _System Maintenance & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis         | Ringkasan Perubahan                                                            |
| :------: | :--------: | :-------------- | :----------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | DevOps Engineer | Draf awal strategi backup database, storage, dan prosedur restore PITR.        |
| `v2.0.0` | 09/08/2026 | System Analyst  | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis, prosedur operasi standar (_SOP_), dan strategi pemulihan bencana (_disaster recovery_) untuk database PostgreSQL, Supabase Storage, dan variabel lingkungan pada **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP**.

---

## 2. Strategi Backup Database PostgreSQL (Supabase)

Pencadangan database dilakukan menggunakan kombinasi **Automatic Daily Backups** dan **Point-in-Time Recovery (PITR)** yang disediakan oleh Supabase Infrastructure.

### 2.1. Jadwal & Frekuensi Backup Otomatis

| Jenis Backup                        | Frekuensi Exec          | Retensi Data        | Metode Storage                 | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
| :---------------------------------- | :---------------------- | :------------------ | :----------------------------- | :----------------------------: | :---------------------------: |
| **Point-in-Time Recovery (PITR)**   | Continuous (WAL Stream) | 7 s/d 14 Hari       | Supabase Managed Backup Engine |         **< 1 Detik**          |        **< 15 Menit**         |
| **Daily Automated Physical Backup** | Setiap Hari (02:00 WIB) | 30 Hari             | Encrypted Cloud Object Storage |           **24 Jam**           |        **< 30 Menit**         |
| **Manual Schema Dump (`pg_dump`)**  | Sebelum Major Migration | Permanen (Lokal/S3) | Encrypted File Repository      |      **Manual Snapshot**       |        **< 10 Menit**         |

---

### 2.2. Prosedur Manual Dump via Supabase CLI

Untuk melakukan pencadangan manual skema dan data sebelum eksekusi migrasi besar:

```bash
# 1. Login ke Supabase CLI
npx supabase login

# 2. Link ke Proyek Production
npx supabase link --project-ref qtblwlzbxfopcvyvplfh

# 3. Dump Hanya Skema Database (Schema Only)
npx supabase db dump -f supabase/backups/schema_$(date +%Y%m%d_%H%M%S).sql

# 4. Dump Seluruh Data & Skema (Full Backup)
npx supabase db dump --data-only -f supabase/backups/data_$(date +%Y%m%d_%H%M%S).sql
```

---

## 3. Strategi Backup Supabase Storage (Foto & Dokumen)

Sistem mengelola 5 bucket aset utama: `profiles`, `registrations`, `activity-banners`, `piket-proofs`, dan `task-submissions`.

### 3.1. Skema Sinkronisasi Aset Media

1. **Multi-Region Redundancy**: Seluruh obyek media yang diunggah ke Supabase Storage secara otomatis memiliki redundansi fisik di infrastruktur AWS S3 underlying storage.
2. **Automated Bucket Sync Script (S3/GCS Replication)**:
   Menggunakan skrip CLI harian berbasis `rclone` atau Supabase Storage API untuk menduplikasi aset ke cloud storage sekunder:

```bash
#!/bin/bash
# Script: sync-storage-backup.sh
# Menjalankan sinkronisasi harian bucket profiles & registrations
BACKUP_DATE=$(date +%Y%m%d)
TARGET_DIR="./storage-backups/$BACKUP_DATE"

mkdir -p "$TARGET_DIR"

echo "Downloading profiles bucket snapshot..."
npx supabase storage download profiles "$TARGET_DIR/profiles" --recursive

echo "Downloading registrations bucket snapshot..."
npx supabase storage download registrations "$TARGET_DIR/registrations" --recursive

echo "Backup Storage Selesai pada $BACKUP_DATE"
```

---

## 4. Skenario & Prosedur Restore Data (Mitigasi Human Error)

### 4.1. Skenario A: Pemulihan Akibat Ketidaksengajaan Hapus Data (_Human Error_) via PITR

Jika admin tidak sengaja menghapus baris data penting (misal: menghapus tabel `profiles` atau `attendances` pada jam 14:00 WIB):

1. **Identifikasi Timestamp Tepat**:
   Tentukan tanggal dan waktu presisi tepat 1 menit sebelum insiden terjadi (misal: `2026-08-09 13:59:00 WIB` / `06:59:00 UTC`).
2. **Eksekusi Restore via Dashboard Supabase**:

- Buka **Supabase Dashboard** $\rightarrow$ Pilih Project **UKM Robotik PNP**.
- Navigasi ke menu **Database** $\rightarrow$ **Backups** $\rightarrow$ **Point in Time Restore**.
- Masukkan Timestamp sasaran: `2026-08-09T06:59:00Z`.
- Konfirmasi pembuatan _Restored Clone Project_ atau _Direct Overwrite_.

3. **Verifikasi Data**:
   Periksa integritas data tabel `attendances` dan `profiles` setelah proses PITR selesai.

---

### 4.2. Skenario B: Restore Database Lokal via File `pg_dump` SQL

Jika ingin memulihkan cadangan manual `.sql` ke environment lokal pengembang:

```bash
# Restore file dump SQL ke database Postgres lokal
npx supabase db reset
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/backups/data_20260809.sql
```

---

## 5. Checklist Pemeliharaan & Maintenance Periodik

1. **[ ] Mingguan**: Uji coba kelayakan restore otomatis (_restore dry-run_) pada lingkungan staging/lokal.
2. **[ ] Bulanan**: Verifikasi kuota dan ukuran file backup Supabase Storage.
3. **[ ] Kuartalan**: Rotasi `SUPABASE_SERVICE_ROLE_KEY` dan token akses skrip backup otomatis.

---

_Dokumen ini diterbitkan sebagai standar strategi pencadangan data & pemulihan bencana resmi untuk UKM Robotik Politeknik Negeri Padang._
