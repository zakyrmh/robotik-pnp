# Spec: Pemisahan Halaman Piket, Isolasi RBAC, & Laporan Kepatuhan Piket

- **Tanggal:** 2026-09-28
- **Status:** Menunggu review
- **Modul:** Kebersihan / Piket
- **Path terkait:** `/piket`, `/piket/verifikasi` (baru), `/piket/kelola`

---

## 1. Latar Belakang & Masalah

Saat ini modul piket memiliki satu halaman utama `/piket` yang mencampur tiga
tanggung jawab berbeda dalam satu komponen klien berukuran besar
(`components/features/piket/piket-client.tsx`, 1885 baris):

1. **Lapor piket** — diwajibkan untuk semua role (anggota, admin, dst.).
2. **Verifikasi laporan** — hanya untuk super-admin & admin-kestari.
3. **Kelola denda** — hanya untuk super-admin & admin-kestari.

Pemisahan sudah sebagian ada: `/piket/kelola` (penjadwalan periode) sudah
merupakan halaman terpisah dengan RBAC guard. Namun verifikasi & denda masih
berada di `/piket` dan hanya dipisahkan oleh kondisional `isKestariAdmin` di
sisi klien.

**Dampak masalah:**

- **UX kotor.** Anggota biasa dikirim data & elemen antarmuka administratif
  yang tidak relevan bagi mereka.
- **Boundary RBAC dangkal.** Batas keamanan bergantung pada `if` di client,
  bukan pada pemisahan route. Halaman `/piket` tetap menjalankan query
  administratif (mis. `piket_fines`, `finalizeExpiredPiketReviews()`) untuk
  semua pengguna.
- **Tidak ada visibilitas pelanggaran.** Super-admin hanya dapat melihat siapa
  yang **sudah** melapor. Tidak ada cara melihat siapa yang **belum** melapor
  dari awal periode.
- **Dokumentasi RBAC salah.** `AGENTS.md` dan `docs/04-process-view/workflow-documentation.md`
  mencantumkan `admin-komdis` berwenang pada `WF-PIK-03`, padahal kode server
  sudah membatasinya ke `super-admin` + `admin-kestari`.

---

## 2. Tujuan

1. **Bersihkan UX** — anggota hanya melihat antarmuka lapor piket; fitur admin
   terisolasi di halaman tersendiri.
2. **Amankan RBAC** — boundary nyata di level route + server action, bukan
   sekadar kondisional client.
3. **Visibilitas kepatuhan** — super-admin & admin-kestari dapat melihat riwayat
   siapa yang belum melapor piket dari awal periode, dengan anggota magang
   dikecualikan.
4. **Koreksi dokumentasi** — selaraskan dokumentasi RBAC dengan perilaku server.

### Non-Tujuan

- Tidak mengubah rumus perhitungan denda (tetap Rp10.000 default).
- Tidak mengubah mekanisme upload bukti foto ke R2 / kompresi gambar.
- Tidak mengubah aturan siklus pekan (tetap ISO Senin–Minggu, pekan 1–4 per
  bulan siklus, ditentukan hari Kamis).
- Tidak menambah jenis denda baru atau alur pembayaran baru.

---

## 3. Matriks Wewenang (Target)

| Kapabilitas                           | super-admin | admin-kestari | admin-or | admin-komdis | admin-divisi | anggota | caang |
| :------------------------------------ | :---------: | :-----------: | :------: | :----------: | :----------: | :-----: | :---: |
| Lapor piket                           |     [x]     |      [x]      |   [x]    |     [x]      |     [x]      |   [x]   |  [-]  |
| Lihat status piket pribadi            |     [x]     |      [x]      |   [x]    |     [x]      |     [x]      |   [x]   |  [-]  |
| Verifikasi laporan & kelola denda     |     [x]     |      [x]      |   [-]    |     [-]      |     [-]      |   [-]   |  [-]  |
| Kelola penjadwalan & periode          |     [x]     |      [x]      |   [-]    |     [-]      |     [-]      |   [-]   |  [-]  |
| Lihat laporan kepatuhan (belum piket) |     [x]     |      [x]      |   [-]    |     [-]      |     [-]      |   [-]   |  [-]  |

Catatan: kode server saat ini (`KESTARI_MANAGERS = ["super-admin", "admin-kestari"]`)
sudah selaras untuk verifikasi/denda/penjadwalan. Perubahan utama adalah
mengisolasi UI & data ke route terpisah, serta menambah `admin-divisi` sebagai
pelapor.

---

## 4. Struktur Route

```
app/(private)/piket/
├── page.tsx                  # LAPOR PIKET — semua role pelapor
├── verifikasi/
│   └── page.tsx              # BARU — verifikasi + denda + kepatuhan (admin)
└── kelola/
    └── page.tsx              # EXISTING — penjadwalan & periode (admin)
```

- `/piket` — RSC Server Component; hanya memuat data milik pengguna (status
  pribadi, jadwal pekanan, riwayat pribadi). Tidak memanggil query administratif.
- `/piket/verifikasi` — RSC Server Component; RBAC guard: role bukan
  `super-admin`/`admin-kestari` → `redirect("/piket")`. Menjalankan
  `finalizeExpiredPiketReviews()` dan memuat data administratif.
- `/piket/kelola` — tidak berubah selain penambahan tautan silang bila perlu.

### Pemisahan Tanggung Jawab Data

| Halaman             | Query                                                                                                                         | Server action                                                                                            |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `/piket`            | profil user; `piket_schedules` + `piket_members`; assignments milik user; `piket_logs` **milik user**                         | `submitPiketReport`                                                                                      |
| `/piket/verifikasi` | profil admin; semua `piket_logs` (+ reporter/verifier); `piket_fines`; `piket_schedules` + `piket_members`; laporan kepatuhan | `reviewPiketLog`, `imposePiketFine`, `markPiketFinePaid`, `voidPiketFine`, `finalizeExpiredPiketReviews` |
| `/piket/kelola`     | (existing) schedules + candidates                                                                                             | `createPiketPeriod`, `assignPiketMember`, `removePiketMember`                                            |

---

## 5. Navigasi Sidebar

`components/shared/sidebar.tsx`:

1. Tambah field visibilitas baru **`kestariOnly`** pada katalog
   `allMenuItems` (visibel bila role `super-admin` atau `admin-kestari`).
   Alasan memilih field khusus (bukan `adminOnly`, yang berarti hanya
   super-admin) adalah agar aturan tampil bersifat eksplisit & terdokumentasi
   sendiri.
2. Modul `kebersihan` menampung tiga entri:
   - `piket` → `/piket`, visibel untuk semua pelapor.
   - `piketVerifikasi` → `/piket/verifikasi`, `kestariOnly: true`.
   - `piketKelola` → `/piket/kelola`, `kestariOnly: true`.
3. `menuOrderWithinModule.kebersihan` diurutkan: `piket`, `piketVerifikasi`,
   `piketKelola`.
4. `roleMenuKeys`: tambah `piketVerifikasi` & `piketKelola` untuk `super-admin`
   dan `admin-kestari`; tambahkan `piket` untuk `admin-divisi`; pertahankan
   `piket` untuk `anggota`, `admin-or`, `admin-komdis`. (Terapkan pula filter
   `kestariOnly` pada `resolveVisibleKeys` agar pertahanan berlapis.)

---

## 6. Pemecahan Komponen

Komponen `piket-client.tsx` (1885 baris) dipecah menjadi:

| File                             | Tanggung jawab                                                                    | Dipakai oleh          |
| :------------------------------- | :-------------------------------------------------------------------------------- | :-------------------- |
| `piket-report-client.tsx`        | Lapor piket, kartu status pribadi, jadwal pekanan, riwayat pribadi                | `/piket`              |
| `piket-verification-client.tsx`  | Verifikasi (approve/reject), kelola denda, tabel semua laporan, tab Kepatuhan     | `/piket/verifikasi`   |
| `piket-photo-preview-dialog.tsx` | Modal preview foto before/after (shared)                                          | report & verification |
| `piket-status-badge.tsx`         | Badge status (pending/verified/rejected/final/Alpha/Berlangsung/Magang)           | report & verification |
| `types.ts`                       | Interface bersama: `PiketLog`, `PiketFine`, `PiketSchedule`, `PiketComplianceRow` | semua                 |
| `lib/utils/piket-format.ts`      | Mapper data (format log/fine/schedule) dari baris DB                              | page RSC              |

- `piket-client.tsx` **dihapus** setelah migrasi selesai.
- `kelola-piket-client.tsx` hanya ditambah tautan silang ke `/piket/verifikasi`
  bila relevan; tidak direfaktor ulang.

**Prinsip isolasi:** setiap komponen klien menerima hanya data yang
dibutuhkannya melalui props. `/piket` tidak pernah menerima props berisi
`fines` atau laporan anggota lain.

---

## 7. Fitur Baru — Laporan Kepatuhan Piket

### 7.1 Definisi Status

Untuk setiap penugasan (`piket_members`) pada sebuah pekan (`piket_schedules`),
status dihitung sebagai berikut:

| Status          | Kondisi                                                                                                      |
| :-------------- | :----------------------------------------------------------------------------------------------------------- |
| **Sudah Lapor** | Terdapat `piket_logs` untuk `schedule_id` & pelapor tersebut.                                                |
| **Magang**      | `isMemberOnInternship(profile, week.startIsoDate)` benar — dikecualikan dari pelanggaran.                    |
| **Alpha**       | Tidak ada log & bukan magang, dan pekan sudah **berakhir** (`week.endIsoDate < hari ini`).                   |
| **Berlangsung** | Tidak ada log & bukan magang, dan pekan masih berjalan (`week.startIsoDate <= hari ini <= week.endIsoDate`). |

**Aturan agregat:**

- Daftar "Belum Piket" (per orang, dari awal periode) = anggota yang **tidak
  memiliki satupun** status "Sudah Lapor" pada seluruh pekan periode tersebut.
- "Belum melapor" menampilkan kedua status dengan label jelas: **Alpha**
  (pelanggaran, pekan berakhir) dan **Berlangsung** (belum final, pekan
  berjalan). Hanya status Alpha yang dihitung sebagai pelanggaran.

### 7.2 Rekonstruksi Rentang Tanggal Pekan (Risiko Utama)

`piket_schedules` **tidak menyimpan kolom tanggal** — hanya `academic_period`,
`week_number` (1–4), dan `room_target`. Untuk mengevaluasi keanggotaan magang
pada pekan lampau, rentang tanggal pekan harus direkonstruksi dari aturan:

> Pekan 1 bulan siklus adalah pekan (Senin–Minggu) yang memuat hari Kamis
> pertama bulan tersebut. Siklus ditentukan oleh hari Kamis pekan itu.

Ditambahkan helper baru di `lib/utils/piket-date.ts`:

```ts
export function getPiketWeekInfoForPeriod(
  academicPeriod: string, // contoh "2026/2027"
  weekNumber: number, // 1..4
): Pick<PiketWeekInfo, "startIsoDate" | "endIsoDate" | "weekNumber">;
```

- `academic_period` berformat `"YYYY/YYYY"`. Bulan siklus yang relevan
  ditentukan dari periode akademik sesuai konvensi yang berlaku pada data
  existing (bulan-bulan semester berjalan). Implementasi harus memverifikasi
  konvensi ini terhadap data `piket_schedules` yang ada sebelum finalisasi,
  dan didokumentasikan dalam kode.
- Helper ini men-generalisasi `getPiketWeekInfo` (yang hanya menangani tanggal
  berjalan) tanpa mengubah perilakunya.

### 7.3 Sumber Data & Repository

Fungsi baru (repositori baru `lib/repositories/piket.ts`, mengikuti pola
`lib/repositories/`):

```ts
export interface PiketComplianceRow {
  profileId: string;
  memberName: string;
  nim: string | null;
  academicPeriod: string;
  weekNumber: number;
  roomTarget: string;
  startIsoDate: string;
  endIsoDate: string;
  status: "sudah-lapor" | "alpha" | "berlangsung" | "magang";
}

export async function getPiketComplianceReport(
  academicPeriod: string,
): Promise<PiketComplianceRow[]>;
```

- Mengambil `piket_schedules` (+`piket_members` + profil: `is_on_internship`,
  `internship_start_date`, `internship_end_date`) untuk periode terpilih, dan
  `piket_logs` yang valid per `schedule_id`.
- Pemanggilan pertama dilakukan di RSC `/piket/verifikasi` untuk periode
  default (periode terbaru). Pergantian periode dilakukan lewat server action
  ringan `getPiketComplianceAction(period)` yang memvalidasi payload dengan Zod
  dan memeriksa RBAC.

### 7.4 UI

Tab **"Kepatuhan"** pada `piket-verification-client.tsx`:

- Pemilih periode (dropdown, sama sumbernya dengan `availablePeriods`).
- Ringkasan: jumlah Alpha, jumlah Berlangsung, jumlah Magang, jumlah Sudah Lapor.
- Tabel: Anggota (nama + NIM), Pekan, Ruang, Rentang Tanggal, Status (badge).
- Filter cepat: Semua / Belum Lapor (Alpha + Berlangsung) / Magang.
- Ekspor opsional ditunda (YAGNI) kecuali diminta.

---

## 8. Koreksi RBAC & Dokumentasi

1. `AGENTS.md` baris tabel `WF-PIK-03` (`Verify Shift & Impose Fine`): kolom
   `admin-komdis` diubah dari `[x]` menjadi `[-]`.
2. `docs/04-process-view/workflow-documentation.md` baris `WF-PIK-03`:
   samakan agar `admin-komdis = [-]`.
3. `components/shared/sidebar.tsx`: terapkan matriks pada §3 (tambah
   `admin-divisi` sebagai pelapor; `piket` tetap untuk `admin-or` &
   `admin-komdis`).
4. Verifikasi ulang bahwa server action (`lib/actions/piket.ts`) tetap memakai
   `KESTARI_MANAGERS = ["super-admin", "admin-kestari"]` — tidak ada perubahan
   logika server yang diperlukan selain jika ditemukan kebocoran.

---

## 9. Alur Data

```
[Anggota]  /piket (RSC)
   ├─ profil user
   ├─ schedules + members (untuk jadwal pekanan)
   ├─ assignments milik user
   └─ logs milik user
        └─> <PiketReportClient>  ──submitPiketReport──> R2 + DB

[Admin]    /piket/verifikasi (RSC, guard kestariOnly)
   ├─ finalizeExpiredPiketReviews()
   ├─ semua logs + reporter/verifier
   ├─ fines
   ├─ schedules + members
   └─ getPiketComplianceReport(period)
        └─> <PiketVerificationClient>
              ├─ reviewPiketLog
              ├─ imposePiketFine / markPiketFinePaid / voidPiketFine
              └─ getPiketComplianceAction (ganti periode)
```

---

## 10. Penanganan Error

- RBAC gagal di RSC → `redirect("/piket")` (tanpa membocorkan data).
- Server action gagal → objek `ActionResult` terstruktur (mengikuti standar
  `AGENTS.md`), ditampilkan via toast (`sonner`).
- Query DB gagal → `console.error` dengan prefix `[PIKET_*_ERROR]` (mengikuti
  pola yang ada) + UI fallback kosong dengan pesan yang dapat dipahami.
- `getPiketComplianceReport` pada periode tanpa jadwal → kembalikan array
  kosong dengan UI "Belum ada jadwal pada periode ini", bukan error.

---

## 11. Strategi Testing (Vitest + RTL, coverage ≥70%)

1. **Unit — `getPiketWeekInfoForPeriod`:** pekan 1–4 untuk beberapa periode;
   konsistensi dengan `getPiketWeekInfo` pada tanggal yang sama.
2. **Unit — klasifikasi kepatuhan:** empat status (sudah-lapor, alpha,
   berlangsung, magang) dengan fixture tanggal terkontrol.
3. **Unit — magang per pekan:** anggota `is_on_internship` dengan rentang
   tanggal yang mencakup pekan tertentu dikecualikan; di luar rentang tetap
   dihitung alpha. Mencakup skenario "magang pada minggu yang sama tiap bulan".
4. **Property-based (fast-check):** invariant kombinasi
   (punya-log/tidak) × (magang/tidak) × (pekan-lampau/berjalan) — status selalu
   salah satu dari empat, dan "berlangsung" tidak pernah dihitung pelanggaran.
5. **RBAC guard:** render `/piket/verifikasi` sebagai `anggota`, `admin-or`,
   `admin-komdis`, `admin-divisi` → redirect; sebagai `super-admin` &
   `admin-kestari` → tampil.
6. **Regresi:** `lib/actions/piket.test.ts` yang ada tetap hijau.
7. **UI:** `PiketReportClient` tidak menerima props `fines`/`logs` anggota lain.

---

## 12. Dampak & Migrasi

- Hapus `components/features/piket/piket-client.tsx` (setelah konten dipindah).
- Tautan lama ke `/piket` tetap valid (tidak ada perubahan URL untuk lapor).
- Pengguna admin yang biasa membuka `/piket` untuk verifikasi akan diarahkan
  ke menu baru; tambahkan tautan di header `/piket` agar transisi mulus.
- Tidak ada migrasi database baru yang diperlukan (skema existing memadai);
  hanya penambahan helper & query.

---

## 13. Pertanyaan Terbuka & Asumsi

- **Asumsi A1:** `academic_period` berformat `"YYYY/YYYY"` dan bulan siklus
  diturunkan darinya. **Tindakan:** verifikasi terhadap data existing saat
  implementasi; bila konvensi berbeda, dokumentasikan dalam kode.
- **Asumsi A2:** Siklus pekan mengikuti `getPiketWeekInfo` existing (Kamis
  penentu bulan siklus). Tidak ada perubahan aturan.

---

## 14. Kriteria Sukses

1. Anggota hanya dapat mengakses `/piket`; akses langsung ke
   `/piket/verifikasi` & `/piket/kelola` diarahkan kembali oleh guard server.
2. `/piket` tidak lagi menjalankan query administratif maupun
   `finalizeExpiredPiketReviews()` untuk non-admin.
3. Super-admin & admin-kestari dapat melihat laporan kepatuhan dengan status
   Alpha/Berlangsung/Magang yang benar dan akurat terhadap status magang.
4. Dokumentasi RBAC (`AGENTS.md`, workflow-documentation) selaras dengan kode.
5. Seluruh test hijau; coverage ≥70%.
