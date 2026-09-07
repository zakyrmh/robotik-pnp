# Kebijakan Kontrol Akses Berbasis Peran (Role-Based Access Control / RBAC Policy)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                      |
| :------------------------------------ | :----------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-SEC-ACC-03`                                                                           |
| **Versi Dokumen**                     | `v2.0.0` (Least Privilege & Dual-Control Release)                                          |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                             |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                    |
| **Induk Kebijakan (_Master Policy_)** | _Information Security Policy_ & _Access Control Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                             |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                       |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                               |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis            | Ringkasan Perubahan                                                                                                                                                                                                                                                                                           |
| :------: | :--------: | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v1.0.0` | 02/08/2026 | System Analyst     | Draf awal matriks RBAC 8 role.                                                                                                                                                                                                                                                                                |
| `v1.1.0` | 02/08/2026 | Security Architect | Penambahan hierarki role turunan anggota & revisi baris piket Kestari.                                                                                                                                                                                                                                        |
| `v2.0.0` | 03/08/2026 | Security Architect | Revisi Total: Pengetatan Least Privilege (pencabutan CRUD `legacy_members` dari `admin-or`), Dual Control/Maker-Checker untuk Keuangan `or_settings`, Status-Based Editing pada `registrations`, RLS Policy Templates & pgTAP Testing, Sertifikasi Akses Triwulanan, dan Kontrol Service Account Non-Manusia. |

---

## 1. Pendahuluan & Prinsip Utama Akses

Dokumen ini mendefinisikan kebijakan **Role-Based Access Control (RBAC)** yang mengontrol wewenang akses pada Sistem Informasi Manajemen UKM Robotik PNP.

Kebijakan ini mematuhi prinsip utama:

1. **Prinsip Privilege Minimum (_Principle of Least Privilege_)**: Setiap role hanya diberikan hak akses yang mutlak diperlukan untuk tugasnya.
2. **Pemisahan Tugas (_Separation of Duties - SoD_)**: Mencegah pemusatan wewenang tunggal pada aktivitas berisiko tinggi (misal: keuangan Oprec & persetujuan anggota).
3. **Penerapan Dual Control (Maker-Checker)**: Perubahan konfigurasi keuangan atau kelulusan anggota memerlukan persetujuan dua pihak.

---

## 2. Hierarki Role Pengguna & Kewajiban MFA

Sistem mengelola 8 (delapan) role utama di mana 5 role admin merupakan **turunan (_subtype_) dari role `anggota`**:

```
Pengguna
 ├─ Caang
 ├─ Anggota (MFA Optional)
 │   ├─ SuperAdmin    ──┐
 │   ├─ AdminOR         │
 │   ├─ AdminKomdis     ├── WAJIB MFA (2FA)
 │   ├─ AdminKestari    │
 │   └─ AdminDivisi   ──┘
 └─ Alumni
```

> **Aturan Keamanan Wajib**: Seluruh akun ber-role Admin **WAJIB mengaktifkan Multi-Factor Authentication (MFA)**.

---

## 3. Matriks Hak Akses Data Ter-Revisi (CRUD Matrix & SoD Enforced)

Berikut adalah pemetaan hak akses ter-revisi yang telah mengetatkan _least privilege_:

| Entitas Data / Tabel DB                                  |   `super-admin`   |        `admin-or`        |     `admin-komdis`     |    `admin-kestari`    | `admin-divisi` |      `anggota`      |        `caang`        |     `alumni`     |
| :------------------------------------------------------- | :---------------: | :----------------------: | :--------------------: | :-------------------: | :------------: | :-----------------: | :-------------------: | :--------------: |
| **Profiles Pengguna** (`profiles`)                       |      CRUD\*       |    R (Caang/Anggota)     |   R (Caang/Anggota)    | R (Direktori Masked)  |   R (Divisi)   |  RU (Own Profile)   |   RU (Own Profile)    | RU (Own Profile) |
| **Legacy Members** (`legacy_members`)                    |       CRUD        |    **R (Read-Only)**     |           R            |       **CRUD**        |       R        |          R          |           -           |        R         |
| **Pengaturan Oprec & Biaya** (`or_settings`)\*           | **Maker-Checker** |    **Maker (Input)**     |           R            |           R           |       R        |          R          |           R           |        -         |
| **Pendaftaran Caang** (`registrations`)\*                |       CRUD        | **CRU (Approve/Reject)** |           R            |           R           |       -        |          -          | **Status-Based Edit** |        -         |
| **Kegiatan** (`activities`)                              |       CRUD        |   CRUD (Target: Caang)   | CRUD (Target: Anggota) |           R           |       R        |          R          |   R (Target: Caang)   |        R         |
| **Absensi** (`attendances`)\*                            |       CRUD        |           CRUD           |          CRUD          |           R           |       R        | CR (Own Attendance) |  CR (Own Attendance)  |        -         |
| **Jadwal & Log Piket** (`piket_schedules`, `piket_logs`) |       CRUD        |       CR (Own Log)       |      CR (Own Log)      |       **CRUD**        |       R        |    CR (Own Log)     |           -           |        -         |
| **Poin Disiplin & Sanksi** (`sanctions`)                 |       CRUD        |            R             |          CRUD          |           R           |       -        |   R (Own Status)    |    R (Own Status)     |        -         |
| **Pesan Kontak** (`contact_messages`)                    |       CRUD        |            R             |           -            | **Resolve / Archive** |       -        |          -          |           -           |        -         |

> **Catatan Pengetatan Akses**:
>
> - **`super-admin`\***: Pengaksesan bukti pembayaran / dokumen identitas oleh Super Admin wajib mencantumkan alasan audit di `audit_logs`.
> - **`or_settings`\***: Perubahan biaya pendaftaran/rekening memerlukan _Maker_ (`admin-or`) dan _Checker_ (Ketua Umum / Super Admin).
> - **`registrations` (Caang Status-Based Editing)**:
>   - Status `draft`: Caang dapat mengubah data (CRU).
>   - Status `submitted` / `pending` / `verified` / `rejected`: Read-only untuk Caang.
> - **`admin-or` pada `legacy_members`**: Hak diubah menjadi **Read-Only** untuk mencegah konflik kepentingan antara rekrutmen baru dan klaim data lama.

---

## 4. Akses Aktor Non-Manusia (_Service Account & System Triggers_)

1. **Database Triggers & Functions**: Executed dengan flag `SECURITY DEFINER` dengan `search_path` eksplisit (`SET search_path TO 'public'`) untuk mencegah serangan _privilege escalation_.
2. **`SUPABASE_SERVICE_ROLE_KEY`**: Hanya boleh digunakan pada Server Actions / Route Handlers internal. Dilarang keras digunakan untuk query data publik yang dapat ditangani oleh _Anon Key_ + RLS.

---

## 5. RLS Policy Template & Pengujian Otomatis (pgTAP)

Seluruh kebijakan RLS pada database Supabase wajib diuji menggunakan pengujian otomatis **pgTAP**:

### 5.1 Contoh Template Policy Terstruktur

```sql
-- RLS Policy: Hanya Admin Kestari dan Super Admin yang dapat mengelola legacy_members
CREATE POLICY "Kestari and SuperAdmin manage legacy_members"
ON public.legacy_members
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('super-admin'::public.user_role, 'admin-kestari'::public.user_role)
);
```

### 5.2 Pengujian RLS Otomatis

Sebelum rilis ke produksi, script `pgTAP` wajib mengeksekusi _negative test cases_ untuk memverifikasi pengguna dengan role `caang` atau `anggota` **ditolak secara eksplisit** saat mencoba mutasi data administratif.

---

## 6. Sertifikasi Ulang Akses Triwulanan (_Quarterly Access Recertification_)

1. Setiap 3 (tiga) bulan, Admin Kestari dan Super Admin wajib melakukan peninjauan daftar pengguna ber-role Admin.
2. Mantan pengurus yang telah demisioner **wajib di-revoke** role privilege-nya menjadi `anggota` atau `alumni` maksimal 7 hari setelah serah terima jabatan.

---

_Dokumen ini diterbitkan sebagai standar kebijakan kontrol akses resmi UKM Robotik Politeknik Negeri Padang._
