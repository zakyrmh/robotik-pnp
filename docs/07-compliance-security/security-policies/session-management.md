# Kebijakan Pengelolaan Sesi Login (Session Management Security Policy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                      |
| :------------------------------------ | :----------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-SEC-SES-01`                                                                           |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                            |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                             |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                    |
| **Induk Kebijakan (_Master Policy_)** | _Information Security Policy_ & _Access Control Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                             |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                       |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                               |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                                 |
| :------: | :--------: | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal kebijakan sesi berbasis cookie HTTP-Only.                                                                                                                                                                                                                 |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan penanganan sesi recovery `/update-password` dan proxy state machine.                                                                                                                                                                                     |
| `v2.0.0` | 03/08/2026 | Security Architect | Revisi Total: Penambahan Idle & Absolute Timeout per role, Kontrol Sesi Konkuren, Distributed Rate Limiting (Upstash), Deteksi Reuse Refresh Token, Step-up Re-authentication, Prosedur Break-Glass Rotasi JWT Secret, Caching Proxy Strategy, dan Wajib MFA Admin. |

---

## 1. Pendahuluan & Induk Kebijakan (_Master Policy Umbrella_)

Kebijakan ini merupakan bagian integral dari **Information Security Policy** dan **Access Control Policy** yang bernaung di bawah **Information Security Management System (ISMS)** UKM Robotik PNP.

Tujuan dari kebijakan ini adalah:

1. Menjamin integritas dan kerahasiaan identitas pengguna terautentikasi selama berinteraksi dengan sistem.
2. Mencegah pengambilalihan sesi (_Session Hijacking_, _Session Fixation_, _CSRF_, dan _XSS_).
3. Mengatur siklus hidup sesi berbasis **Next.js 16 App Router**, **Supabase Auth (`@supabase/ssr`)**, **HTTP-Only Cookies**, **Upstash Distributed Rate Limiter**, dan **Proxy Middleware**.

---

## 2. Batasan Durasi Sesi (_Session Timeout Policy_)

Sistem menegakkan dua jenis pembatasan waktu sesi (_Idle Timeout_ dan _Absolute Timeout_) yang disesuaikan dengan tingkat sensitivitas role pengguna (selaras dengan NIST SP 800-63B dan OWASP):

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        MATRIKS BATASAN SESI                            │
 ├─────────────────┬───────────────┬──────────────────┬───────────────────┤
 │ Role Pengguna   │ Idle Timeout  │ Absolute Timeout │ Step-up Re-Auth   │
 ├─────────────────┼───────────────┼──────────────────┼───────────────────┤
 │ Caang / Anggota │ 60 Menit      │ 7 Hari           │ Aksi Sensitif     │
 │ Admin Roles     │ 15–30 Menit   │ 12 Jam           │ Wajib             │
 │ Super Admin     │ 15 Menit      │ 4–8 Jam          │ Wajib             │
 └─────────────────┴───────────────┴──────────────────┴───────────────────┘
```

- **Idle Timeout**: Sesi otomatis berakhir jika pengguna tidak melakukan aktivitas (interaksi/request) selama durasi yang ditentukan.
- **Absolute Timeout**: Sesi wajib diakhiri dan dipaksa login ulang setelah mencapai batas waktu maksimum, meskipun pengguna masih aktif.
- **Step-up Re-Authentication**: Pengguna ber-role Admin wajib memasukkan ulang password atau verifikasi MFA ketika melakukan tindakan berisiko tinggi (misal: pengubahan role, penjatuhan sanksi, atau ekspor data masif).

---

## 3. Batasan Sesi Konkuren & Penegakan MFA (_Session Concurrency & MFA_)

1. **Jumlah Sesi Aktif Maksimum**:
   - Pengguna biasa (`anggota` / `caang`): Maksimal **3 (tiga) sesi aktif** bersamaan pada perangkat berbeda.
   - Role Admin (`super-admin`, `admin-or`, `admin-komdis`, `admin-kestari`, `admin-divisi`): Maksimal **1 (satu) sesi aktif**. Login baru pada perangkat lain akan secara otomatis membatalkan sesi sebelumnya.
2. **Kewajiban Multi-Factor Authentication (MFA / 2FA)**:
   - Seluruh akun ber-role Admin **WAJIB** mengaktifkan MFA (TOTP via Google Authenticator / Authenticator App). Login admin tanpa MFA akan diblokir oleh Proxy Layer.

---

## 4. Arsitektur Cookie & Rotasi Refresh Token

Sistem menyimpan token sesi pada **HTTP-Only Cookies sisi server** dengan atribut keamanan:

- **`HttpOnly`**: Mencegah skrip JS membaca token (mitigasi XSS).
- **`Secure`**: Wajib HTTPS di lingkungan produksi.
- **`SameSite=Lax`**: Membatasi pengiriman cookie lintas situs (mitigasi CSRF).

```
 ┌────────────────────────────────────────────────────────┐
 │                 PASANGAN TOKEN SESI                    │
 ├─────────────────┬──────────────┬───────────────────────┤
 │ Jenis Token     │ Durasi (TTL) │ Tempat Penyimpanan    │
 ├─────────────────┼──────────────┼───────────────────────┤
 │ Access Token    │ 5–15 Menit   │ Cookie HTTP-Only      │
 │ Refresh Token   │ 7–14 Hari    │ Cookie HTTP-Only      │
 └─────────────────┴──────────────┴───────────────────────┘
```

### Deteksi Penggunaan Ulang Refresh Token (_Reuse Detection_)

- Supabase Auth memutar Refresh Token secara otomatis (_Refresh Token Rotation_).
- Jika Refresh Token lama yang sudah kedaluwarsa/pernah digunakan terdeteksi dipakai kembali (indikasi pencurian token), Supabase Auth secara otomatis **membatalkan seluruh famili token** pengguna tersebut dan memaksa login ulang secara menyeluruh.

---

## 5. Distribusi Rate Limiting Terdesentralisasi (Upstash Redis)

Sistem **dilarang menggunakan rate limiter in-memory** pada middleware Vercel/Next.js karena tidak terdistribusi pada lingkungan serverless/multi-instance.

- Seluruh endpoint autentikasi (`/login`, `/register`, `/forgot-password`, `/api/contact`) wajib menggunakan **Upstash Redis Rate Limiter** terdistribusi.
- **Batasan Akses**:
  - Login Gagal: Maksimal 5 kali / 10 menit per IP & per Akun Email.
  - Minta Reset Password: Maksimal 3 kali / 15 menit per IP & per Akun Email.

---

## 6. Prosedur Pembatalan Sesi Darurat (_Break-Glass JWT Secret Rotation_)

Jika terjadi insiden kebocoran kredensial atau kompromi server:

1. **Pencabutan Sesi Pengguna Tunggal**: Executing RPC `supabase.auth.admin.signOut(userId)` yang mencabut refresh token di database server.
2. **Prosedur Break-Glass Rotasi JWT Secret**:
   - Super Admin melakukan rotasi `JWT Secret` pada Supabase Dashboard -> Project Settings -> API.
   - Rotasi ini secara seketika membatalkan **100% sesi login aktif seluruh pengguna** di seluruh aplikasi.
   - Memperbarui environment variables di Vercel dan melakukan _redeploy_ seketika.

---

## 7. Optimasi Kinerja Middleware & Caching Proxy

Untuk mencegah bottleneck latency akibat kueri profil real-time di `lib/supabase/proxy.ts`:

1. **Short-term Caching**: Profil dan role pengguna dicache secara aman pada sesi terenkripsi selama durasi singkat ($< 5$ menit).
2. **Invalidasi Cache Otomatis**: Cache profil diinvalidasi seketika jika terjadi perubahan role (`PROFILE_ROLE_UPDATE`).
3. **Fallback Deny**: Jika kueri profil gagal akibat gangguan koneksi database, middleware wajib mengambil tindakan **Fallback Deny** (mengarahkan pengguna ke halaman error aman, bukan mengizinkan akses).

---

_Dokumen ini diterbitkan sebagai standar kebijakan pengelolaan sesi resmi UKM Robotik Politeknik Negeri Padang._
