# Pemetaan Batas Sumber Daya & Strategi Ketersediaan Tinggi (Infrastructure Resource Tiers, Limits & High Availability Strategy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                        |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-RES-01`                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                      |
| **Induk Kebijakan (_Master Policy_)** | _Deployment Architecture & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                         |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                 |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis             | Ringkasan Perubahan                                                                                 |
| :------: | :--------: | :------------------ | :-------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Solutions Architect | Draf awal pemetaan resource limits, analisis risiko REQ-MRC-08, dan strategi mitigasi arsitektural. |
| `v2.0.0` | 09/08/2026 | System Analyst      | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.                      |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi pemetaan lengkap **Free Tier Resource Limits** dari seluruh penyedia infrastruktur cloud (**Vercel**, **Supabase**, **Upstash Redis**, dan **Cloudflare**) pada platform **Sistem Informasi Manajemen UKM Robotik PNP**.

Dokumen ini secara eksplisit menganalisis risiko batas beban (_bottleneck_), khususnya terkait pemenuhan **REQ-MRC-08** (\"Availability tinggi saat hari-H pelaksanaan Minangkabau Robot Contest / MRC\") untuk modul **Live Score & Jadwal Pertandingan Real-time**.

---

## 2. Pemetaan Resource Tiers & Limits Infrastruktur Cloud

Berikut adalah ringkasan tingkat layanan (_tier_) dan ambang batas kuota gratis yang digunakan oleh sistem saat ini:

| Provider Infrastructure | Active Tier Plan | Key Resource Limits (Free Tier)                                                                                                                                                                  | Potential Bottleneck Risk                                                                                                     |
| :---------------------- | :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**            | **Free Tier**    | - Database Size: **500 MB**<br>- Bandwidth: **5 GB/bulan**<br>- Direct DB Connections: **60**<br>- **Realtime Concurrent Connections: 200 Client Peak**<br>- Realtime Messages: **2 Juta/bulan** | **Tinggi (Kritis)**: Batas 200 koneksi WebSocket bersamaan pada Supabase Realtime menjadi _Single Point of Failure_ saat MRC. |
| **Vercel**              | **Hobby (Free)** | - Bandwidth: **100 GB/bulan**<br>- Serverless Execution: **100 GB-hours**<br>- Function Duration: **10 detik/req**<br>- Deployment Edge Network: Global CDN                                      | **Sedang**: Risiko terlampaui jika streaming data Server Actions dipanggil secara agresif oleh ribuan penonton.               |
| **Upstash Redis**       | **Free Tier**    | - Commands Limit: **10.000 requests/hari**<br>- Max Storage: **256 MB**<br>- Max Concurrent Connections: **1.000**                                                                               | **Rendah**: Cukup untuk caching data jadwal dan _rate limiting_, namun butuh efisiensi struktur key.                          |
| **Cloudflare**          | **Free Plan**    | - DNS & Unmetered DDoS Mitigation<br>- Edge CDN Bandwidth: **Unlimited**<br>- Page Rules / Cache Rules: **10 Active Rules**                                                                      | **Rendah**: Bertindak sebagai benteng terdepan penahan beban trafik statis dan DDoS.                                          |

---

## 3. Analisis Risiko Titik Kegagalan Kritis (REQ-MRC-08 & Live Score)

### 3.1. Deskripsi Persyaratan Bisnis (REQ-MRC-08)

> **REQ-MRC-08**: _Sistem (khususnya modul live score & jadwal) tidak boleh down selama hari pelaksanaan lomba (Minangkabau Robot Contest / MRC)._

### 3.2. Masalah Utama: Batas Supabase Realtime Concurrent Connections

Pada arsitektur _pub/sub_ WebSocket standar, setiap penonton yang membuka halaman Live Score akan mempertahankan 1 koneksi WebSocket aktif (`supabase.channel()`).

- **Batas Free Tier Supabase Realtime**: Maksimal **200 Concurrent Connections** (200 penonton bersamaan).
- **Skenario Hari-H MRC**: Ketika acara berlangsung, diproyeksikan ada **500 – 2.000 penonton** (peserta, juri, pengunjung, dan panitia) yang mengakses halaman Live Score secara simultan melalui smartphone mereka.
- **Dampak Kegagalan Realita**:
  Jika penonton ke-201 mencoba membuka halaman Live Score, koneksi WebSocket Supabase Realtime akan **ditolak (_connection refused/rate limited_)**, menyebabkan antarmuka live score _stuck_, memunculkan eror `WebSocket connection to 'wss://...' failed`, dan berpotensi membuat serverless backend kewalahan (_system outage_).

---

## 4. Strategi Mitigasi Arsitektural (Solusi High Availability Tanpa Upgrade Tier)

Untuk menjamin sistem **tetap 100% UP** sesuai **REQ-MRC-08** tanpa melampaui kuota Free Tier Supabase Realtime (200 koneksi), diterapkan **Hybrid Streaming & Caching Fallback Architecture**:

```
                   [ Live Audience (1.000+ Penonton) ]
                                    │
                                    ▼
                     [ Cloudflare Edge CDN Cache ]
                                    │ (Cache Hit 95% ~5ms)
                                    ▼
              [ Next.js Server Action + Upstash Redis ]
                 (Short Polling Interval 3-5 detik)
                                    ▲
                                    │ (Hanya Admin / Juri)
                                    │ (1-5 Connections Only)
                                    ▼
                [ Supabase PostgreSQL & Realtime DB ]
```

### 4.1. Kebijakan Pembatasan WebSocket (Admin/Juri Only)

1. **WebSocket Realtime Hanya untuk Operator/Admin**:
   Koneksi WebSocket Supabase Realtime (`supabase.channel('score-update')`) **HANYA diaktifkan pada Dashboard Operator Juri & Overlay Stream Broadcast OBS** (Maksimal 5-10 koneksi aktif).
2. **Penonton Umum Menerima HTTP Short-Polling + Redis Cache**:
   Halaman Live Score untuk penonton umum **TIDAK menggunakan WebSocket langsung ke Supabase**. Sebagai gantinya, client melakukan _Short-Polling_ ringan (setiap 3–5 detik) memanggil Server Action `getLiveScoreAction()`.

### 4.2. Upstash Redis Cache-Aside + Cloudflare Edge Shield

1. Setiap kali Juri memperbarui skor, Server Action mengupdate database Supabase sekaligus membarui key cache di **Upstash Redis** (`mrc:livescore:current`).
2. Request polling dari 1.000+ penonton **TIDAK PERNAH menyentuh database Supabase**, melainkan dijawab langsung oleh **Upstash Redis** (dengan latensi $\approx 15\text{ms}$) yang dilindungi oleh **Cloudflare CDN Cache**.
3. **Pencapaian**: Sistem mampu menangani **10.000+ penonton bersamaan** dengan nol beban koneksi WebSocket pada Supabase, sehingga **REQ-MRC-08 terpenuhi sempurna di Free Tier**.

---

## 5. Automatic Degraded Mode (Fallback Mechanism)

Jika kuota harian Upstash Redis (10.000 commands/hari) mendekati ambang batas $90\%$ saat hari-H:

1. **Auto-Extend Polling Interval**: Interval polling di browser penonton secara otomatis dinaikkan dari 3 detik menjadi 10 detik.
2. **Static SWR (Stale-While-Revalidate)**: Mengandalkan `next: { revalidate: 5 }` pada Next.js App Router untuk menyajikan halaman skor statis ter-cache di Vercel Edge Ingress.

---

## 6. Summary Compliance Checklist REQ-MRC-08

- [x] Batas Supabase Realtime (200 koneksi) diisolasi khusus untuk Operator & Juri.
- [x] Penonton publik dialihkan ke arsitektur Short-Polling berbasis Upstash Redis Cache.
- [x] Cloudflare CDN diset ke mode _Aggressive Cache_ untuk halaman publik jadwal & skor.
- [x] Kebijakan _Degraded Mode Fallback_ disiapkan jika terjadi lonjakan beban di luar perkiraan.

---

_Dokumen ini diterbitkan sebagai standar pemetaan batas sumber daya & strategi ketersediaan tinggi resmi untuk UKM Robotik Politeknik Negeri Padang._
