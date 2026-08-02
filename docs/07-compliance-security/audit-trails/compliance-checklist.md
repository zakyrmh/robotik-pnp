# Program Kepatuhan Keamanan & Audit Berkala (Security Compliance & Governance Program)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                               |
| :------------------------------------ | :------------------------------------------------------------------ |
| **ID Dokumen**                        | `DOC-AUD-CHK-04`                                                    |
| **Versi Dokumen**                     | `v2.0.0` (Continuous Security Compliance & Governance Program)      |
| **Tanggal Efektif**                   | 2 Agustus 2026                                                      |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)             |
| **Induk Kebijakan (_Master Policy_)** | _Compliance & Governance Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Governance Compliance UKM Robotik PNP                      |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                        |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                                                                                                  |
| :------: | :--------: | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal checklist bulanan & tahunan.                                                                                                                                                                                                                                                                                               |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan Document Control ISO 27001, Master Policy, RACI Matrix, Pemetaan Aset, dan KPI.                                                                                                                                                                                                                                           |
| `v2.0.0` | 02/08/2026 | Security Architect | Revisi Total: Transformasi ke Continuous Governance Program. Penambahan Pemetaan Standar (ISO 27001/CIS/OWASP/UU PDP), SLA Remediasi, Kontrol Otomatis (CI/CD SAST/DAST/Secret Scan), Quarterly Access Recertification, MFA Enforcement, Jadwal Rotasi Secret, DPIA, Vendor Risk Review, Change Management, dan Artefak Bukti Wajib. |

---

## 1. Pemetaan ke Standar Keamanan Internasional & Hukum (_Standard Mapping_)

Program compliance ini memetakan seluruh kontrol teknis dan operasional ke standar industri internasional:

| Standar Keamanan / Regulasi  | Kode Kontrol Terkait                | Cakupan Implementasi Sistem                                                                |
| :--------------------------- | :---------------------------------- | :----------------------------------------------------------------------------------------- |
| **ISO/IEC 27001:2022**       | Annex A.5.18, A.8.8, A.8.15, A.8.20 | Kontrol Akses, Management of Technical Vulnerabilities, Logging, Network Security          |
| **CIS Controls v8**          | Control 5, 6, 7, 8, 16              | Account Management, Access Control, Vulnerability Management, Log Management, App Security |
| **OWASP ASVS v4.0**          | Level 2 (V2, V3, V14)               | Authentication, Access Control, Configuration Verification Standards                       |
| **UU PDP No. 27 Tahun 2022** | Pasal 4, 16, 31, 35, 43, 46         | Prinsip Pemrosesan, Log Audit, Keamanan Data, Pemusnahan Data, Breach Notification         |

---

## 2. Matriks SLA Pemulihan / Remediasi Temuan (_Remediation SLA Table_)

Setiap kerentanan atau temuan audit wajib ditindaklanjuti dan diperbaiki sesuai target SLA waktu berikut:

```
 ┌─────────────────────────────────────────────────────────┐
 │               MATRIKS SLA REMEDIASI TEMUAN              │
 ├─────────────────────────────────────────────────────────┤
 │ 1. CRITICAL (SEV-0) : SLA <= 24 Jam                     │
 │ 2. HIGH (SEV-1)     : SLA <= 7 Hari                     │
 │ 3. MEDIUM (SEV-2)   : SLA <= 30 Hari                    │
 │ 4. LOW (SEV-3)      : SLA <= 90 Hari (Next Sprint)     │
 └─────────────────────────────────────────────────────────┘
```

| Severity Temuan | Target SLA Remediasi | Dampak & Risiko Temuan                                        | Penanggung Jawab Perbaikan |
| :-------------: | :------------------: | :------------------------------------------------------------ | :------------------------- |
|  **CRITICAL**   |   **$\le 24$ Jam**   | Kebocoran data rahasia, RCE, kebocoran secret key, RLS bypass | Technical Lead / Lead IT   |
|    **HIGH**     |   **$\le 7$ Hari**   | Kerentanan `npm audit` High, account takeover risk, XSS       | Senior Fullstack Developer |
|   **MEDIUM**    |  **$\le 30$ Hari**   | Miskonfigurasi header, rate limit bypass minor, CSRF minor    | Fullstack Developer        |
|     **LOW**     |  **$\le 90$ Hari**   | Pengoptimalan kode, refactoring minor, rekomendasi UI         | Software Engineer          |

---

## 3. Jadwal Rotasi Secret & Kredensial (_Secret Rotation Schedule_)

Untuk mencegah kompromi akibat kredensial yang mengendap lama, seluruh secret wajib dirotasi secara berkala:

| Nama Secret / Kredensial     | Frekuensi Rotasi | Prosedur Rotasi                                   | Penanggung Jawab    |
| :--------------------------- | :--------------: | :------------------------------------------------ | :------------------ |
| `SUPABASE_SERVICE_ROLE_KEY`  | **Per 6 Bulan**  | Rotasi via Supabase Dashboard & update Vercel env | Super Admin         |
| **Vercel Deployment Tokens** | **Per 6 Bulan**  | Revoke & generate new token via Vercel Console    | DevOps / Lead IT    |
| **Upstash Redis Tokens**     | **Per 6 Bulan**  | Rotasi token via Upstash Console                  | Backend Engineer    |
| **Backup Encryption Key**    | **Per 1 Tahun**  | Re-encrypt backup files dengan kunci AES-256 baru | Lead IT             |
| **Sentry DSN Secret**        | **Per 1 Tahun**  | Regenerate DSN Project via Sentry Settings        | Fullstack Developer |

---

## 4. Penegakan Kontrol Otomatis Berkelanjutan (_Automated Continuous Controls_)

Compliance tidak lagi mengandalkan checklist manual semata, melainkan dijalankan secara terotomatisasi pada pipeline CI/CD GitHub Actions:

### 4.1 Automated Security Scans (CI/CD Pipeline)

- [ ] **Automated Dependency Scan (`npm audit`)**: Berjalan otomatis setiap ada _Pull Request_ baru. Menolak PR jika ditemukan kerentanan High/Critical.
- [ ] **Secret Scanning (GitGuardian / Trufflehog)**: Pemindaian otomatis commit untuk mencegah kebocoran `SUPABASE_SERVICE_ROLE_KEY` atau password mentah ke GitHub.
- [ ] **SAST (Static Analysis - ESLint Security Rules)**: Pemindaian sintaksis kode otomatis untuk mencegah pola rentan (misal: `dangerouslySetInnerHTML`).

### 4.2 Automated Alerting & Monitoring

- [ ] **Backup Failure Alert**: Notifikasi otomatis via email/Slack jika backup harian 02.00 WIB gagal dieksekusi.
- [ ] **RLS Drift Detection**: Pemindaian berkala skema DB untuk memastikan seluruh tabel baru di skema `public` otomatis mengaktifkan RLS (`rls_auto_enable` trigger).

---

## 5. Program Sertifikasi Ulang Akses Triwulanan (_Quarterly Access Recertification_)

Dilakukan **setiap 3 (tiga) bulan sekali** oleh Admin Kestari bersama Super Admin:

- [ ] **Audit Peran Admin**: Memeriksa seluruh daftar akun ber-role privilege (`super-admin`, `admin-or`, `admin-komdis`, `admin-kestari`, `admin-divisi`). Memastikan setiap akun aktif masih menjabat secara sah.
- [ ] **Revokasi Pengurus Demisioner**: Menurunkan role mantan pengurus yang sudah demisioner menjadi `anggota` atau `alumni`.
- [ ] **Enforcement Multi-Factor Authentication (MFA)**: Memastikan seluruh akun ber-role Admin telah mengaktifkan **MFA (2FA)** dan menyimpan _backup recovery codes_ secara aman.
- [ ] **Verifikasi Persetujuan Data Owner**: Memastikan penambahan role admin baru mendapat persetujuan tertulis dari Ketua Umum UKM.

---

## 6. Prosedur Manajemen Perubahan & RLS Review (_Change Management Checklist_)

Setiap rilis fitur baru atau pembaruan skema database wajib melalui tahapan _Change Management_:

- [ ] **Pre-Release Code Review**: Setiap PR wajib disetujui (_approved_) oleh minimal 1 Senior Developer.
- [ ] **Schema Migration RLS Verification**: Setiap penambahan tabel / kolom baru di `supabase/migrations/` wajib menyertakan unit test RLS Policy.
- [ ] **Staging Environment Validation**: Menguji perubahan di environment staging sebelum dikirim ke produksi.
- [ ] **Rollback Plan**: Memastikan ketersediaan skrip rollback SQL jika rilis mengalami kegagalan.

---

## 7. Data Protection Impact Assessment (DPIA) & Verifikasi Pemusnahan Data

Sesuai **Pasal 34 & 43 UU PDP**:

- [ ] **Pelaksanaan DPIA Berkala**: Menyelenggarakan penilaian dampak privasi terhadap pengolahan data berisiko tinggi (NIM, bukti pembayaran, KTM, sanksi kedisiplinan) minimal 1 kali per tahun.
- [ ] **Verifikasi Pemusnahan Data Caang Batal**: Memastikan calon anggota yang ditolak/dibatalkan pada periode Oprec sebelumnya telah dihapus permanen (_hard delete_) dari database dan storage setelah masa retensi 30 hari berakhir.
- [ ] **Berita Acara Pemusnahan Data**: Menyusun dan menandatangani Berita Acara Pemusnahan Data Resmi.

---

## 8. Penilaian Risiko Pihak Ketiga (_Third-Party Vendor Risk Review_)

Dilakukan **1 kali per tahun** untuk menilai tingkat keamanan penyedia layanan cloud:

| Nama Vendor         | Layanan       | Evaluasi SLA & Compliance          | Evaluasi Data Residency   | Status Review |
| :------------------ | :------------ | :--------------------------------- | :------------------------ | :-----------: |
| **Supabase Inc.**   | DB & Auth     | SOC2 Type II, ISO 27001 Compliant  | Region Singapore / AWS SG |  **PASSED**   |
| **Vercel Inc.**     | Web Hosting   | SOC2 Type II, Global Edge Security | Global Edge / AWS US/SG   |  **PASSED**   |
| **Upstash Inc.**    | Redis Store   | SOC2 Type II Compliant             | AWS SG Region             |  **PASSED**   |
| **Cloudflare Inc.** | WAF & CAPTCHA | ISO 27001, GDPR Compliant          | Global Anycast            |  **PASSED**   |

---

## 9. Kewajiban Bukti Artefak Audit (_Required Evidence Artifacts_)

Setiap klaim checklist yang diisi **WAJIB dilampirkan dengan bukti artefak digital**:

| Item Checklist                   | Jenis Artefak Wajib yang Harus Dilampirkan                  | Format Storage Artefak                         |
| :------------------------------- | :---------------------------------------------------------- | :--------------------------------------------- |
| **Audit Dependensi `npm audit`** | PDF / Text Export log hasil `npm audit`                     | `/docs/audit-evidence/npm-audit-[date].txt`    |
| **Simulasi Restore DB**          | Log Terminal Restore & Screenshot Dashboard Staging         | `/docs/audit-evidence/restore-test-[date].png` |
| **Revokasi Akun Demisioner**     | Export JSON `audit_logs` untuk action `PROFILE_ROLE_UPDATE` | `/docs/audit-evidence/revoke-log-[date].json`  |
| **Secret Rotation**              | Ticket ID Jira / GitHub Issue penugasan rotasi key          | Link Ticket / Issue GitHub                     |
| **Berita Acara Restore / Hapus** | Scan Berita Acara resmi ber-tandatangan                     | `/docs/audit-evidence/berita-acara-[date].pdf` |

---

## 10. Matriks RACI & KPI Kepatuhan Program

### 10.1 Matriks RACI

| Aktivitas Compliance Program            | Lead IT / Super Admin | Dev Team | Admin Kestari | Ketua Umum | Pembina Kampus |
| :-------------------------------------- | :-------------------: | :------: | :-----------: | :--------: | :------------: |
| **Audit Continuous Automated Controls** |         **A**         |  **R**   |       I       |     I      |       I        |
| **Quarterly Access Recertification**    |         **A**         |  **R**   |     **R**     |   **A**    |       I        |
| **DPIA & Retention Purge Verification** |           C           |  **R**   |   **A / R**   |   **A**    |       I        |
| **Third-Party Vendor Review**           |       **A / R**       |    C     |       I       |     I      |       I        |

### 10.2 KPI Kinerja Compliance Program

- **Overall Compliance Score**: Target $\ge 95\%$.
- **Akun Demisioner Revoke Rate**: Target $100\%$ dalam 7 hari.
- **Open Audit Findings SLA Compliance**: Target $100\%$ perbaikan tepat waktu sesuai SLA Remediasi.
- **Critical Vulnerability Score**: Target $0$ kerentanan pada `npm audit`.

---

## 11. Lembar Berita Acara Audit Kepatuhan Berkala

```text
====================================================================
BERITA ACARA AUDIT KEPATUHAN KEAMANAN SISTEM UKM ROBOTIK PNP
====================================================================
Tanggal Pelaksanaan Audit : ________________________________________
Jenis Audit               : [ ] Quarterly Access Review  [ ] Annual DPIA & Scan
Nama Auditor / IT Lead    : ________________________________________
Role / Jabatan            : ________________________________________

RINGKASAN HASIL AUDIT & ARTEFAK BUKTI:
1. Akun Demisioner Di-Revoke   : _____ Akun (Artefak: revoke-log-[date].json)
2. Kerentanan npm Diperbaiki  : _____ Vulnerabilities (Artefak: npm-audit-[date].txt)
3. Hasil Simulasi Restore DB   : [ ] Sukses    [ ] Gagal (Artefak: restore-test-[date].png)
4. Verifikasi Pemusnahan Data  : [ ] Selesai   [ ] N/A (Artefak: berita-acara-[date].pdf)

SLA REMEDIASI TEMUAN TERBUKA:
- Critical Findings (<= 24j)  : _____ Temuan (Ticket ID: _________)
- High Findings (<= 7h)       : _____ Temuan (Ticket ID: _________)

Catatan & Rekomendasi Perbaikan:
____________________________________________________________________
____________________________________________________________________

Tanda Tangan Lead IT                   Tanda Tangan Ketua Umum UKM

( ____________________ )              ( ____________________ )
====================================================================
```

---

_Dokumen ini diterbitkan sebagai standar program kepatuhan keamanan dan tata kelola resmi UKM Robotik Politeknik Negeri Padang._
