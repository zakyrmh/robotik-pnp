# Kebijakan Standar Keamanan & Kompleksitas Kata Sandi (Password Security Standards Policy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                         |
| :------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-SEC-PWD-02`                                                                              |
| **Versi Dokumen**                     | `v2.0.0` (NIST SP 800-63B Aligned Release)                                                    |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                                |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                       |
| **Induk Kebijakan (_Master Policy_)** | _Information Security Policy_ & _Authentication Standards_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                                |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                          |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                  |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                   |
| :------: | :--------: | :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal aturan password minimal 8 karakter.                                                                                                                                                                                                         |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan rate limit Upstash & bot protection Turnstile.                                                                                                                                                                                             |
| `v2.0.0` | 03/08/2026 | Security Architect | Revisi Total: Penyesuaian penuh dengan NIST SP 800-63B (menghapus aturan komposisi kaku, menambah breached password checking via HaveIBeenPwned k-Anonymity API), estimator zxcvbn, wajib MFA Admin, rate limit per-akun, dan TTL token reset 15-30m. |

---

## 1. Pendahuluan & Penyesuaian Standar NIST SP 800-63B

Kebijakan ini menetapkan standar keamanan kata sandi yang mematuhi rekomendasi **NIST SP 800-63B** (_Digital Identity Guidelines_) dan **OWASP ASVS v4.0**.

### ⚠️ Penyesuaian Krusial terhadap Rekomendasi NIST:

Standar keamanan modern **TIDAK LAGI MEMAKSA aturan komposisi kaku** (seperti wajib 1 huruf besar, 1 angka, 1 simbol) karena terbukti secara empiris mendorong pengguna membuat pola yang mudah ditebak (contoh: `Robotik@123` atau `Pnp@2026`).

Sebagai gantinya, sistem berfokus pada:

1. **Panjang Kata Sandi & Dukungan Passphrase** (Semakin panjang kata sandi, semakin tinggi entropinya).
2. **Pemeriksaan Kata Sandi Bocor (_Breached Password Checking_)**.
3. **Pencegahan Serangan Otomatis via Rate Limiting & CAPTCHA**.

---

## 2. Aturan & Kriteria Kompleksitas Kata Sandi Modern

```
 ┌─────────────────────────────────────────────────────────┐
 │             SYARAT KATA SANDI NIST ALIGNED              │
 ├─────────────────────────────────────────────────────────┤
 │ 1. Panjang Minimal : 8 Karakter (12+ untuk Admin)       │
 │ 2. Panjang Maksimal: 64 - 128 Karakter                  │
 │ 3. Dukungan Karakter: ASCII, Unicode, Spasi (Passphrase)│
 │ 4. Anti-Breach Check: Wajib lulus pemindaian HIBP API   │
 └─────────────────────────────────────────────────────────┘
```

1. **Panjang Minimal & Maksimal**:
   - Pengguna Biasa (`caang` / `anggota`): Minimal **8 karakter**.
   - Pengguna Privilege (`admin` / `super-admin`): Minimal **12 karakter**.
   - Maksimum Panjang: **64 – 128 karakter** untuk mencegah serangan Denial-of-Service (DoS) pada algoritma hashing.
2. **Dukungan Frasa Sandi (_Passphrase Support_)**:
   - Form pendaftaran **WAJIB** mendukung spasi dan seluruh karakter Unicode (contoh passphrase sah: `"robotik PNP juara 1 indonesia!"`).
3. **Pemeriksaan Kata Sandi Bocor (_Breached Password Check_)**:
   - Saat pendaftaran atau reset password, sistem memvalidasi kata sandi ke API HaveIBeenPwned menggunakan **k-Anonymity model** (hanya 5 karakter pertama hash SHA-1 yang dikirimkan).
   - Kata sandi yang ditemukan pernah bocor dalam kompromi publik akan **ditolak secara otomatis**.
4. **Estimator Entropi Berbasis Pola (`zxcvbn`)**:
   - Strength meter pada UI menggunakan pustaka `zxcvbn` untuk mendeteksi pola populer, nama pengguna, atau urutan keyboard. Kata sandi dengan skor `zxcvbn < 3` akan ditolak.

---

## 3. Larangan Kata Sandi Berbasis Konteks Organisasi

Kata sandi dilarang keras mengandung informasi konteks yang mudah ditebak:

- NIM (Nomor Induk Mahasiswa).
- Nama pengguna / Email prefix.
- Kata kunci terkait kampus/organisasi: `robotik`, `pnp`, `padang`, `politeknik`, `oprec`, `admin`.

---

## 4. Keamanan Hashing & Penegakan MFA Admin

1. **Hashing Kriptografi via Supabase Auth**:
   - Kata sandi di-hash menggunakan algoritma **Bcrypt / Argon2id** dengan salt acak yang dikelola oleh Supabase Auth.
   - Kata sandi polos dilarang keras dicetak di log aplikasi, console, atau error trace.
2. **Penegakan Wajib MFA (2FA) untuk Role Admin**:
   - Seluruh role administratif (`super-admin`, `admin-or`, `admin-komdis`, `admin-kestari`, `admin-divisi`) **WAJIB** mengaktifkan TOTP Multi-Factor Authentication.

---

## 5. Proteksi Multi-Layer Terhadap Serangan Credential Stuffing

Untuk menangkal _Brute Force_ terdistribusi dan _Credential Stuffing_:

1. **Adaptive Rate Limiting (Upstash Redis)**:
   - Pembatasan laju tidak hanya berdasarkan IP, tetapi juga **berdasarkan Akun Email Target**:
     - Maksimal 5 kali percobaan login gagal per akun per 10 menit.
     - Setelah 5 kali gagal, akun dikunci sementara (_Account Throttling_) selama 15 menit.
2. **Pencegahan Account Enumeration Terpusat**:
   - Seluruh endpoint (`/login`, `/register`, `/forgot-password`) mengembalikan pesan generik yang sama untuk mencegah peretas mendeteksi keberadaan email terdaftar.

---

## 6. Spesifikasi Token Reset Password

1. **Masa Berlaku Token (TTL)**: Token reset password berlaku maksimal **15 – 30 menit**.
2. **Sekali Pakai (_Single-Use_)**: Token langsung hangus setelah digunakan atau setelah kata sandi berhasil diperbarui.
3. **Invalidasi Sesi**: Pembaruan password memicu pencabutan sesi recovery otomatis (`supabase.auth.signOut()`).

---

_Dokumen ini diterbitkan sebagai standar kebijakan kata sandi resmi UKM Robotik Politeknik Negeri Padang._
