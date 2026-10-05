# Spec: Halaman Histori Piket (`/piket/riwayat`)

- **Tanggal:** 2026-10-05
- **Status:** Menunggu review
- **Modul:** Kebersihan / Piket
- **Path terkait:** `/piket/riwayat` (baru), `/piket`, `/piket/verifikasi`, `/piket/kelola`

---

## 1. Latar Belakang & Masalah

Saat ini modul piket memiliki tiga halaman:

- `/piket` — lapor piket (semua role).
- `/piket/verifikasi` — verifikasi laporan, denda, dan tabel **kepatuhan per
  petugas terjadwal** (super-admin & admin-kestari).
- `/piket/kelola` — penjadwalan & periode (super-admin & admin-kestari).

Tabel kepatuhan di `/piket/verifikasi` sudah memperlihatkan status
`sudah-lapor / alpha / berlangsung / magang`, tetapi **belum ada**:

1. **Filter waktu multi-dimensi** (pekan × bulan siklus × tahun) untuk
   menelusuri histori.
2. **Histori lengkap per anggota** — daftar seluruh laporan/kejadian piket
   seorang anggota lintas pekan/bulan, dengan status dan bukti.
3. **Pandangan gabungan** antara _matriks kepatuhan petugas terjadwal_ dan
   _log yang benar-benar di-submit_ dalam satu tempat.

Super-admin & admin-kestari perlu menjawab pertanyaan seperti: "Siapa saja yang
piket pada Pekan 2, September 2026? Siapa yang sudah lapor, siapa yang pending,
siapa yang belum?" dan "Bagaimana rekam jejak piket si A selama satu periode?"

**Dampak masalah:** penelusuran rekam jejak memerlukan pembukaan log satu per
satu; tidak ada cara cepat menyaring per pekan/bulan/tahun; tidak ada rekap
per-anggota.

---

## 2. Tujuan

1. **Histori terpadu** — satu halaman menampilkan gabungan (a) matriks
   kepatuhan petugas terjadwal dan (b) daftar log aktual, dengan status.
2. **Filter waktu** — saring per **periode DPH → tahun → bulan siklus → pekan
   (1–4)**, plus filter status dan pencarian anggota.
3. **Histori per anggota** — drawer samping berisi profil singkat + timeline
   lengkap semua log & status anggota tersebut lintas pekan/bulan.
4. **Konsisten RBAC** — hanya super-admin & admin-kestari; boundary di level
   route (guard server), bukan kondisional klien.

### Non-Tujuan

- Tidak mengubah alur lapor/verifikasi/denda yang sudah ada.
- Tidak mengubah rumus siklus pekan (ISO Senin–Minggu; pekan 1–4 per bulan
  siklus ditentukan Kamis).
- Tidak mengubah skema tabel piket yang ada (kecuali menambah RPC baca).
- Tidak menambah aksi tulis baru (halaman ini murni baca / read-only).

---

## 3. Keputusan Desain (termasuk asumsi atas pertanyaan terbuka)

> Asumsi berikut dipilih agar implementasi tidak terblokir; **mohon dikoreksi
> saat review** bila tidak sesuai.

1. **Dimensi filter waktu dihitung dari tanggal, bukan kolom tersimpan.**
   `piket_schedules` hanya menyimpan `academic_period` + `week_number`
   (template 1–4 berulang) **tanpa tanggal**. Karena itu:
   - Untuk **log**, bulan & pekan siklus dihitung dari `duty_date` memakai
     `getPiketWeekInfo()` (atau `getPiketWeeksForMonth`).
   - Untuk **baris kepatuhan "belum lapor"** (tanpa log), pekan dihitung dari
     template bulan siklus `getPiketWeeksForMonth(year, month)`.
2. **Definisi "tahun"** = **tahun kalender dari `duty_date`** (mis. log
   `2026-09-19` → tahun 2026, bulan siklus September). Bukan tahun akademik.
   Periode akademik tetap tersedia sebagai filter terpisah (`academic_period`).
3. **Definisi status log** (memakai `getPiketLogStatus` yang sudah ada):
   - **approved** = `is_verified = true && is_final = true` (disetujui/final).
   - **pending** = belum final & belum ditolak (menunggu review).
   - **rejected** = ditolak (`is_verified = false` + `rejection_reason`).
   - **auto_final** = `is_final = true` tanpa verifier (finalisasi otomatis).
4. **Definisi "belum"** = petugas **terjadwal** pada pekan itu (ada di
   `piket_members` untuk `week_number` tsb) tetapi **belum ada log valid** pada
   rentang pekan tsb (status kepatuhan `alpha` atau `berlangsung`). Anggota
   magang (`magang`) dikecualikan/ditandai terpisah.
5. **Export:** **tidak** termasuk pada iterasi pertama (YAGNI). Dapat ditambah
   kemudian mengikuti pola ekspor MRC.
6. **Rentang data:** filter default = **periode akademik terbaru**; pengguna
   dapat berpindah periode. Data lintas periode dapat dilihat dengan mengubah
   filter periode.

---

## 4. Matriks Wewenang

| Kapabilitas                            | super-admin | admin-kestari | admin-or | admin-komdis | admin-divisi | anggota | caang |
| :------------------------------------- | :---------: | :-----------: | :------: | :----------: | :----------: | :-----: | :---: |
| Lihat histori piket (`/piket/riwayat`) |     [x]     |      [x]      |   [-]    |     [-]      |     [-]      |   [-]   |  [-]  |

Peran lain → `redirect("/piket")` (guard server), selaras dengan
`/piket/verifikasi` & `/piket/kelola`.

---

## 5. Struktur Route & Navigasi

```
app/(private)/piket/
├── page.tsx              # lapor piket (semua role)
├── verifikasi/page.tsx   # verifikasi + denda + kepatuhan (admin)
├── kelola/page.tsx       # penjadwalan & periode (admin)
└── riwayat/page.tsx      # BARU — histori piket (admin)
```

- `/piket/riwayat` — RSC; RBAC guard: role ∉ {`super-admin`,`admin-kestari`} →
  `redirect("/piket")`. Read-only.
- **Sidebar** (`components/shared/sidebar.tsx`): tambah entri
  `piketRiwayat` → `/piket/riwayat`, ikon `History`, `kestariOnly: true`,
  ditempatkan di modul `kebersihan` (setelah `piketVerifikasi`). Tambahkan ke
  `roleMenuKeys` untuk `admin-kestari` & `super-admin`, dan ke
  `menuOrderWithinModule.kebersihan`.

---

## 6. Arsitektur & Aliran Data

**Pendekatan:** server-side aggregation via **RPC `SECURITY DEFINER`** baru
(konsisten dengan `get_piket_roster` & `get_piket_person_names` yang sudah
dipakai untuk menembus RLS `profiles`), lalu komponen klien menangani filter
ringan + drawer.

### 6.1 RPC baru: `get_piket_history(...)`

```
get_piket_history(
  p_academic_period text,
  p_year int,          -- nullable: null = semua
  p_month int,         -- nullable (0..11); null = semua
  p_week int           -- nullable (1..4); null = semua
)
RETURNS TABLE (
  -- identitas baris
  entry_type text,          -- 'scheduled' | 'log'
  schedule_id uuid,
  week_number int,
  room_target text,
  academic_period text,
  -- waktu
  duty_date date,           -- null untuk 'scheduled' yang belum lapor
  cycle_year int,
  cycle_month int,          -- 0..11
  -- anggota
  profile_id uuid,
  full_name text,
  nim text,
  is_on_internship boolean,
  -- status
  compliance_status text,   -- 'sudah-lapor' | 'alpha' | 'berlangsung' | 'magang'
  log_status text,          -- 'approved' | 'pending' | 'rejected' | 'auto_final' | null
  log_id uuid,              -- null bila 'scheduled' tanpa log
  is_verified boolean,
  is_final boolean,
  rejection_reason text,
  proof_image_url text,
  proof_image_before_url text,
  notes text,
  verified_by_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
```

- `SECURITY DEFINER` agar dapat membaca `profiles` lintas-role (pelapor
  super-admin/admin-\* yang tidak terbaca kestari via RLS).
- Filter `p_year/p_month/p_week` dihitung dari `duty_date` (log) & template
  bulan siklus (scheduled). Bila `NULL` → tidak memfilter pada dimensi itu.
- `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated, service_role;`.

> **Catatan implementasi:** jika RPC satu-besar ini terlalu rumit untuk
> dihitung di SQL (perhitungan pekan siklus kompleks), alternatifnya: RPC
> mengembalikan **baris mentah** (roster + log + resolusi nama) untuk satu
> periode, dan **filter pekan/bulan/tahun dihitung di server TS** memakai
> `getPiketWeeksForMonth`. Keputusan final di plan implementasi.

### 6.2 Data-layer

- `lib/repositories/piket.ts`:
  - `getPiketHistory(params)` — memanggil RPC gabungan, memetakan ke tipe
    domain `PiketHistoryEntry` (dipakai untuk **tab Kepatuhan & tab Log**).
  - `getPiketMemberHistory(profileId)` — memanggil RPC/ server action khusus
    riwayat satu anggota **lintas semua periode** (dipakai **lazy** oleh
    drawer). Mengembalikan `PiketMemberHistoryEntry[]`.
- Tipe baru `PiketHistoryEntry`, `PiketMemberHistoryEntry` di
  `lib/repositories/piket.ts` / `components/features/piket/types.ts`.
- `types/database.types.ts`: regenerate via `pnpm gen:types` setelah migration
  di-push, atau tambahkan manual sementara.

### 6.3 Server Actions (baca, untuk drawer lazy)

- `lib/actions/piket.ts`: tambah `getPiketMemberHistoryAction(profileId)` —
  guard `requireKestariManager`, memanggil `getPiketMemberHistory`, mengembalikan
  `{ success, data }` (pola `ActionResult`). Read-only (tidak menulis).

### 6.4 Aliran data

```
RSC /piket/riwayat
  ├── guard getUser() + profiles.role ∈ {super-admin, admin-kestari}
  ├── ambil daftar availablePeriods (dari piket_schedules)
  ├── baca searchParams: ?period=&year=&month=&week=&status=&q=&tab=
  ├── getPiketHistory({period, year, month, week})
  └── render <PiketHistoryClient entries=... ... />
        ├── filter bar (periode/tahun/bulan/pekan/status/pencarian)
        │     → memperbarui searchParams (router.replace) → RSC refetch
        ├── Tabs: "Kepatuhan" | "Log"
        │     ├── Kepatuhan: baris petugas × bulan × pekan (kolom ala verifikasi)
        │     └── Log: baris log aktual (kolom ala verifikasi)
        └── klik anggota → <PiketHistoryMemberDrawer profileId=... /> (open)
              └── getPiketMemberHistoryAction(profileId)  — LAZY, semua periode
```

- **Filter berat (waktu) lewat URL searchParams → server** (agar data ter-scope
  di DB). **Filter ringan (teks/pencarian nama di hasil)** boleh client-side.
- **Drawer** memuat histori anggota **saat dibuka** (lazy) via server action,
  mencakup **semua periode akademik**.

---

## 7. Komponen UI

- `components/features/piket/piket-history-client.tsx` (baru) — filter bar +
  **Tabs** (Kepatuhan | Log) + ringkasan (count per status).
- `components/features/piket/piket-history-member-drawer.tsx` (baru) — drawer
  histori per anggota (timeline log + status + bukti foto + catatan),
  **lazy fetch semua periode**.
- `components/features/piket/piket-status-badge.tsx` (existing) — dipakai ulang
  untuk badge status log.
- `PiketComplianceBadge` (existing, di dalam verification client) — ekstrak ke
  komponen bersama bila perlu dipakai ulang untuk status kepatuhan.
- Mematuhi `DESIGN.md`: token warna semantik, `min-h-[44px]` untuk target
  sentuh, `cn()` dari `@/lib/utils`, `next/image` untuk pratinjau foto.

---

## 8. Penanganan Error & Edge Case

- **Tidak ada data** → empty state jelas per filter.
- **Anggota magang** pada pekan tsb → status `magang`, bukan `alpha`.
- **Log ditolak** → tampil alasan penolakan + tautan ke verifikasi.
- **Pekan belum berakhir** → status `berlangsung` (bukan `alpha`).
- **Beberapa log per anggota per pekan** (upload ulang) → tampilkan semua;
  status kepatuhan = `sudah-lapor` bila ada ≥1 log valid (bukan ditolak).
- **Kegagalan RPC** → pesan ramah + tombol muat ulang (pola `complianceError`
  di verifikasi).

---

## 9. Testing

- **Unit** `lib/repositories/piket.ts`: pemetaan RPC → tipe domain;
  filter pekan/bulan/tahun (bila dihitung di TS) via `getPiketWeeksForMonth`.
- **Unit** `lib/actions/piket.ts`: `getPiketMemberHistoryAction` guard role +
  pemetaan hasil.
- **Unit/RSC** `app/(private)/piket/riwayat/page.test.tsx`: guard RBAC
  (redirect role non-berhak; lolos untuk super-admin/admin-kestari) — meniru
  pola `verifikasi/page.test.tsx`.
- **Komponen** `piket-history-client.test.tsx`: render baris tab Kepatuhan &
  Log + status benar; perpindahan tab; filter mengubah hasil.
- **DB** (opsional): verifikasi RPC `get_piket_history` &
  `get_piket_member_history` di DB lokal dalam `BEGIN...ROLLBACK` untuk
  beberapa kombinasi filter.

Target: tanpa regresi pada `npm run typecheck`, `npm run lint`, `npm run test`.

---

## 10. Keputusan Terkonfirmasi (review 2026-10-05)

1. **"Tahun"** = tahun **kalender** dari `duty_date`. Periode akademik tetap
   filter terpisah. ✅
2. **Status log** (§3.3) approved/pending/rejected/auto_final. ✅
3. **"Belum"** = petugas terjadwal tanpa log valid (alpha/berlangsung). ✅
4. **Export CSV** ditunda ke iterasi berikutnya. ✅
5. **Default rentang** = periode akademik terbaru. ✅

### Keputusan tambahan

6. **Tabel utama = dua tab**: (a) **Kepatuhan** (baris = petugas × bulan siklus
   × pekan — meniru tabel kepatuhan `/piket/verifikasi`; kolom: Anggota, NIM,
   Bulan, Pekan, Ruang, Rentang, Status) dan (b) **Log** (baris = log aktual;
   kolom mengikuti tabel log `/piket/verifikasi`: Tanggal Tugas, Petugas,
   Pekan, Bulan, Status, Bukti, Catatan, Verifikator).
7. **Drawer histori anggota = lazy fetch** (server action/RPC terpisah) saat
   drawer dibuka, untuk menghindari membebani muatan awal.
8. **Cakupan drawer = SEMUA periode akademik** (riwayat lengkap anggota),
   tidak terbatas pada filter halaman.
9. **Pekan belum berakhir** → tetap tampil dengan status `berlangsung`.

---

## Lihat juga

- `docs/superpowers/specs/2026-09-28-piket-route-split-design.md` (pemisahan
  route piket sebelumnya)
- `AGENTS.md` §4 (peta arsitektur), §5.4 (logika piket), §7 (aturan stack)
- Memori: `robotik-pnp-bugfix-piket-roster-rls-members` (RLS `profiles` & RPC)
