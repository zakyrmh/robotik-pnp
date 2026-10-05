# Halaman Histori Piket (`/piket/riwayat`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambah halaman read-only `/piket/riwayat` untuk super-admin & admin-kestari yang menampilkan histori piket dalam **dua tab** (Kepatuhan & Log), dapat difilter per periode DPH × tahun kalender × bulan siklus × pekan, plus drawer histori lengkap per anggota (lazy, semua periode).

**Architecture:** Halaman RSC (`app/(private)/piket/riwayat/page.tsx`) dengan guard RBAC server-side, memuat data via repository (`lib/repositories/piket.ts`) yang memakai RPC `SECURITY DEFINER` untuk menembus RLS `profiles` (pola `get_piket_roster`/`get_piket_person_names` yang sudah ada). Komponen klien menangani filter (URL `searchParams` → server refetch), dua tab, dan drawer anggota yang memuat data **lazy** lewat Server Action read-only.

**Tech Stack:** Next.js 16 (App Router, RSC, async `searchParams`), React 19, Supabase (PostgreSQL + RLS + RPC), TypeScript strict, Tailwind CSS v4, shadcn/ui, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-piket-history-design.md`

## Global Constraints

- **No `src/` directory.** App Router di `app/`, tanpa folder `src/`.
- **Runtime:** Next.js `16.2.5`, React `19.2.4`. `await params`/`await searchParams` (Next 16). **DILARANG `forwardRef`** — pass `ref` sebagai prop biasa.
- **RSC default.** `page.tsx` tetap React Server Component; **DILARANG** `"use client"` di `page.tsx`. Interaktivitas di komponen klien leaf.
- **Supabase SSR:** server pakai `@/lib/supabase/server` (`createClient`), client pakai `@/lib/supabase/client`. **WAJIB** `supabase.auth.getUser()`, **DILARANG** `getSession()` di server.
- **Server Actions** untuk mutasi/aksi; halaman ini **read-only** (tidak ada INSERT/UPDATE/DELETE).
- **Zod** untuk validasi input tiap Server Action (`lib/schemas/*`) sebelum query.
- **RBAC:** hanya `super-admin` & `admin-kestari` (`KESTARI_MANAGERS`); role lain `redirect("/piket")`.
- **Jangan** longgarkan RLS `profiles`; gunakan RPC `SECURITY DEFINER` berproyeksi kolom minimal.
- **Tailwind v4:** token via `@theme` di `app/globals.css`; **DILARANG** `tailwind.config.js`. Selalu `cn()` dari `@/lib/utils`. Target sentuh min `min-h-[44px]`. Gambar via `next/image`.
- **DILARANG** tipe `any`; bentuk objek hasil RPC di-`cast` eksplisit dengan interface.
- **Naming file/commit:** Conventional Commits. Setiap task diakhiri commit.
- **Tes:** Vitest (`npm run test`), RTL, jsdom. Coverage gate $\ge 70\%$.

## Review Focus

The five input classes / failure modes the spec implies that are most likely to bite — each gets a test on the owning task:

1. **Peran non-berhak (anggota/admin-divisi/admin-or/admin-komdis)** membuka `/piket/riwayat` → harus `redirect("/piket")`, bukan render data admin. (Task 5)
2. **Pekan belum berakhir** → baris tetap tampil dengan status `berlangsung`, BUKAN `alpha`. (Task 2, pin via filter test)
3. **Anggota magang pada pekan tsb** → status `magang` (dikecualikan dari alpha). (Task 2, pin via filter test)
4. **Log ditolak** (upload ulang ada) → anggota tetap `sudah-lapor` bila ada ≥1 log valid; tapi log ditolak tampil di tab Log dengan `rejected` + alasan. (Task 3 & 4)
5. **RPC gagal / data kosong** untuk filter terpilih → empty state ramah + tidak crash (bukan layar putih). (Task 5 & 7)

---

## File Structure

**Baru:**

- `supabase/migrations/20261005020000_add_piket_history_functions.sql` — RPC `get_piket_history_logs` & `get_piket_member_history` (SECURITY DEFINER).
- `app/(private)/piket/riwayat/page.tsx` — RSC halaman histori + guard RBAC.
- `app/(private)/piket/riwayat/page.test.tsx` — tes guard RBAC.
- `components/features/piket/piket-history-client.tsx` — filter bar + 2 tab + ringkasan.
- `components/features/piket/piket-history-client.test.tsx` — tes komponen.
- `components/features/piket/piket-history-member-drawer.tsx` — drawer histori anggota (lazy).

**Diubah:**

- `lib/repositories/piket.ts` — tambah `getPiketHistoryLogs()`, `getPiketHistoryCompliance()`, `getPiketMemberHistory()` + tipe domain.
- `lib/actions/piket.ts` — tambah `getPiketMemberHistoryAction` (read-only, lazy untuk drawer).
- `lib/schemas/piket.ts` (baru bila belum ada) — skema Zod untuk parameter filter histori & `profileId`.
- `components/features/piket/types.ts` — jadikan `PiketLogStatus` sebagai re-export dari repo (Task 2) + tipe klien.
- `components/shared/sidebar.tsx` — menu `piketRiwayat` (`kestariOnly`) + `roleMenuKeys` + `menuOrderWithinModule`.
- `types/database.types.ts` — entri RPC baru (sementara; final via `pnpm gen:types`).

**Reuse (tidak diubah):**

- `lib/repositories/piket.ts::getPiketComplianceReport` + `buildComplianceRows` (untuk tab Kepatuhan).
- `getPiketLogStatus` (`components/features/piket/types.ts`).
- `getPiketWeekInfo`/`getPiketWeeksForMonth` (`lib/utils/piket-date.ts`).
- `PiketLogStatusBadge` (`components/features/piket/piket-status-badge.tsx`).

---

### Task 1: RPC `get_piket_history_logs` (migration)

**Files:**

- Create: `supabase/migrations/20261005020000_add_piket_history_functions.sql`
- Test: verifikasi manual DB (psql) — tidak ada unit test TS untuk SQL.

**Interfaces:**

- Consumes: tabel `piket_logs`, `piket_schedules`, `profiles`, `registrations`.
- Produces: fungsi `public.get_piket_history_logs(p_academic_period text DEFAULT NULL) RETURNS TABLE(...)` — kolom: `id uuid, schedule_id uuid, academic_period text, week_number integer, room_target text, duty_date date, reported_by uuid, reporter_name text, reporter_nim text, is_verified boolean, is_final boolean, rejection_reason text, verified_at timestamptz, verified_by uuid, verifier_name text, notes text, proof_image_url text, proof_image_before_url text, created_at timestamptz`.

- [ ] **Step 1: Tulis migration**

Buat file `supabase/migrations/20261005020000_add_piket_history_functions.sql`:

```sql
-- Migration: RPC histori piket (read-only) untuk halaman /piket/riwayat
-- SECURITY DEFINER agar admin-kestari dapat membaca nama pengurus
-- (super-admin/admin-*) yang diblokir RLS `profiles`.

DROP FUNCTION IF EXISTS public.get_piket_history_logs(text);

CREATE OR REPLACE FUNCTION public.get_piket_history_logs(p_academic_period text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  schedule_id uuid,
  academic_period text,
  week_number integer,
  room_target text,
  duty_date date,
  reported_by uuid,
  reporter_name text,
  reporter_nim text,
  is_verified boolean,
  is_final boolean,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid,
  verifier_name text,
  notes text,
  proof_image_url text,
  proof_image_before_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.schedule_id,
    s.academic_period,
    s.week_number,
    s.room_target,
    l.duty_date,
    l.reported_by,
    COALESCE(p.full_name, (SELECT r.full_name FROM public.registrations r
        WHERE r.profile_id = p.id AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC NULLS LAST LIMIT 1)) AS reporter_name,
    p.nim AS reporter_nim,
    l.is_verified,
    l.is_final,
    l.rejection_reason,
    l.verified_at,
    l.verified_by,
    COALESCE(vp.full_name, (SELECT r2.full_name FROM public.registrations r2
        WHERE r2.profile_id = vp.id AND r2.deleted_at IS NULL
        ORDER BY r2.created_at DESC NULLS LAST LIMIT 1)) AS verifier_name,
    l.notes,
    l.proof_image_url,
    l.proof_image_before_url,
    l.created_at
  FROM public.piket_logs l
  LEFT JOIN public.piket_schedules s ON s.id = l.schedule_id
  LEFT JOIN public.profiles p ON p.id = l.reported_by
  LEFT JOIN public.profiles vp ON vp.id = l.verified_by
  WHERE p_academic_period IS NULL OR s.academic_period = p_academic_period
  ORDER BY l.duty_date DESC, l.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_piket_history_logs(text) IS
  'Histori log piket (SECURITY DEFINER). Hanya proyeksi kolom yang dibutuhkan halaman /piket/riwayat; menembus RLS profiles untuk nama pengurus.';

REVOKE ALL ON FUNCTION public.get_piket_history_logs(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_history_logs(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_history_logs(text) TO service_role;
```

- [ ] **Step 2: Terapkan ke DB lokal & verifikasi**

Run:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/20261005020000_add_piket_history_functions.sql
```

Expected: `DROP FUNCTION` / `CREATE FUNCTION` / `COMMENT` / `REVOKE` / `GRANT` tanpa error.

- [ ] **Step 3: Verifikasi fungsional sebagai admin-kestari**

Run:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT count(*) FROM public.get_piket_history_logs();"
```

Expected: mengembalikan jumlah log (≥ 4), **tanpa error**. Pastikan `reporter_name` terisi untuk pelapor super-admin/admin-\* (bandingkan dengan RLS: `SET ROLE authenticated` + claims kestari sebelumnya menghasilkan null).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261005020000_add_piket_history_functions.sql
git commit -m "feat(piket): RPC get_piket_history_logs untuk halaman riwayat"
```

---

### Task 2: Repository — `getPiketHistoryLogs` & `getPiketHistoryCompliance` + filter

**Files:**

- Modify: `lib/repositories/piket.ts`
- Test: `lib/repositories/piket.test.ts` (tambah describe baru)

**Interfaces:**

- Consumes: RPC `get_piket_history_logs` (Task 1); `getPiketComplianceReport()`, `buildComplianceRows`, `PiketComplianceRow` (existing).
- Produces:
  - `export interface PiketHistoryLog { id: string; scheduleId: string | null; academicPeriod: string; weekNumber: number; roomTarget: string; dutyDate: string; reportedById: string | null; reporterName: string; reporterNim: string | null; status: PiketLogStatus; rejectionReason: string; verifiedAt: string; verifierName: string; notes: string; proofImageUrl: string; proofImageBeforeUrl: string; createdAt: string; }`
  - `export interface PiketHistoryFilter { academicPeriod: string; year?: number | null; monthIndex0?: number | null; weekNumber?: number | null; }`
  - `export function filterPiketLogs(logs: PiketHistoryLog[], f: PiketHistoryFilter): PiketHistoryLog[]` (murni)
  - `export function filterComplianceRows(rows: PiketComplianceRow[], f: PiketHistoryFilter): PiketComplianceRow[]` (murni)
  - `export async function getPiketHistoryLogs(academicPeriod: string | null): Promise<PiketHistoryLog[]>`
  - `export async function getPiketHistoryCompliance(academicPeriod: string): Promise<PiketComplianceRow[]>` (delegasi ke `getPiketComplianceReport`)

- [ ] **Step 1: Tulis failing test untuk fungsi filter (murni)**

Tambah di `lib/repositories/piket.test.ts`:

```ts
import {
  filterPiketLogs,
  filterComplianceRows,
  type PiketHistoryLog,
  type PiketComplianceRow,
} from "./piket";

describe("filterPiketLogs / filterComplianceRows", () => {
  const logs: PiketHistoryLog[] = [
    mkLog("2026-09-19", 3), // Sep 2026, pekan 3
    mkLog("2026-10-03", 1), // Okt 2026, pekan 1
    mkLog("2025-09-19", 3), // Sep 2025
  ];
  function mkLog(dutyDate: string, weekNumber: number): PiketHistoryLog {
    return {
      id: `l-${dutyDate}`,
      scheduleId: "s-1",
      academicPeriod: "2026/2027",
      weekNumber,
      roomTarget: "workshop_dan_sekretariat",
      dutyDate,
      reportedById: "p-1",
      reporterName: "A",
      reporterNim: "1",
      status: "approved",
      rejectionReason: "",
      verifiedAt: "",
      verifierName: "",
      notes: "",
      proofImageUrl: "",
      proofImageBeforeUrl: "",
      createdAt: "",
    };
  }

  it("filter tahun kalender", () => {
    expect(
      filterPiketLogs(logs, { academicPeriod: "2026/2027", year: 2026 }).map(
        (l) => l.dutyDate,
      ),
    ).toEqual(["2026-10-03", "2026-09-19"]);
  });
  it("filter bulan (0-based) & pekan", () => {
    expect(
      filterPiketLogs(logs, {
        academicPeriod: "2026/2027",
        monthIndex0: 8,
        weekNumber: 3,
      }).map((l) => l.id),
    ).toEqual(["l-2026-09-19"]);
  });
  it("null = tanpa filter", () => {
    expect(filterPiketLogs(logs, { academicPeriod: "2026/2027" })).toHaveLength(
      3,
    );
  });
  it("compliance difilter dari startIsoDate", () => {
    const rows = [
      {
        profileId: "p1",
        memberName: "A",
        nim: null,
        academicPeriod: "2026/2027",
        weekNumber: 3,
        roomTarget: "x",
        startIsoDate: "2026-09-14",
        endIsoDate: "2026-09-20",
        cycleMonthLabel: "September 2026",
        status: "alpha",
      },
      {
        profileId: "p2",
        memberName: "B",
        nim: null,
        academicPeriod: "2026/2027",
        weekNumber: 1,
        roomTarget: "x",
        startIsoDate: "2026-09-28",
        endIsoDate: "2026-10-04",
        cycleMonthLabel: "September 2026",
        status: "sudah-lapor",
      },
    ] as PiketComplianceRow[];
    expect(
      filterComplianceRows(rows, {
        academicPeriod: "2026/2027",
        monthIndex0: 8,
        weekNumber: 1,
      }).map((r) => r.profileId),
    ).toEqual(["p2"]);
  });
});
```

- [ ] **Step 2: Run test, pastikan GAGAL**

Run: `npx vitest run lib/repositories/piket.test.ts -t "filterPiketLogs"`
Expected: FAIL — `filterPiketLogs is not a function`.

- [ ] **Step 3: Implementasi tipe + fungsi filter + fetcher di `lib/repositories/piket.ts`**

Definisikan `export type PiketLogStatus = "approved" | "pending" | "rejected" | "auto_final";` **di `lib/repositories/piket.ts`** (sumber tunggal), lalu di `components/features/piket/types.ts` ganti definisi lokal menjadi `export type { PiketLogStatus } from "@/lib/repositories/piket";` agar server & klien berbagi tipe yang sama (hindari duplikasi). Tambahkan helper murni `export function deriveLogStatus(isVerified: boolean, isFinal: boolean, verifierName: string, rejectionReason: string): PiketLogStatus` (logika sama dengan `getPiketLogStatus` existing: rejected bila `!isVerified`; auto_final bila final tanpa verifier; approved bila final ber-verifier; else pending). Fungsi murni:

- `filterPiketLogs`: parse `dutyDate` → `{ y, m0 }`; cocokkan `year` (bila non-null), `monthIndex0` (bila non-null), `weekNumber` (bila non-null).
- `filterComplianceRows`: parse `startIsoDate` dengan cara sama.
- `getPiketHistoryLogs(academicPeriod)`: panggil `supabase.rpc("get_piket_history_logs", { p_academic_period: academicPeriod })`, map tiap baris → `PiketHistoryLog`, status dari `getPiketLogStatus`-equivalent (definisikan helper murni lokal `deriveLogStatus(isVerified, isFinal, verifierName, rejectionReason)` agar repo tak mengimpor komponen).
- `getPiketHistoryCompliance(academicPeriod)`: `return getPiketComplianceReport(academicPeriod)`.

- [ ] **Step 4: Run test, pastikan LULUS**

Run: `npx vitest run lib/repositories/piket.test.ts`
Expected: PASS (semua, termasuk tes lama).

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/piket.ts lib/repositories/piket.test.ts
git commit -m "feat(piket): repository histori piket + filter tahun/bulan/pekan"
```

---

### Task 3: RPC `get_piket_member_history` (migration)

**Files:**

- Modify: `supabase/migrations/20261005020000_add_piket_history_functions.sql` (tambah fungsi kedua)
- Test: verifikasi manual DB.

**Interfaces:**

- Produces: `public.get_piket_member_history(p_profile_id uuid) RETURNS TABLE(...)` — kolom sama dengan `get_piket_history_logs` **plus** `compliance_status text` (sudah-lapor/alpha/berlangsung/magang) dihitung per pekan menggunakan log valid & status magang. **Catatan:** karena perhitungan status kepatuhan kompleks (siklus pekan), fungsi ini hanya mengembalikan **baris log + baris jadwal**; kepatuhan dihitung ulang di TS memakai `buildComplianceRows`/`classifyPiketCompliance` untuk akurasi tunggal. Kolom akhir: `entry_type text ('log'|'scheduled'), ...` (lihat Step 1).

- [ ] **Step 1: Tambahkan fungsi kedua ke migration**

Append ke file migration yang sama:

```sql
DROP FUNCTION IF EXISTS public.get_piket_member_history(uuid);

CREATE OR REPLACE FUNCTION public.get_piket_member_history(p_profile_id uuid)
RETURNS TABLE (
  schedule_id uuid,
  academic_period text,
  week_number integer,
  room_target text,
  duty_date date,
  is_verified boolean,
  is_final boolean,
  rejection_reason text,
  verified_by uuid,
  verifier_name text,
  notes text,
  proof_image_url text,
  proof_image_before_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.schedule_id, s.academic_period, s.week_number, s.room_target, l.duty_date,
    l.is_verified, l.is_final, l.rejection_reason, l.verified_by,
    COALESCE(vp.full_name, (SELECT r2.full_name FROM public.registrations r2
        WHERE r2.profile_id = vp.id AND r2.deleted_at IS NULL
        ORDER BY r2.created_at DESC NULLS LAST LIMIT 1)) AS verifier_name,
    l.notes, l.proof_image_url, l.proof_image_before_url, l.created_at
  FROM public.piket_logs l
  LEFT JOIN public.piket_schedules s ON s.id = l.schedule_id
  LEFT JOIN public.profiles vp ON vp.id = l.verified_by
  WHERE l.reported_by = p_profile_id
  ORDER BY l.duty_date DESC, l.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_piket_member_history(uuid) IS
  'Histori lengkap log piket seorang anggota lintas semua periode (SECURITY DEFINER).';

REVOKE ALL ON FUNCTION public.get_piket_member_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_member_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_member_history(uuid) TO service_role;
```

- [ ] **Step 2: Terapkan & verifikasi**

Run:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/20261005020000_add_piket_history_functions.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT count(*) FROM public.get_piket_member_history('3f25b3ac-5b60-48b6-b126-8fbb950f0f82');"
```

Expected: fungsi dibuat tanpa error; count sesuai log milik profile tsb (≥ 0).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261005020000_add_piket_history_functions.sql
git commit -m "feat(piket): RPC get_piket_member_history untuk drawer anggota"
```

---

### Task 4: Repository `getPiketMemberHistory` + Server Action `getPiketMemberHistoryAction`

**Files:**

- Modify: `lib/repositories/piket.ts`, `lib/actions/piket.ts`
- Create: `lib/schemas/piket.ts` (bila belum ada; jika ada, tambahkan skema)
- Test: `lib/actions/piket.test.ts` (tambah describe)

**Interfaces:**

- Consumes: RPC `get_piket_member_history` (Task 3); `requireKestariManager`, `ServerActionResponse` (existing).
- Produces:
  - `export interface PiketMemberHistoryEntry { id: string; scheduleId: string | null; academicPeriod: string; weekNumber: number; roomTarget: string; dutyDate: string; status: PiketLogStatus; rejectionReason: string; verifierName: string; notes: string; proofImageUrl: string; proofImageBeforeUrl: string; createdAt: string; }`
  - `export async function getPiketMemberHistory(profileId: string): Promise<PiketMemberHistoryEntry[]>`
  - `export const piketMemberHistorySchema` (Zod) `{ profileId: z.string().uuid() }`
  - `export async function getPiketMemberHistoryAction(profileId: string): Promise<ServerActionResponse<PiketMemberHistoryEntry[]>>`

- [ ] **Step 1: Tulis failing test untuk action (guard + sukses)**

Tambah di `lib/actions/piket.test.ts` (ikuti pola mock yang sudah ada di file itu):

```ts
import { getPiketMemberHistoryAction } from "./piket";

describe("getPiketMemberHistoryAction", () => {
  it("menolak role non-kestari", async () => {
    // mock createClient → getUser ok, profiles.role = 'anggota', rpc spy
    const res = await getPiketMemberHistoryAction(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/akses ditolak/i);
  });
  it("mengembalikan data untuk super-admin", async () => {
    // mock role 'super-admin', rpc('get_piket_member_history') → 1 baris
    const res = await getPiketMemberHistoryAction(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });
  it("menolak profileId bukan uuid", async () => {
    const res = await getPiketMemberHistoryAction("not-a-uuid");
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, pastikan GAGAL**

Run: `npx vitest run lib/actions/piket.test.ts -t "getPiketMemberHistoryAction"`
Expected: FAIL — `getPiketMemberHistoryAction is not a function`.

- [ ] **Step 3: Implementasi schema + repository + action**

- `lib/schemas/piket.ts`: `export const piketMemberHistorySchema = z.object({ profileId: z.string().uuid() });`
- `lib/repositories/piket.ts`: `getPiketMemberHistory(profileId)` → `supabase.rpc("get_piket_member_history", { p_profile_id: profileId })`, map ke `PiketMemberHistoryEntry` (status via helper `deriveLogStatus` dari Task 2).
- `lib/actions/piket.ts`: tambah `"use server"`-compatible action `getPiketMemberHistoryAction(profileId)`: `getUser()` → `requireKestariManager` → validasi Zod → `getPiketMemberHistory` → `{ success: true, message, data }`; pada error → `{ success: false, message, error: { code, details } }`.

- [ ] **Step 4: Run test, pastikan LULUS**

Run: `npx vitest run lib/actions/piket.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/piket.ts lib/repositories/piket.ts lib/actions/piket.ts lib/actions/piket.test.ts
git commit -m "feat(piket): action getPiketMemberHistoryAction (read-only, guard kestari)"
```

---

### Task 5: RSC halaman `/piket/riwayat` + guard RBAC

**Files:**

- Create: `app/(private)/piket/riwayat/page.tsx`, `app/(private)/piket/riwayat/page.test.tsx`

**Interfaces:**

- Consumes: `createClient` (`@/lib/supabase/server`), `getPiketHistoryLogs`, `getPiketHistoryCompliance`, `filterPiketLogs`, `filterComplianceRows` (Task 2); `PiketHistoryClient` (Task 6/7).
- Produces: default async RSC `PiketRiwayatPage` yang membaca `searchParams` `{ period?: string; year?: string; month?: string; week?: string; tab?: string }` (Next 16: `searchParams: Promise<...>`), memfilter, lalu merender `<PiketHistoryClient ... />`.

- [ ] **Step 1: Tulis failing test guard (pola `verifikasi/page.test.tsx`)**

Buat `app/(private)/piket/riwayat/page.test.tsx` yang meng-mock `next/navigation`, `@/lib/supabase/server`, `@/lib/repositories/piket` (kedua fetcher → `[]`), dan komponen klien; assert:

- role ∈ {`anggota`,`admin-or`,`admin-komdis`,`admin-divisi`} → `rejects.toThrow("REDIRECT:/piket")`.
- role ∈ {`super-admin`,`admin-kestari`} → `resolves` tanpa redirect.

- [ ] **Step 2: Run test, pastikan GAGAL**

Run: `npx vitest run "app/(private)/piket/riwayat/page.test.tsx"`
Expected: FAIL — modul `./page` belum ada.

- [ ] **Step 3: Implementasi `page.tsx`**

RSC: `await searchParams`; `getUser()`; ambil `profiles.role`; bila bukan kestari → `redirect("/piket")`. Tentukan `availablePeriods` (dari `piket_schedules`, fallback `"2026/2027"`), `period` dari searchParams (default terbaru), parse `year/month/week` (number|undefined), panggil `getPiketHistoryLogs(period)` + `getPiketHistoryCompliance(period)`, terapkan `filterPiketLogs`/`filterComplianceRows`, render `<PiketHistoryClient profile={...} availablePeriods={...} logs={...} compliance={...} initialTab={...} activeFilter={...} />` di dalam `<Suspense fallback={<HistorySkeleton />}>`.

- [ ] **Step 4: Run test, pastikan LULUS**

Run: `npx vitest run "app/(private)/piket/riwayat/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(private)/piket/riwayat/page.tsx" "app/(private)/piket/riwayat/page.test.tsx"
git commit -m "feat(piket): halaman /piket/riwayat + guard RBAC"
```

---

### Task 6: Komponen `PiketHistoryClient` — filter bar + tab Kepatuhan

**Files:**

- Create: `components/features/piket/piket-history-client.tsx`, `components/features/piket/piket-history-client.test.tsx`
- Modify: `components/features/piket/types.ts` (tipe klien)

**Interfaces:**

- Consumes: types dari Task 2/4; `PiketComplianceRow`; `getPiketLogStatus`; `useRouter`/`usePathname`/`useSearchParams`.
- Produces: `export function PiketHistoryClient(props: PiketHistoryClientProps)` dengan `PiketHistoryClientProps = { profile: PiketProfile; availablePeriods: string[]; logs: PiketHistoryLog[]; compliance: PiketComplianceRow[]; initialTab: "kepatuhan" | "log"; activeFilter: { academicPeriod: string; year: number | null; monthIndex0: number | null; weekNumber: number | null }; }`.

- [ ] **Step 1: Tulis failing test komponen**

`piket-history-client.test.tsx`: render dengan fixture `compliance` (1 row) & `logs` (1 row); assert:

- header/judul histori tampil;
- tab "Kepatuhan" aktif default → menampilkan nama anggota & status;
- klik tab "Log" → menampilkan petugas dari `logs`.

- [ ] **Step 2: Run test, pastikan GAGAL**

Run: `npx vitest run components/features/piket/piket-history-client.test.tsx`
Expected: FAIL — komponen belum ada.

- [ ] **Step 3: Implementasi filter bar + tab Kepatuhan**

- Filter bar: `<select>` Periode DPH, Tahun, Bulan (nama Indonesia), Pekan (1–4) → `router.replace` dengan query dipertahankan (menggunakan `useSearchParams`). Target sentuh `min-h-[44px]`.
- Tab: `useState<"kepatuhan"|"log">` diinisialisasi `initialTab`.
- Tab Kepatuhan: tabel kolom **Anggota, NIM, Bulan, Pekan, Ruang, Rentang, Status** (meniru `/piket/verifikasi`, pakai badge status kepatuhan). Baris klik → buka drawer (Task 7) via callback/prop.
- Ringkasan count per status di atas tabel.

- [ ] **Step 4: Run test, pastikan LULUS**

Run: `npx vitest run components/features/piket/piket-history-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/features/piket/piket-history-client.tsx components/features/piket/piket-history-client.test.tsx components/features/piket/types.ts
git commit -m "feat(piket): PiketHistoryClient (filter + tab Kepatuhan)"
```

---

### Task 7: Tab Log + Drawer anggota (lazy)

**Files:**

- Modify: `components/features/piket/piket-history-client.tsx`
- Create: `components/features/piket/piket-history-member-drawer.tsx`
- Test: `components/features/piket/piket-history-client.test.tsx` (tambah)

**Interfaces:**

- Consumes: `getPiketMemberHistoryAction` (Task 4); `PiketLogStatusBadge`; `getPublicR2Url`.
- Produces: `export function PiketHistoryMemberDrawer(props: { profileId: string | null; memberName: string; open: boolean; onOpenChange: (o: boolean) => void })` — saat `open` & `profileId` berubah → panggil `getPiketMemberHistoryAction(profileId)` (lazy), tampilkan loading lalu timeline log + status + bukti + catatan.

- [ ] **Step 1: Tulis failing test (tab Log + drawer lazy)**

Tambah ke `piket-history-client.test.tsx`:

- tab "Log" menampilkan kolom Tanggal/Petugas/Pekan/Status.
- klik baris → drawer memanggil `getPiketMemberHistoryAction` (mock) & menampilkan hasil.

- [ ] **Step 2: Run test, pastikan GAGAL**

Run: `npx vitest run components/features/piket/piket-history-client.test.tsx -t "Log"`
Expected: FAIL.

- [ ] **Step 3: Implementasi tab Log + drawer**

- Tab Log: tabel kolom **Tanggal Tugas, Petugas (nama+NIM), Pekan, Bulan, Status, Bukti (tombol photo-preview), Catatan, Verifikator**.
- `PiketHistoryMemberDrawer`: pakai shadcn `Sheet`; `useEffect` memanggil action saat `open && profileId`; state `loading/data/error`; tampilkan profil singkat + timeline (tanggal, pekan, status badge, catatan, bukti via `getPublicR2Url`). Empty state ramah bila kosong/error.
- Wire baris (Kepatuhan & Log) → set `selectedProfileId` → buka drawer.

- [ ] **Step 4: Run test, pastikan LULUS**

Run: `npx vitest run components/features/piket/piket-history-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/features/piket/piket-history-client.tsx components/features/piket/piket-history-client.test.tsx components/features/piket/piket-history-member-drawer.tsx
git commit -m "feat(piket): tab Log + drawer histori anggota (lazy)"
```

---

### Task 8: Menu sidebar + tipe DB + push + gen:types

**Files:**

- Modify: `components/shared/sidebar.tsx`, `types/database.types.ts`, `lib/types/supabase.ts`

**Interfaces:**

- Consumes: RPC baru (Task 1 & 3).
- Produces: menu `piketRiwayat` (ikon `History`, `kestariOnly: true`) tampil untuk `super-admin` & `admin-kestari`.

- [ ] **Step 1: Tambah menu sidebar**

Di `components/shared/sidebar.tsx`:

- tambah item `piketRiwayat: { title: "Riwayat Piket", href: "/piket/riwayat", icon: History, module: "kebersihan", adminOnly: false, kestariOnly: true }`;
- tambah `"piketRiwayat"` ke `roleMenuKeys["admin-kestari"]` & `roleMenuKeys["super-admin"]`;
- sisipkan `"piketRiwayat"` di `menuOrderWithinModule.kebersihan` (setelah `piketVerifikasi`).

- [ ] **Step 2: Verifikasi build/typecheck**

Run: `npm run typecheck`
Expected: PASS (ikon `History` tersedia dari `lucide-react`).

- [ ] **Step 3: Push migration ke cloud & regenerate types**

Run:

```bash
supabase db push --linked        # terapkan 20261005020000 ke remote
pnpm gen:types                   # regenerate types/database.types.ts dari cloud
```

Expected: migrasi ter-apply; `types/database.types.ts` memuat `get_piket_history_logs` & `get_piket_member_history`.

- [ ] **Step 4: Verifikasi typecheck setelah gen:types**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/shared/sidebar.tsx types/database.types.ts lib/types/supabase.ts
git commit -m "feat(piket): menu sidebar Riwayat Piket + sinkronisasi tipe RPC"
```

---

### Task 9: Verifikasi akhir (lint + test + smoke DB)

**Files:** tidak ada file baru.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 error (warning pre-existing boleh).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Full test**

Run: `npm run test`
Expected: semua tes piket hijau; hanya kegagalan pre-existing `components/onboarding/onboarding.test.tsx` yang boleh tersisa.

- [ ] **Step 4: Smoke test DB untuk skenario Review Focus**

Run:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SET request.jwt.claims='{\"sub\":\"e9bbecb7-ef91-448f-9b5f-2c85b38afc34\",\"role\":\"authenticated\"}'; SET ROLE authenticated; SELECT count(*) FROM public.get_piket_history_logs(NULL); RESET ROLE;"
```

Expected: berhasil (nama ter-resolve) — mengonfirmasi akses kestari + RLS terjaga.

- [ ] **Step 5: Update dokumen & commit bila ada perubahan**

Bila perlu, perbarui `docs/08-tech-references/database.md` (daftar RPC baru). Commit:

```bash
git add docs/08-tech-references/database.md
git commit -m "docs: catat RPC histori piket"
```

---

## Catatan Eksekusi

- **Urutan penting:** Task 1 → 2 (log fetcher), 3 → 4 (member fetcher), lalu 5 → 6 → 7 (UI), lalu 8 (menu + push + types), 9 (verifikasi).
- **TDD wajib:** setiap task tulis tes yang gagal dulu (kecuali task SQL murni → verifikasi psql).
- **Jangan ubah RLS `profiles`.** Semua pembacaan lintas-role lewat RPC `SECURITY DEFINER` berproyeksi minimal.
- **Jangan commit file dump** (`supabase/backups/`, `data*.sql`) — sudah gitignored.
