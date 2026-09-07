# Rencana Tanggap Insiden Keamanan & Kebocoran Data (Incident Response Plan - IRP)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                              |
| :------------------------------------ | :------------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-AUD-IRP-02`                                                                                   |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                                    |
| **Tanggal Efektif**                   | 2 Agustus 2026                                                                                     |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                            |
| **Induk Kebijakan (_Master Policy_)** | _Incident Management Policy_ & _Business Continuity Plan (BCP)_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Tanggap Insiden Keamanan UKM Robotik PNP                                                  |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                               |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                       |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                    |
| :------: | :--------: | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal alur 6 fase tanggap insiden & kontak darurat.                                                                                                                                                                |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan Document Control ISO 27001, BCP Umbrella, RACI Matrix dengan Alternate Roles, dan KPI Waktu Respon.                                                                                                         |
| `v2.0.0` | 02/08/2026 | Security Architect | Revisi Total: Penambahan SLA per Severity, Playbooks Spesifik (Vercel/Supabase/Upstash), Preservasi Bukti Digital & Chain of Custody (ISO 27001 A.5.28), Template Komunikasi, Threshold UU PDP, dan Tabletop Exercise. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Dokumen ini berkedudukan sebagai **Runbook Operasional Tanggap Insiden** dari _Incident Management Policy_ dan _Business Continuity Plan (BCP)_ di bawah naungan **Information Security Management System (ISMS)** UKM Robotik PNP. Dokumen ini terintegrasi secara langsung dengan _Data Protection Policy_ (`data-classification-handling.md`) dan _Logging Strategy_ (`logging-strategy.md`).

Tujuan utama IRP ini adalah:

1. Menyediakan petunjuk penanganan insiden siber yang teruji (_playbook_) untuk arsitektur **Next.js 16 + Supabase + Upstash + Vercel**.
2. Mengeliminasi titik kegagalan tunggal (_Single Point of Failure_) dalam struktur komando insiden.
3. Menjamin preservasi bukti digital (_digital evidence preservation_) secara sah.
4. Memenuhi kewajiban notifikasi tertulis **SLA $3 \times 24$ Jam** sesuai **Pasal 46 UU No. 27 Tahun 2022 (UU PDP)**.

---

## 2. Pemetaan Aset Kritis & Integrasi Monitoring Alert

Saat insiden terjadi, sistem monitoring otomatis memberikan indikasi awal insiden melalui kanal berikut:

| Nama Aset / Vendor      | Jenis Aset Data        | Sumber Alert & Monitoring                 | Penanggung Jawab Teknis |
| :---------------------- | :--------------------- | :---------------------------------------- | :---------------------- |
| **Supabase PostgreSQL** | Database & Storage     | Supabase Auth Log Drain & DB CPU Spikes   | Lead Backend Developer  |
| **Vercel Platform**     | Web Server Hosting     | Vercel Deployment & Serverless Error Rate | Lead Frontend / DevOps  |
| **Upstash Redis**       | Rate Limiter Store     | Upstash Rate Limit Violation Spike Alert  | Backend Engineer        |
| **Cloudflare**          | DNS & Anti-Bot CAPTCHA | Cloudflare WAF & Turnstile Anomaly Alert  | Fullstack Developer     |
| **Sentry Logs**         | Error Tracking         | Sentry Unhandled Exception Rate Alert     | Lead IT / Fullstack     |

---

## 3. Struktur Tim Tanggap Insiden (RACI Matrix & Alternate Roles)

Setiap peran wajib memiliki **Peran Pengganti (_Alternate_)** untuk menjamin keputusan dapat diambil dalam $< 15$ menit tanpa ketergantungan pada 1 orang:

### 3.1 Tabel Peran & Pengganti Resmi

| Peran Tanggap Insiden             | Penanggung Jawab Utama | Peran Pengganti (_Alternate_) | Tanggung Jawab Utama                               |
| :-------------------------------- | :--------------------- | :---------------------------- | :------------------------------------------------- |
| **Incident Commander (IC)**       | Lead IT / Super Admin  | Senior Fullstack / Dev Lead   | Mengoordinasi seluruh langkah penanganan insiden.  |
| **Technical Lead (TL)**           | Backend Engineer       | DevOps / Frontend Lead        | Memimpin isolasi teknis, patching, & recovery.     |
| **Privacy / Legal Officer (DPO)** | Sekretaris Umum        | Admin Kestari                 | Memastikan notifikasi UU PDP & kepatuhan regulasi. |
| **Public Spokesperson (PR)**      | Humas Organisasi       | Ketua Umum UKM                | Menjadi satu-satunya pintu komunikasi resmi.       |
| **Log Scribe / Documenter**       | Admin Komdis           | Admin OR                      | Mencatat timeline, bukti SHA-256, & berita acara.  |
| **Decision Maker Utama (DM)**     | Ketua Umum UKM         | Wakil Ketua / Sekretaris Umum | Mengambil keputusan penghentian total/shutdown.    |

### 3.2 Matriks RACI Tanggap Insiden

| Aktivitas Tanggap Insiden            | Incident Commander | Technical Lead | Legal Officer | Spokesperson | Scribe | Decision Maker |
| :----------------------------------- | :----------------: | :------------: | :-----------: | :----------: | :----: | :------------: |
| **Triage & Klasifikasi Severity**    |     **A / R**      |     **R**      |       C       |      I       | **R**  |       I        |
| **Isolasi Darurat (_Containment_)**  |       **A**        |     **R**      |       C       |      I       | **R**  |     **A**      |
| **Preservasi Bukti Digital**         |       **A**        |     **R**      |       C       |      I       | **R**  |       I        |
| **Pembersihan & Restore**            |       **A**        |     **R**      |       C       |      I       | **R**  |     **A**      |
| **Evaluasi Ambang PDP & Notifikasi** |         C          |       C        |   **A / R**   |    **R**     | **R**  |     **A**      |
| **Komunikasi Publik / Kampus**       |         C          |       I        |       C       |  **A / R**   |   I    |     **A**      |

---

## 4. Klasifikasi Keparahan Insiden & Matriks SLA Waktu

Tingkat keberhasilan penanganan wajib mematuhi target **SLA Waktu Respon** berikut (sesuai standar NIST SP 800-61 / ISO 27035):

|    Level Insiden     | Deskripsi Kriteria Insiden                                                 |    Response SLA    |     Triage SLA     | Containment SLA | Recovery SLA |                    Notification Decision SLA                    |
| :------------------: | :------------------------------------------------------------------------- | :----------------: | :----------------: | :-------------: | :----------: | :-------------------------------------------------------------: |
| **SEV-0 (CRITICAL)** | Kebocoran DB (_Data Breach_), Kebocoran `SERVICE_ROLE_KEY`, RCE di Vercel  |   $\le 15$ menit   |   $\le 30$ menit   |   $\le 1$ jam   | $\le 4$ jam  | Assessment $\le 24$ jam<br>Notifikasi PDP $\le 3 \times 24$ jam |
|   **SEV-1 (HIGH)**   | Account Takeover Admin (`admin-or`/`komdis`), Manipulasi data sanksi/oprec |   $\le 30$ menit   |    $\le 1$ jam     |   $\le 2$ jam   | $\le 8$ jam  |                          $\le 24$ jam                           |
|  **SEV-2 (MEDIUM)**  | Serangan DDoS ringan, defacement artikel publik                            |    $\le 4$ jam     |    $\le 8$ jam     |  $\le 12$ jam   | $\le 24$ jam |                    Sesuai kebutuhan internal                    |
|   **SEV-3 (LOW)**    | Error terisolasi, percobaan login gagal berulang dari 1 IP                 | $\le 1$ hari kerja | $\le 2$ hari kerja |   Next Sprint   | Next Release |                           Tidak wajib                           |

---

## 5. Prosedur Preservasi Bukti Digital & Chain of Custody (ISO/IEC 27001 Annex A.5.28)

**ATURAN MUTLAK**: Sebelum melakukan tindakan _Containment_ destruktif atau _Restore_ database, tim **WAJIB mengamankan bukti digital** untuk analisis forensik dan legalitas.

```
 ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
 │ 1. SNAPSHOT DB │ ───> │ 2. CALC HASH   │ ───> │ 3. SIGN BERITA │
 │  & LOG DUMP    │      │    SHA-256     │      │    ACARA Scribe│
 └────────────────┘      └────────────────┘      └────────────────┘
```

1. **Pengambilan Snapshot & Log Dump**:
   - Melakukan export dump database terkontaminasi secara _read-only_:
     ```bash
     pg_dump -h <db_host> -U postgres -d postgres -F c -b -v -f evidence_sev0_[timestamp].dump
     ```
   - Mengunduh log mentah dari Sentry, Vercel Serverless Logs, dan Upstash IP Logs.
2. **Perhitungan Hash SHA-256 (Integritas Bukti)**:
   - Menghitung nilai hash file bukti untuk menjamin bukti tidak dimanipulasi:
     ```bash
     sha256sum evidence_sev0_[timestamp].dump > evidence_hash.txt
     ```
3. **Penyimpanan Aman & Chain of Custody**:
   - Berkas bukti disimpan di lokasi _Read-Only Encrypted Storage_ terisolasi.
   - Scribe mengisi **Berita Acara Penyitaan Bukti Digital** yang ditandatangani oleh Incident Commander dan Legal Officer.

---

## 6. Operasional Playbook per Skenario Insiden Spesifik

### 📋 PLAYBOOK A: Account Takeover Pengguna Admin (`super-admin` / `admin-or` / `admin-komdis`)

- **Indikator**: Perubahan role tak dikenal di `audit_logs`, aktivasi fitur Oprec tanpa izin, penjatuhan sanksi masif tak wajar.
- **Langkah Penanganan**:
  1. **Isolasi**: Eksekusi RPC `auth.admin.signOut(target_user_id)` untuk menghentikan sesi aktif penyerang secara paksa.
  2. **Kunci Akses**: Ubah role pengguna yang terkompromi menjadi `caang` atau batasi via DB update:
     ```sql
     UPDATE public.profiles SET role = 'caang', is_onboarded = false WHERE id = 'target_user_id';
     ```
  3. **Reset Password Wajib**: Kirimkan instruksi reset password baru ke email resmi terverifikasi.
  4. **Audit Log**: Periksa seluruh tindakan `target_user_id` dalam 24 jam terakhir dan lakukan rollback data jika ada manipulasi.

---

### 📋 PLAYBOOK B: Kebocoran `SUPABASE_SERVICE_ROLE_KEY` (Secret Server Key)

- **Indikator**: Bypass RLS terdeteksi, data rahasia/internal diakses langsung dari IP asing di Supabase Auth logs.
- **Langkah Penanganan**:
  1. **Isolasi Darurat**: Masuk ke Supabase Dashboard -> Project Settings -> API -> Klik **"Rotate Service Role Key"**.
  2. **Update Vercel Secrets**: Perbarui nilai `SUPABASE_SERVICE_ROLE_KEY` pada Vercel Environment Variables dan lakukan _Redeploy Immediate_:
     ```bash
     vercel env add SUPABASE_SERVICE_ROLE_KEY production
     vercel deploy --prod
     ```
  3. **Rotasi JWT Secret**: Jika diduga JWT Secret ikut terkompromi, lakukan rotasi `JWT Secret` pada Supabase (otomatis membatalkan seluruh sesi aktif di seluruh sistem).

---

### 📋 PLAYBOOK C: Miskonfigurasi RLS (_RLS Leakage / Policy Misconfiguration_)

- **Indikator**: Pengguna `caang` / publik dapat membaca data yang seharusnya terproteksi (misal: `registrations`, `sanctions`).
- **Langkah Penanganan**:
  1. **Kunci Akses Darurat**: Jalankan migrasi SQL darurat untuk mengubah policy tabel terkait menjadi `DENY ALL` sementara:
     ```sql
     CREATE POLICY "Emergency Lockdown" ON public.registrations FOR SELECT USING (false);
     ```
  2. **Review Policy SQL**: Periksa `supabase/migrations/` untuk menemukan kekeliruan sintaks RLS (misal: lupa memanggil `get_my_role()`).
  3. **Patching & Deploy**: Terapkan policy perbaikan dan jalankan unit test RLS sebelum mencabut kebijakan _Lockdown_.

---

### 📋 PLAYBOOK D: Ekspor / Pencurian Data Masif (_Mass Data Breach_)

- **Indikator**: Lonjakan query `SELECT` pada tabel `profiles`, `registrations`, `legacy_members` dalam waktu singkat.
- **Langkah Penanganan**:
  1. **Preservasi Bukti**: Catat IP penyerang dan unduh log transaksi query Supabase (`sha256sum`).
  2. **Isolasi IP / User**: Blokir IP penyerang di Cloudflare WAF & Upstash Redis Rate Limiter.
  3. **Aktifkan Ambang PDP**: Jalankan evaluasi Notifikasi UU PDP (Lihat Section 7).

---

### 📋 PLAYBOOK E: Defacement / Injeksi Kode di Vercel & Next.js

- **Indikator**: Tampilan aplikasi berubah (_defaced_), adanya link phising asing di landing page.
- **Langkah Penanganan**:
  1. **Rollback Deployment**: Masuk ke Vercel Dashboard -> Deployments -> Pilih commit sehat sebelumnya -> Klik **"Promote to Production"**.
  2. **Audit Repository**: Periksa `git log` pada repository GitHub untuk menemukan commit/PR mencurigakan.
  3. **Rotasi Personal Access Token (PAT) GitHub & Vercel Tokens**.

---

### 📋 PLAYBOOK F: Serangan DDoS / Resource Exhaustion

- **Indikator**: Response time aplikasi $> 5000$ ms, error `429 Too Many Requests` atau `504 Gateway Timeout` di Vercel/Upstash.
- **Langkah Penanganan**:
  1. **Cloudflare Under Attack Mode**: Aktifkan fitur _Under Attack Mode_ pada Cloudflare Dashboard.
  2. **Pengetatan Throttling**: Turunkan batas `MAX_REQUESTS` pada `lib/supabase/proxy.ts` dari 3 req/menit menjadi 1 req/menit untuk rute publik.

---

## 7. Ambang Batas Notifikasi Kebocoran Data (_Breach Notification Decision Matrix_)

Sesuai **Pasal 46 UU PDP**, Notifikasi Tertulis Wajib dikirimkan dalam $\le 3 \times 24$ Jam jika memenuhi **Decision Threshold** berikut:

```
 ┌─────────────────────────────────────────────────────────┐
 │            AMBANG BATAS NOTIFIKASI WAJIB                │
 ├─────────────────────────────────────────────────────────┤
 │ 1. Terungkapnya Data Rahasia >= 1 Record               │
 │    (Password hash, Riwayat sanksi, Catatan evaluasi)    │
 │ 2. Terungkapnya Data Internal >= 10 Record             │
 │    (NIM, Bukti pembayaran, KTM, No HP masif)           │
 │ 3. Akses tak sah ke Storage Bucket Private             │
 └─────────────────────────────────────────────────────────┘
```

Jika threshold terpenuhi:

1. Legal Officer menyusun draf notifikasi tertulis.
2. Decision Maker (Ketua Umum) menandatangani surat pemberitahuan resmi.

---

## 8. Rencana Komunikasi & Template Pesan Resmi (_Communication Plan_)

### 8.1 Aturan Komunikasi Resmi

- **Satu-satunya Pintu Bicara**: Hanya **Public Spokesperson (Humas)** atau **Ketua Umum** yang berhak memberikan pernyataan resmi.
- **Aturan No-Comment**: Seluruh pengurus, anggota, dan tim IT dilarang memberikan pernyataan spekulatif di media sosial atau grup obrolan.

### 8.2 Template Notifikasi Email ke Subjek Data Terdampak (SLA $\le 3 \times 24$ Jam)

```text
Subjek: [PENTING] Pemberitahuan Insiden Pelindungan Data Pribadi - UKM Robotik PNP

Kepada Yth. Member / Calon Anggota UKM Robotik PNP,

Kami memberitahukan bahwa pada tanggal [Tanggal Insiden] pukul [Waktu], tim keamanan kami mendeteksi adanya insiden akses tidak sah yang berpotensi memengaruhi sebagian data pribadi Anda.

1. Jenis Data Terdampak : [misal: Nama, NIM, No. HP / Bukti Pembayaran]
2. Kronologi Singkat    : [Penjelasan singkat tanpa membeberkan celah teknis]
3. Langkah Pemulihan    : Tim kami telah mengisolasi sistem, menutup celah keamanan,
                          dan memperbarui seluruh kunci enkripsi.

REKOMENDASI TINDAKAN UNTUK ANDA:
- Jika Anda menggunakan password yang sama di layanan lain, segera lakukan perubahan password.
- Waspadai pesan mencurigakan yang mengatasnamakan panitia UKM Robotik PNP.

Kami memohon maaf atas ketidaknyamanan ini. Untuk pertanyaan lebih lanjut, hubungi Privacy Officer kami di: privacy@robotik-pnp.org.

Hormat kami,
Tim Tanggap Insiden Keamanan UKM Robotik PNP
```

### 8.3 Template Laporan Resmi ke Otoritas Kampus (Biro Kemahasiswaan PNP)

```text
Hal: Laporan Resmi Insiden Keamanan Informasi dan Langkah Pemulihan

Kepada Yth.
Biro Kemahasiswaan Politeknik Negeri Padang
di Tempat

Dengan hormat,
Bersama surat ini, Pengurus UKM Robotik PNP melaporkan insiden keamanan siber yang terjadi pada Sistem Informasi Manajemen UKM pada tanggal [Tanggal].

[Detail Kronologi, Dampak Data, Tindakan Isolasi, dan Pemulihan Sistem]

Sistem telah berhasil dipulihkan sepenuhnya pada [Tanggal/Waktu] dan saat ini dalam pengawasan ketat. Demikian laporan ini kami sampaikan sebagai bentuk akuntabilitas tata kelola organisasi.

Ketua Umum UKM Robotik PNP                    Pembina UKM Robotik PNP

( ____________________ )                     ( ____________________ )
```

---

## 9. Jadwal Simulasi Insiden (_Tabletop Exercise Schedule_)

- **Frekuensi Simulasi**: Dilakukan **1 (satu) kali per tahun**, dijadwalkan **H-30 sebelum pelaksanaan Open Recruitment (Oprec)**.
- **Skenario Simulasi**: Menguji kesiapan tim terhadap skenario kebocoran data pendaftaran, _admin account takeover_, dan rotasi secret key.
- **Evaluasi**: Hasil latihan dicatat dalam _Laporan Simulasi Disaster & Incident_.

---

## 10. Pelacakan Tindak Lanjut Pasca Insiden (_Post-Incident Action Tracking_)

Setiap insiden wajib ditutup dengan rapat _Post-Mortem_ (maksimal H+7) yang menghasilkan lembar aksi perbaikan:

| No  | Tindakan Perbaikan (_Action Item_)           | Severity | PIC / Penanggung Jawab | Deadline | Status |
| :-: | :------------------------------------------- | :------: | :--------------------- | :------: | :----: |
|  1  | Refactoring RLS Policy tabel `registrations` |   HIGH   | Lead Backend Developer |   H+3    |  OPEN  |
|  2  | Rotasi berkala seluruh API Secret Keys       | CRITICAL | DevOps / Super Admin   |   H+1    | CLOSED |
|  3  | Sosialisasi keamanan password pengurus       |  MEDIUM  | Legal / Admin Kestari  |   H+7    |  OPEN  |

---

_Dokumen ini diterbitkan sebagai standar rencana tanggap insiden operasional resmi UKM Robotik Politeknik Negeri Padang._
