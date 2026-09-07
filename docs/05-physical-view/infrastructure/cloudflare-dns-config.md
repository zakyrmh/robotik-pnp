# Panduan Konfigurasi DNS, Proxy/CDN & SSL/TLS Cloudflare (Cloudflare DNS, Proxy/CDN Rules & SSL/TLS Configuration Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                     |
| :------------------------------------ | :---------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-CFL-01`                                                                          |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                           |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                            |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                   |
| **Induk Kebijakan (_Master Policy_)** | _Infrastructure Configuration & Cloud Services Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                            |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis                 | Ringkasan Perubahan                                                                |
| :------: | :--------: | :---------------------- | :--------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Infrastructure Engineer | Draf awal konfigurasi DNS, SSL/TLS, CDN caching, dan keamanan jaringan Cloudflare. |
| `v2.0.0` | 09/08/2026 | System Analyst          | Revisi: Penambahan Document Control, perbaikan typo konten, dan penutup formal.    |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis dan panduan konfigurasi **Cloudflare** sebagai penyedia layanan DNS, CDN/Edge Proxy, WAF Security, dan Enkripsi SSL/TLS untuk domain utama `ukmrobotik-pnp.or.id` pada **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 2. Konfigurasi DNS Records

Pengaturan DNS Records dikonfigurasi melalui **Cloudflare Dashboard** $\rightarrow$ **DNS** $\rightarrow$ **Records**.

Seluruh trafik web publik yang mengarah ke Vercel diatur ke mode **Proxied (Awan Oranye)** untuk mendapatkan proteksi WAF, mitigasi DDoS, dan caching CDN, sedangkan koneksi API khusus yang sensitif terhadap WebSocket/Direct DB dipasang ke mode **DNS Only (Awan Abu-abu)**.

| Type    | Name         | Target / Content                      | Proxy Status           | TTL  | Fungsi / Destinasi                                     |
| :------ | :----------- | :------------------------------------ | :--------------------- | :--- | :----------------------------------------------------- |
| `A`     | `@`          | `76.76.21.21`                         | **Proxied (Oranye)**   | Auto | Apex/Root Domain mengarah ke Vercel Edge Ingress       |
| `CNAME` | `www`        | `cname.vercel-dns.com`                | **Proxied (Oranye)**   | Auto | Alias Subdomain WWW ke Vercel                          |
| `CNAME` | `staging`    | `cname.vercel-dns.com`                | **Proxied (Oranye)**   | Auto | Subdomain Staging Environment                          |
| `CNAME` | `supabase`   | `qtblwlzbxfopcvyvplfh.supabase.co`    | **DNS Only (Abu-abu)** | Auto | Custom Domain API Supabase Direct Connection           |
| `TXT`   | `@`          | `v=spf1 include:_spf.google.com ~all` | **DNS Only (Abu-abu)** | Auto | SPF Record untuk Autentikasi Kirim Email Transaksional |
| `TXT`   | `_turnstile` | `sitekey=0x4AAAAAA...`                | **DNS Only (Abu-abu)** | Auto | Verifikasi Pemilikan Domain Cloudflare Turnstile       |

---

## 3. SSL/TLS Encryption Mode

Navigasi ke **Cloudflare Dashboard** $\rightarrow$ **SSL/TLS** $\rightarrow$ **Overview**:

- **Mode Enkripsi Utama**: **`Full (Strict)`**
  - _Alasan_: Menjamin enkripsi 100% _end-to-end_ (Client Browser $\leftrightarrow$ Cloudflare Edge $\leftrightarrow$ Vercel Origin Server). Vercel Origin Server secara otomatis memegang sertifikat SSL valid dari Let's Encrypt / Digicert.
- **Edge Certificates**:
  - **Always Use HTTPS**: `ON` (Otomatis meredireksi HTTP request ke HTTPS).
  - **HTTP Strict Transport Security (HSTS)**: `Enabled` (`max-age=31536000`, `includeSubDomains`, `preload`).
  - **Minimum TLS Version**: `TLS 1.2` (Menolak enkripsi versi usang TLS 1.0/1.1).
  - **Opportunistic Encryption**: `ON`.

---

## 4. Proxy & CDN Optimization Rules

Navigasi ke **Cloudflare Dashboard** $\rightarrow$ **Rules** / **Caching** untuk mengoptimalkan pengiriman aset statis Next.js 16:

### 4.1. Page Rules & Caching Rules

#### Rule 1: Dynamic App Router Routes (Bypass CDN Cache)

- **URL Pattern**: `ukmrobotik-pnp.or.id/dashboard/*`, `ukmrobotik-pnp.or.id/api/*`
- **Cache Level**: `Bypass`
- **Tujuan**: Memastikan data interaktif, Server Actions, dan sesi pendaftaran tidak ter-cache di CDN Edge.

#### Rule 2: Next.js Static Assets Caching (Aggressive Cache)

- **URL Pattern**: `ukmrobotik-pnp.or.id/_next/static/*`
- **Cache Level**: `Cache Everything`
- **Edge Cache TTL**: `1 Month`
- **Browser Cache TTL**: `1 Year` (Immutability Caching)
- **Tujuan**: Mempercepat _loading time_ JavaScript bundle dan CSS Tailwind v4 secara drastis.

#### Rule 3: Public Storage Media (Supabase Profiles & Banners)

- **URL Pattern**: `ukmrobotik-pnp.or.id/storage/public/*`
- **Cache Level**: `Cache Everything`
- **Edge Cache TTL**: `7 Days`

---

## 5. Keamanan & Network Settings

- **Web Analytics**: Cloudflare Web Analytics di-enable untuk pemantauan ketersediaan rute tanpa melacak data pribadi pengguna (Privacy-first).
- **IPv6 Compatibility**: `ON`.
- **WebSockets**: `ON` (Mendukung fitur Supabase Realtime WebSocket).
- **gRPC Support**: `ON`.
- **Brotli Compression**: `ON` (Kompresi data transisi jaringan tingkat tinggi).

---

## 6. Checklist Verifikasi Domain & Infrastructure

- [ ] DNS A Record `@` & CNAME `www` di-set ke mode Proxied (Oranye).
- [ ] SSL/TLS Mode dikunci pada **Full (Strict)**.
- [ ] HSTS aktif dengan `max-age` 1 tahun.
- [ ] Caching Rule `Bypass` terpasang pada rute `/dashboard/*` dan `/api/*`.
- [ ] Custom Domain terverifikasi di Vercel Dashboard dengan status _Valid Configuration_.

---

_Dokumen ini diterbitkan sebagai standar panduan konfigurasi Cloudflare DNS, CDN & SSL/TLS resmi untuk UKM Robotik Politeknik Negeri Padang._
