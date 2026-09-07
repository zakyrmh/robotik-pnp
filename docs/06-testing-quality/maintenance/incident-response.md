# Prosedur Operasi Standar Tanggap Insiden Darurat (Incident Response Standard Operating Procedure)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                   |
| :------------------------------------ | :-------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-IRP-01`                                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                 |
| **Induk Kebijakan (_Master Policy_)** | _System Maintenance & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                          |
| :------: | :--------: | :----------------- | :----------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Security Architect | Draf awal SOP tanggap insiden, severity matrix, dan skenario darurat.                                        |
| `v2.0.0` | 09/08/2026 | System Analyst     | Revisi: Penambahan Document Control, perbaikan prosedur SQL penyekatan darurat (REVOKE), dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi panduan penanganan insiden darurat (_Emergency Incident Response SOP_) untuk mengatasi kegagalan sistem kritis, ancaman keamanan, kebocoran data, serta gangguan operasional pada platform **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP**.

---

## 2. Klasifikasi Tingkat Keparahan Insiden (Severity Matrix)

|    Severity Level    | Kriteria Dampak Insiden                                                                                              | Contoh Kasus                                                       | Target Response Time (RTA) |
| :------------------: | :------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- | :------------------------: |
| **SEV-1 (Critical)** | Layanan mati total (_total outage_), kebocoran data terkonfirmasi, atau fitur presensi gagal saat acara berlangsung. | Website Down 500 Server Error, Data Leak, DB Unreachable.          |       **< 15 Menit**       |
|   **SEV-2 (High)**   | Fitur utama terganggu sebagian (_degraded performance_), tetapi ada _workaround_ sementara.                          | Upstash Redis Down, Upload Gambar Gagal, Delay Toast Notifikasi.   |        **< 1 Jam**         |
|   **SEV-3 (Low)**    | Isu minor pada tampilan UI/UX yang tidak menghentikan alur operasional utama.                                        | Tampilan layout tergeser di browser tertentu, typo teks dashboard. |        **< 24 Jam**        |

---

## 3. Struktur Tim Penanggung Jawab Insiden (Incident Control Matrix)

Jika terjadi insiden berkategori **SEV-1** atau **SEV-2**, alur komunikasi wajib segera dibuka ke daftar PIC berikut:

| Peran Dalam Incident        | Jabatan / Posisi            | Nama Penanggung Jawab  | Kontak HP / WhatsApp |
| :-------------------------- | :-------------------------- | :--------------------- | :------------------- |
| **Incident Commander (IC)** | Ketua UKM Robotik PNP       | Zaky Ramadhan          | `+62 8xx-xxxx-xxxx`  |
| **Technical Lead / DevOps** | Koordinator Divisi Software | Tim Programmer UKM     | `+62 8xx-xxxx-xxxx`  |
| **Pembina Manager**         | Pembina UKM Robotik PNP     | Pembina Pendamping     | `+62 8xx-xxxx-xxxx`  |
| **Database Administrator**  | Admin-OR / System Admin     | Tim Dev Infrastructure | `+62 8xx-xxxx-xxxx`  |

---

## 4. SOP Penanganan Skenario Darurat

### 4.1. Skenario 1: Website Down Total (HTTP 500 / Vercel Deployment Failure)

**Langkah Penanganan (Step-by-Step)**:

1. **Identifikasi Status Host & Deployment**:
   - Cek dashboard **Vercel** dan **Sentry**. Tentukan apakah kegagalan terjadi di level _build error_, _unhandled exception_, atau _network outage_.
2. **Rollback Instan ke Last Stable Deployment**:
   - Jika disebabkan oleh _code update_ terbaru, buka **Vercel Dashboard** $\rightarrow$ **Deployments** $\rightarrow$ Pilih Commit Stabil Sebelumnya $\rightarrow$ Klik **Instant Rollback**.
3. **Cek Konektivitas Database Supabase**:
   - Jika error disebabkan oleh _Database Connection Timeout_, periksa status layanan di `status.supabase.com`.
4. **Aktifkan Maintenance Page (jika butuh perbaikan $> 30$ menit)**:
   - Alihkan trafik Cloudflare WAF ke halaman statis `maintenance.html`.

---

### 4.2. Skenario 2: Terjadi Kebocoran Data Anggota (Data Breach Mitigation)

**Langkah Penanganan (Step-by-Step)**:

1. **Penyekatan Akses (Containment Phase)**:
   - Segera Lakukan **Secret Rotation** pada dashboard Supabase untuk mencabut `SUPABASE_SERVICE_ROLE_KEY` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Perbarui variabel `.env.local` pada server Vercel dan pemicu _re-deployment_.
2. **Revoke Akses Database pada Tabel Terdampak**:
   - Buka SQL Editor Supabase dan jalankan pencabutan akses sementara pada tabel terdampak:
     ```sql
     -- Darurat: Cabut seluruh akses pada tabel terdampak
     REVOKE ALL ON public.profiles FROM authenticated, anon;
     -- Catatan: Jalankan GRANT ulang setelah investigasi selesai
     -- GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
     ```
3. **Audit Trail & Investigation**:
   - Buka **Supabase Audit Logs** dan **Sentry Trace** untuk mengidentifikasi IP penyerang, vektor serangan, serta lingkup data yang bocor.
4. **Eskalasi & Pelaporan Internal**:
   - Incident Commander (Ketua UKM) wajib menginformasikan insiden secara transparan kepada Pembina UKM dan pihak manajemen kampus Politeknik Negeri Padang.

---

### 4.3. Skenario 3: Fitur Presensi QR Code Gagal Total Saat Acara Besar / Workshop

**Langkah Penanganan (Step-by-Step)**:

1. **Aktivasi Fallback Manual Check-in Mode**:
   - Jika scanner camera `html5-qrcode` atau API presensi mengalami error massal di lokasi acara:
     - **Instruksikan Panitia**: Buka halaman Backup Presensi Manual di Dashboard Admin (`/dashboard/admin/presensi-manual`).
     - Panitia menandai kehadiran anggota berdasarkan pencarian NIM/Nama secara manual.
2. **Atur Offline Physical Log (Emergency Paper Mode)**:
   - Jika koneksi internet di lokasi acara mati total (_zero connectivity_):
     - Gunakan formulir presensi fisik tercetak (_Paper Attendance List_) sebagai data cadangan.
     - Tim sekretariat akan melakukan _input data susulan_ (_post-event batch import_) setelah jaringan kembali normal.
3. **Perbaiki Cache Redis / Reset QR Token Session**:
   - Jalankan pembersihan cache Upstash Redis jika terjadi penyumbatan _Rate Limiting_:
     ```typescript
     // Reset rate limit key via Upstash CLI/Dashboard
     redis.del("ukmrobotik:ratelimit:attendance:*");
     ```

---

## 5. Post-Incident Review & Checklist Pasca Insiden (Blameless Post-Mortem)

Setiap insiden **SEV-1** dan **SEV-2** wajib diakhiri dengan rapat _Post-Mortem_ maksimal 48 jam setelah pemulihan layanan:

1. **[ ] Penyusunan Laporan Chronology**: Dokumentasikan timeline terjadinya insiden dari deteksi awal hingga pemulihan.
2. **[ ] Root Cause Analysis (RCA)**: Tentukan penyebab utama insiden (misal: RLS policy leak, unindexed database query, atau token expired).
3. **[ ] Action Items Implementation**: Buat tiket perbaikan kode / unit test baru untuk memastikan insiden serupa tidak terulang kembali.

---

_Dokumen ini diterbitkan sebagai standar prosedur operasi tanggap insiden darurat resmi untuk UKM Robotik Politeknik Negeri Padang._
