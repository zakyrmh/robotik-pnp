# Strategi Log Audit & Bukti Digital (Audit Logging & Digital Evidence Strategy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                            |
| :------------------------------------ | :--------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-AUD-LOG-01`                                                 |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                  |
| **Tanggal Efektif**                   | 2 Agustus 2026                                                   |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)          |
| **Induk Kebijakan (_Master Policy_)** | _Logging & Monitoring Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                   |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                             |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                     |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                               |
| :------: | :--------: | :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal strategi logging & format log standar.                                                                                                                                                                                                                  |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan Document Control ISO 27001, Master Policy, RACI Matrix, Vendor Dependencies, dan KPI Logging.                                                                                                                                                          |
| `v2.0.0` | 02/08/2026 | Security Architect | Revisi Total: Penambahan Matriks Retensi Log, Multi-layer Immutability (Anti-tampering Trigger & Hash Chain), Alerting Threshold Matrix, Pseudonymization UU PDP, Schema JSON v2.0 (Trace/Correlation ID), Sinkronisasi NTP UTC, dan Chain of Custody Ekspor Log. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Dokumen ini berkedudukan sebagai petunjuk pelaksana operasional dari **Logging & Monitoring Policy** di bawah **Information Security Management System (ISMS)** UKM Robotik PNP. Dokumen ini terintegrasi secara teknis dengan _Data Protection Policy_ (`data-classification-handling.md`) dan _Access Control Policy_ (`access-control-policy.md`).

Perekaman log audit bertujuan untuk:

1. **Bukti Akuntabilitas Organisasi**: Menjamin seluruh tindakan administratif (promosi role, sanksi, verifikasi oprec, keuangan) memiliki rekam jejak yang tidak dapat disangkal (_non-repudiation_).
2. **Deteksi & Respon Insiden**: Menyediakan alert otomatis saat terjadi anomali atau serangan siber.
3. **Kepatuhan Hukum (UU PDP Pasal 31)**: Memenuhi kewajiban undang-undang untuk merekam seluruh kegiatan pemrosesan data pribadi secara akuntabel.

---

## 2. Pemetaan Sumber Log Full-Stack

Sistem mengumpulkan log dari seluruh tingkatan arsitektur aplikasi:

```
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ Vercel / Edge  │ ──> │ Proxy / Nextjs │ ──> │ Supabase Auth  │
 │ (HTTP Access)  │     │ (Middleware)   │     │ & PostgreSQL   │
 └────────────────┘     └────────────────┘     └────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             Sentry (Error) & Supabase Log Drain              │
 └──────────────────────────────────────────────────────────────┘
```

| Sumber Log             | Komponen Teknis                | Jenis Kejadian yang Dicatat                        | Penanggung Jawab Teknis |
| :--------------------- | :----------------------------- | :------------------------------------------------- | :---------------------- |
| **Database Audit**     | PostgreSQL `public.audit_logs` | Mutasi profil, role update, sanksi, registrasi     | Lead Backend Developer  |
| **Autentikasi**        | Supabase Auth Logs             | Login, logout, refresh token, reset password       | Backend Engineer        |
| **Serverless Runtime** | Vercel Function Logs           | Server Actions execution, HTTP response codes      | DevOps / Lead IT        |
| **Proxy Middleware**   | `lib/supabase/proxy.ts`        | Navigasi terproteksi, RLS redirect, access control | Lead Frontend Developer |
| **Rate Limiter**       | Upstash Redis Logs             | IP Throttling, Rate Limit Breaches                 | Backend Engineer        |
| **Anti-Bot**           | Cloudflare Turnstile Logs      | Captcha verification failures, Bot score           | Fullstack Developer     |
| **Application Error**  | Sentry Exception Logs          | Unhandled errors, 500 internal server errors       | Fullstack Developer     |
| **Storage Access**     | Supabase Storage Logs          | Access to private buckets (KTM, Bukti Bayar)       | Admin Kestari           |

---

## 3. Matriks Kebijakan Retensi Log (_Log Retention Policy_)

Sesuai prinsip _Storage Limitation_ (UU PDP) dan ISO/IEC 27001, retensi log dikategorikan sebagai berikut:

| Kategori Log                          | Retensi Online (_Hot Storage_) | Retensi Arsip (_Cold Storage_) | Tindakan Pasca Retensi              |
| :------------------------------------ | :----------------------------: | :----------------------------: | :---------------------------------- |
| **Authentication Logs**               |            12 Bulan            |            2 Tahun             | Dimusnahkan otomatis (_auto-purge_) |
| **Admin Action Audit Logs**           |            12 Bulan            |            3 Tahun             | Diarsip permanen (Immutable)        |
| **Application Access Logs**           |            3 Bulan             |            1 Tahun             | Dimusnahkan otomatis                |
| **Security Alert Logs**               |            12 Bulan            |            3 Tahun             | Diarsip permanen                    |
| **Financial / Payment Evidence Logs** |            5 Tahun             |            7 Tahun             | Sesuai regulasi akuntansi           |
| **Critical System Audit Trail**       |            5 Tahun             |            10 Tahun            | Diarsip permanen (_Legal Hold_)     |

---

## 4. Mekanisme Integritas Log & Multi-Layer Immutability (Anti-Tampering)

Untuk menjamin log tidak dapat diubah atau dihapus (bahkan oleh pengguna berhak akses tinggi), sistem menerapkan **3 Lapis Perlindungan Immutability**:

### 4.1 Trigger PL/pgSQL Anti-Tampering (Database Level)

Database melarang keras operasi `UPDATE` dan `DELETE` pada tabel `audit_logs`:

```sql
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Akses Ditolak: Log audit bersifat immutable dan tidak dapat diubah atau dihapus!';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();
```

### 4.2 Revokasi Privilege DB Role

Role koneksi aplikasi (`authenticated` / `anon`) **hanya diberikan izin `INSERT` dan `SELECT` terbatas** pada `public.audit_logs`. Hak `UPDATE` dan `DELETE` dicabut secara eksplisit di level PostgreSQL (`REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;`).

### 4.3 Log Signature & External Immutable Log Drain

- Setiap entri log menghasilkan nilai Hash Signature berbasis SHA-256 (`sha256(event_id + timestamp + action + details)`).
- Log dialirkan secara _real-time_ via **Supabase Log Drain** ke lokasi penyimpanan eksternal yang terpisah (_Off-Site Immutable Cloud Storage_).
- Setiap pembacaan log audit oleh admin dicatat sebagai log khusus: `AUDIT_LOG_READ_ACCESSED`.

---

## 5. Matriks Alerting & Ambang Batas Otomatis (_Alerting Threshold Matrix_)

Perekaman log terintegrasi dengan pemantauan otomatis yang memicu notifikasi peringatan (_Alert Channel_) berdasarkan ambang batas berikut:

| Peristiwa Log              |    Ambang Batas (_Threshold_)     | Level Severity |       Kanal Alert        | Tindakan Otomatis / Manual              |
| :------------------------- | :-------------------------------: | :------------: | :----------------------: | :-------------------------------------- |
| **Login Gagal Berulang**   |  $\ge 5$ kali / 10 menit (1 IP)   |   **MEDIUM**   |    Dashboard / Email     | IP diblokir sementara via Upstash.      |
| **Login Gagal Masif**      | $\ge 50$ kali / 10 menit (Global) |    **HIGH**    |  Telegram / Slack Alert  | Peringatan serangan Brute Force masif.  |
| **Perubahan Role Admin**   |            1 kejadian             |    **HIGH**    | Telegram Alert Immediate | Verifikasi keabsahan oleh Super Admin.  |
| **Service Role Key Asing** |       1 kejadian (IP Asing)       |  **CRITICAL**  |  Emergency Call & Slack  | Rotasi `SERVICE_ROLE_KEY` seketika.     |
| **Ekspor Data Masif**      |     $\ge 20$ record / request     |  **CRITICAL**  | Emergency Email & Slack  | Kunci akun pengunduh & investigasi.     |
| **Hard Delete Data**       |            1 kejadian             |  **CRITICAL**  | Telegram Alert Immediate | Verifikasi alur persetujuan data owner. |
| **Rate Limit Abnormal**    |    Lonjakan 3x lipat baseline     |   **MEDIUM**   |   Dashboard Monitoring   | Aktifkan Cloudflare Under Attack Mode.  |

---

## 6. Privasi Log & Pseudonimisasi Data (Kepatuhan UU PDP)

Untuk mematuhi prinsip _Data Minimization_ (UU PDP Pasal 16), log audit menerapkan aturan penyamaan/penyamaran data (_Pseudonymization & Masking_):

1. **Pengecualian Kredensial**: Password polos, token JWT, token Turnstile, dan nomor rekening mentah **DILARANG KERAS** dicatat di log mana pun.
2. **Penyamaran PII (Data Pribadi)**:
   - **NIM**: Disamarkan (contoh: `210109****`).
   - **Nomor Telepon**: Disamarkan (contoh: `0812-****-5678`).
   - **Email**: Disamarkan pada log umum (contoh: `u***r@domain.com`).
3. **Pseudonimisasi ID**: Log error aplikasi (Sentry) hanya mencatat `user_id` (UUIDv4), bukan nama atau identitas asli mahasiswa.

---

## 7. Skema Log JSON Produksi Versi 2.0 (Schema Versioning & Correlation)

Seluruh log audit yang dihasilkan aplikasi menggunakan skema standar JSON v2.0 yang dilengkapi _Trace/Correlation ID_:

```json
{
  "event_id": "evt_9b1deb4d-3b7d-4142-9e12-c28d2077e68c",
  "schema_version": "2.0",
  "timestamp": "2026-08-02T23:30:00.000Z",
  "correlation_id": "corr_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "request_id": "req_88f9a2b1",
  "session_id": "sess_12345abcdef",
  "environment": "production",
  "source_service": "nextjs-proxy-middleware",
  "severity": "CRITICAL",
  "result": "SUCCESS",
  "user_id": "usr_550e8400-e29b-41d4-a716-446655440000",
  "actor_role": "super-admin",
  "action": "PROFILE_ROLE_UPDATE",
  "ip_address": "103.120.45.12",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "target_entity": "profiles",
  "target_id": "usr_999e8400-e29b-41d4-a716-446655440000",
  "details": {
    "old_value": { "role": "anggota" },
    "new_value": { "role": "admin-or" },
    "reason": "Penetapan pengurus baru periode 2026"
  },
  "signature_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## 8. Sinkronisasi Waktu (_Time Synchronization_)

1. **Standar UTC ISO 8601**: Seluruh timestamp pada seluruh log wajib menggunakan standar **UTC dengan penanda `Z`** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
2. **Konversi Tampilan UI**: Konversi ke WIB (GMT+7) dilakukan hanya pada antarmuka UI audit log untuk kenyamanan pembacaan pengurus.
3. **NTP Synchronization**: Server Vercel dan Supabase menyinkronkan jam sistem secara teratur menggunakan **Network Time Protocol (NTP)** untuk mencegah _clock drift_ saat korelasikan log.

---

## 9. Prosedur Ekspor Log & Chain of Custody

Jika log audit dibutuhkan untuk kepentingan investigasi siber atau sengketa hukum:

1. **Pengunduhan Terotorisasi**: Ekspor log hanya dapat dilakukan oleh **Lead IT** dengan persetujuan **Ketua Umum**.
2. **Perhitungan Hash Bukti**: File ekspor log wajib di-hash menggunakan SHA-256:
   ```bash
   sha256sum audit_log_export_[timestamp].json > log_hash.txt
   ```
3. **Berita Acara Ekspor**: Scribe menyusun _Berita Acara Ekspor Log Audit_ yang mencantumkan nama peminta, tujuan, nilai hash, dan tanggal penyerahan.

---

## 10. Metrik Kinerja & KPI Sistem Logging (_Logging Metrics & KPIs_)

| Indikator Kinerja / KPI        |           Target Standar            | Metode Pengukuran                                                               |
| :----------------------------- | :---------------------------------: | :------------------------------------------------------------------------------ |
| **Log Coverage Rate**          |             **$100\%$**             | Persentase event sensitif (CRUD Admin & Auth) yang tercatat di `audit_logs`.    |
| **Log Immutability Integrity** |             **$100\%$**             | $0$ kecurangan edit/hapus pada tabel `audit_logs` (diverifikasi Trigger & RLS). |
| **Log Retention Compliance**   | **12 Bulan (Hot) / 3 Tahun (Cold)** | Ketersediaan log historis untuk audit investigasi.                              |
| **Error Log Unhandled Rate**   |            **$< 0.1\%$**            | Jumlah exception aplikasi yang tidak terkelola di Sentry.                       |

---

_Dokumen ini diterbitkan sebagai standar kebijakan strategi log audit resmi untuk UKM Robotik Politeknik Negeri Padang._
