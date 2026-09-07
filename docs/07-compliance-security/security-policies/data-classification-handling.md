# Kebijakan Klasifikasi Data & Penanganan Informasi (Data Classification & Handling Policy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                       |
| :------------------------------------ | :------------------------------------------------------------------------------------------ |
| **ID Dokumen**                        | `DOC-SEC-DAT-04`                                                                            |
| **Versi Dokumen**                     | `v2.0.0` (UU PDP 4-Tier & KMS Aligned Release)                                              |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                              |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                     |
| **Induk Kebijakan (_Master Policy_)** | _Data Protection Policy_ & _Information Security Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Data Governance UKM Robotik PNP                                                    |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                        |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                                                                                       |
| :------: | :--------: | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal klasifikasi data 3 tingkat.                                                                                                                                                                                                                                                                                     |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan penanganan signed URL private storage & SLA UU PDP.                                                                                                                                                                                                                                                            |
| `v2.0.0` | 03/08/2026 | Security Architect | Revisi Total: Klasifikasi 4 Tingkat Data (Publik, Internal, Rahasia, Sangat Rahasia/Restricted), Penjelasan Presisi Hashing vs Enkripsi, Key Management System (KMS), Pengamanan Signed URL (MIME check, 5MB limit, `no-store`), Verifikasi Identitas Hak Subjek Data, Kebijakan Test Data, dan Retensi Log Non-Permanen. |

---

## 1. Pendahuluan & Penyesuaian Undang-Undang PDP

Kebijakan ini menguraikan tata cara pengelompokan, penyimpanan, enkripsi, dan penanganan data pada Sistem Manajemen UKM Robotik PNP sesuai dengan **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** dan **ISO/IEC 27001:2022 Annex A.8.10**.

---

## 2. Matriks Klasifikasi Data 4 Tingkat (_4-Tier Data Classification_)

Untuk menjamin tingkat perlindungan yang proporsional, data dibagi menjadi **4 (empat) tingkat sensitivitas**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   MATRIKS KLASIFIKASI DATA 4 TINGKAT                   │
 ├────────────────┬──────────────────────────────────┬────────────────────┤
 │ Level          | Elemen Data                      │ Kontrol Keamanan   │
 ├────────────────┼──────────────────────────────────┼────────────────────┤
 │ 1. Publik      │ Nama Lengkap, Jabatan, Foto Profil│ Akses Bebas Publik │
 │ 2. Internal    │ Jurusan, Angkatan, Status Member │ Akses Terotentikasi│
 │ 3. Rahasia     │ NIM + Nama, No HP, Alamat, Email │ Masking & RLS      │
 │ 4. Sangat      │ Password Hash, Bukti Pembayaran, │ Encrypted, Signed  │
 │    Rahasia     │ Foto KTM, Sanksi SP, Evaluasi    │ URL, Audit Trail   │
 └────────────────┴──────────────────────────────────┴────────────────────┘
```

1. **Level 1: Data Publik** — Informasi yang dapat diakses oleh publik tanpa otentikasi (Nama Lengkap pengurus, Jabatan, Foto Profil Publik, Artikel).
2. **Level 2: Data Internal** — Data organisasi yang hanya dapat diakses oleh anggota terautentikasi (Jurusan, Angkatan, Status Keanggotaan, Jadwal Kegiatan).
3. **Level 3: Data Rahasia (_Confidential_)** — Data pribadi sensitif yang memerlukan RLS dan penyamaran (_masking_) jika ditampilkan di antarmuka publik (Kombinasi NIM + Nama, Nomor HP, Email, Alamat Domisili).
4. **Level 4: Data Sangat Rahasia (_Restricted / Sensitive_)** — Data dengan risiko tertinggi yang wajib dienkripsi dan dilindungi Signed URL (Password Hash, Berkas Bukti Pembayaran Oprec, Foto KTM/Kartu Identitas, Catatan Sanksi Kedisiplinan, Catatan Evaluasi Kinerja).

---

## 3. Pemisahan Konsep Hashing, Enkripsi, dan Key Management System (KMS)

Dokumen ini membedakan secara tegas istilah kriptografi yang digunakan:

1. **Password Hashing (Bcrypt / Argon2id)**: Kata sandi **TIDAK DIENKRIPSI**, melainkan di-hash satu arah dengan salt acak yang dikelola oleh Supabase Auth.
2. **Enkripsi At-Rest (AES-256)**: Seluruh disk penyimpanan basis data Supabase dan Storage Buckets terenkripsi menggunakan algoritma **AES-256** di level infrastruktur cloud.
3. **Key Management System (KMS)**:
   - Kunci enkripsi dikelola terpisah melalui Cloud KMS / Key Vault.
   - Pemegang kunci (_Key Custodian_: Lead IT) dipisahkan dari operator basis data (_Storage Operator_: DevOps).
   - Kunci enkripsi dirotasi secara berkala 1 (satu) tahun sekali.

---

## 4. Keamanan Akses Berkas Private Storage & Signed URL

Berkas Level 4 pada Supabase Storage Buckets (Bukti Pembayaran & KTM) wajib dilindungi oleh prosedur **Signed URL**:

1. **Otorisasi Pra-Generasi**: Sebelum Signed URL diterbitkan, server wajib memverifikasi bahwa pengakses adalah pemilik berkas atau Admin OR/Kestari yang sah.
2. **Durasi Berlaku Singkat**: Token Signed URL berlaku **maksimal 15 menit**.
3. **Batasan Teknis Upload**:
   - Batas ukuran file maksimal: **5 MB**.
   - Validasi MIME Type ketat (`image/jpeg`, `image/png`, `application/pdf`).
   - Header HTTP Wajib: `Cache-Control: no-store, no-cache, private`.

---

## 5. Standar Penyamaran Data (_Data Masking Guidelines_)

Untuk mencegah kebocoran data pribadi pada tampilan UI:

- **NIM**: Disamarkan dengan hanya menampilkan 4 digit terakhir (contoh: `****1234`).
- **Nomor Telepon**: Disamarkan (contoh: `0812-****-5678`).
- **Email**: Disamarkan pada antarmuka publik (contoh: `u***r@domain.com`).

---

## 6. Prosedur Verifikasi Identitas Hak Subjek Data (UU PDP SLA 3x24 Jam)

Pemenuhan Hak Subjek Data (Akses, Perbaikan, dan Penghapusan Data per Pasal 32 & 43 UU PDP) wajib melalui **Verifikasi Identitas Ketat**:

1. Pemohon wajib mengajukan permohonan melalui email terdaftar atau antarmuka terverifikasi.
2. Tim Kestari melakukan verifikasi identitas (mencocokkan foto identitas/KTM) untuk mencegah serangan _Social Engineering_.
3. Permohonan diproses dalam target **SLA maksimal $3 \times 24$ Jam** dan dicatat dalam `audit_logs`.

---

## 7. Retensi Data, Pemusnahan, dan Larangan Data Produksi untuk Testing

1. **Retensi Audit Log**: Log audit disimpan 12 bulan di hot storage dan maksimal 3-5 tahun di cold storage, kemudian dianonimkan/dimusnahkan (**DILARANG disimpan permanen tanpa batas** kecuali terdapat status _Legal Hold_).
2. **Pemusnahan Data Caang Batal**: Calon anggota yang ditolak/batal dihapus permanen dari basis data dan storage setelah 30 hari pasca Oprec berakhir.
3. **Kebijakan Test Data**: **DILARANG KERAS** menggunakan data pribadi asli/produksi untuk lingkungan pengujian (_Staging / Local Testing_). Pengujian wajib menggunakan data buatan (_Mock / Anonymized Data_).

---

_Dokumen ini diterbitkan sebagai standar kebijakan klasifikasi dan penanganan data resmi UKM Robotik Politeknik Negeri Padang._
