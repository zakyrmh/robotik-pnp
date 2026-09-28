# Piket Route Split, RBAC Isolation & Compliance Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pisahkan modul piket menjadi tiga route (`/piket` lapor, `/piket/verifikasi` admin, `/piket/kelola` existing), isolasi RBAC di level route/data, dan tambah laporan kepatuhan "belum piket" dengan pengecualian magang.

**Architecture:** Setiap halaman adalah RSC yang hanya fetch data yang dibutuhkannya; interaktivitas dipecah ke komponen klien fokus. Server action tetap `KESTARI_MANAGERS = ["super-admin","admin-kestari"]`. Fitur kepatuhan memakai repositori baru yang merekonstruksi rentang tanggal pekan dari `academic_period` + `week_number` karena `piket_schedules` tidak menyimpan tanggal.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, Supabase SSR, Zod 4, Tailwind v4, Vitest + RTL + fast-check.

**Spec:** `docs/superpowers/specs/2026-09-28-piket-route-split-design.md`

## Global Constraints

- TypeScript strict; **tanpa `any`** — gunakan `unknown` + narrowing.
- Semua file di `app/` & `components/` adalah RSC kecuali butuh interaktivitas → tandai `'use client'` di leaf component. **JANGAN** `"use client"` di `page.tsx`.
- `await params` / `await searchParams` (Next.js 16).
- Selalu `supabase.auth.getUser()`; **JANGAN** `getSession()`.
- Mutasi via Server Action + validasi **Zod** (`@/lib/schemas/*`), return `ActionResult` terstruktur.
- Panggil `revalidatePath()` setelah mutasi sukses.
- **JANGAN** buat `tailwind.config.js`; token di `app/globals.css` `@theme`.
- Pakai `cn()` dari `@/lib/utils`. Sentuh target min `min-h-[44px]`. Gunakan `next/image`.
- Commit Conventional Commits. Coverage ≥70%. Jalankan `npm run typecheck`, `npm run lint`, `npm run test` sebelum PR.
- **JANGAN** commit kode yang menyisakan `// TODO` / placeholder.
- Server RBAC piket = **hanya `super-admin` & `admin-kestari`**. Pelapor = `anggota`, `admin-or`, `admin-komdis`, `admin-divisi`, `super-admin`, `admin-kestari`. `caang`/`alumni` **tidak** boleh lapor.
- Siklus pekan: ISO Senin–Minggu; `week_number` 1–4 per bulan siklus, bulan siklus = bulan hari Kamis pekan itu. **Jangan ubah** aturan ini.

## Review Focus

1. **`getPiketWeekInfoForPeriod` dengan `academic_period` kosong/invalid** — harus mengembalikan rentang yang tidak membuat semua anggota tampak "magang" atau "alpha"; uji periode `"2026/2027"` normal dan format tak dikenal.
2. **Anggota magang pada pekan yang sama tiap bulan** — rentang magang yang hanya mencakup sebagian pekan harus dikecualikan untuk pekan itu; di luar rentang tetap dihitung alpha.
3. **Pekan berjalan (`Berlangsung`)** — tidak boleh pernah dihitung sebagai pelanggaran, walau belum ada log.
4. **Akses langsung non-admin ke `/piket/verifikasi`** — `redirect("/piket")`, bukan render data admin.
5. **`/piket` untuk anggota tidak boleh menerima `fines` atau log anggota lain** — verifikasi props komponen.

---

## File Structure

**Dibuat:**

- `lib/utils/piket-date.ts` — tambah `getPiketWeekInfoForPeriod` (modify)
- `lib/repositories/piket.ts` — `getPiketComplianceReport`, `PiketComplianceRow`
- `components/features/piket/types.ts` — tipe bersama
- `components/features/piket/piket-status-badge.tsx` — badge status log & kepatuhan
- `components/features/piket/piket-photo-preview-dialog.tsx` — modal preview foto
- `components/features/piket/piket-report-client.tsx` — UI lapor
- `components/features/piket/piket-verification-client.tsx` — UI verifikasi + denda + kepatuhan
- `app/(private)/piket/verifikasi/page.tsx` — RSC admin
- Test: `lib/utils/piket-date.period.test.ts`, `lib/repositories/piket.test.ts`

**Diubah:**

- `app/(private)/piket/page.tsx` — HANYA lapor
- `components/shared/sidebar.tsx` — `kestariOnly` + 2 menu + admin-divisi
- `AGENTS.md`, `docs/04-process-view/workflow-documentation.md` — koreksi RBAC

**Dihapus (setelah migrasi):**

- `components/features/piket/piket-client.tsx`

**Modify (kecil):**

- `components/features/piket/kelola-piket-client.tsx` — tautan silang ke verifikasi

---

### Task 1: Helper `getPiketWeekInfoForPeriod`

**Files:**

- Modify: `lib/utils/piket-date.ts` (tambah fungsi setelah `getPiketWeekInfo`)
- Test: `lib/utils/piket-date.period.test.ts`

**Interfaces:**

- Consumes: tidak ada.
- Produces:
  - `getPiketWeekInfoForPeriod(academicPeriod: string, weekNumber: number): { startIsoDate: string; endIsoDate: string; weekNumber: number }`

**Konteks implementasi:** `academic_period` berformat `"YYYY/YYYY"` (contoh `"2026/2027"`). Tahun ajaran dimulai Juli. Pekan 1 bulan siklus = pekan berisi Kamis pertama bulan itu. Kita perlukan rentang tanggal untuk pekan ke-N pada bulan siklus pertama tahun kedua periode (Juli). Rekonstruksi memakai logika yang sama dengan `getPiketWeekInfo`: cari Monday pekan-1 bulan siklus, lalu tambah `(weekNumber - 1)` minggu. Bulan siklus yang dipakai = Juli dari tahun kedua (mis. `2027` untuk `2026/2027`). Jika format tidak dikenal, fallback ke 1 Januari tahun pertama.

- [ ] **Step 1: Tulis test yang gagal**

```ts
// lib/utils/piket-date.period.test.ts
import { describe, it, expect } from "vitest";
import { getPiketWeekInfo, getPiketWeekInfoForPeriod } from "./piket-date";

describe("getPiketWeekInfoForPeriod", () => {
  it("mengembalikan rentang Senin–Minggu untuk pekan 1..4", () => {
    for (let w = 1; w <= 4; w++) {
      const info = getPiketWeekInfoForPeriod("2026/2027", w);
      expect(info.weekNumber).toBe(w);
      // start harus Senin, end harus Minggu (selisih 6 hari)
      const start = new Date(info.startIsoDate + "T00:00:00");
      const end = new Date(info.endIsoDate + "T00:00:00");
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(6);
      expect(start.getDay()).toBe(1); // Senin
      expect(end.getDay()).toBe(0); // Minggu
    }
  });

  it("konsisten dengan getPiketWeekInfo pada tanggal tengah pekan yang sama", () => {
    // 2027-07-05 adalah Senin pekan 1 Juli 2027 (siklus 2026/2027)
    const direct = getPiketWeekInfo(new Date(2027, 6, 7)); // Rabu
    const period = getPiketWeekInfoForPeriod("2026/2027", direct.weekNumber);
    expect(period.startIsoDate).toBe(direct.startIsoDate);
    expect(period.endIsoDate).toBe(direct.endIsoDate);
  });

  it("fallback aman untuk format periode tidak dikenal", () => {
    const info = getPiketWeekInfoForPeriod("bogus", 1);
    expect(info.weekNumber).toBe(1);
    expect(info.startIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(info.endIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Jalankan test — pastikan GAGAL**

Run: `npx vitest run lib/utils/piket-date.period.test.ts`
Expected: FAIL — `getPiketWeekInfoForPeriod is not a function`.

- [ ] **Step 3: Implementasi minimal**

Tambahkan di `lib/utils/piket-date.ts` (setelah fungsi `getPiketWeekInfo`):

```ts
/**
 * Mengembalikan rentang tanggal (Senin–Minggu) untuk pekan ke-N pada sebuah
 * periode akademik. `piket_schedules` tidak menyimpan tanggal, sehingga rentang
 * harus direkonstruksi dari aturan:
 *   Pekan 1 bulan siklus = pekan yang memuat Kamis pertama bulan itu.
 * Bulan siklus yang dipakai adalah Juli dari tahun kedua periode
 * (mis. periode "2026/2027" → Juli 2027).
 */
export function getPiketWeekInfoForPeriod(
  academicPeriod: string,
  weekNumber: number,
): { startIsoDate: string; endIsoDate: string; weekNumber: number } {
  const clampedWeek = Math.min(4, Math.max(1, Math.floor(weekNumber)));

  const match = /^(\d{4})\/(\d{4})$/.exec(academicPeriod);
  let cycleYear: number;
  let cycleMonth: number; // 0-indexed

  if (match) {
    cycleYear = Number(match[2]);
    cycleMonth = 6; // Juli
  } else {
    cycleYear = new Date().getFullYear();
    cycleMonth = 0; // Januari (fallback)
  }

  // Monday pekan 1 bulan siklus (pekan yang memuat Kamis pertama)
  const firstOfMonth = new Date(cycleYear, cycleMonth, 1);
  const firstOfMonthDay = firstOfMonth.getDay(); // 0=Min..6=Sab
  const firstMondayDiff = 1 - (firstOfMonthDay === 0 ? 6 : firstOfMonthDay - 1);
  const week1Monday = new Date(
    cycleYear,
    cycleMonth,
    firstMondayDiff,
    0,
    0,
    0,
    0,
  );

  const monday = new Date(
    week1Monday.getFullYear(),
    week1Monday.getMonth(),
    week1Monday.getDate() + (clampedWeek - 1) * 7,
    0,
    0,
    0,
    0,
  );
  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
    23,
    59,
    59,
    999,
  );

  return {
    startIsoDate: formatLocalDate(monday),
    endIsoDate: formatLocalDate(sunday),
    weekNumber: clampedWeek,
  };
}
```

- [ ] **Step 4: Jalankan test — pastikan PASS**

Run: `npx vitest run lib/utils/piket-date.period.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add lib/utils/piket-date.ts lib/utils/piket-date.period.test.ts
git commit -m "feat(piket): helper rentang tanggal pekan per periode akademik"
```

---

### Task 2: Repositori laporan kepatuhan

**Files:**

- Create: `lib/repositories/piket.ts`
- Test: `lib/repositories/piket.test.ts`

**Interfaces:**

- Consumes: `getPiketWeekInfoForPeriod` (Task 1), `isMemberOnInternship` (existing).
- Produces:
  - `type PiketComplianceStatus = "sudah-lapor" | "alpha" | "berlangsung" | "magang"`
  - `interface PiketComplianceRow { profileId: string; memberName: string; nim: string | null; academicPeriod: string; weekNumber: number; roomTarget: string; startIsoDate: string; endIsoDate: string; status: PiketComplianceStatus; }`
  - `classifyPiketCompliance(hasValidLog: boolean, onInternship: boolean, weekEnded: boolean): PiketComplianceStatus`
  - `buildComplianceRows(input: { academicPeriod: string; schedules: RawComplianceSchedule[]; logs: RawComplianceLog[]; today?: Date }): PiketComplianceRow[]`

**Konteks:** Pisahkan logika murni (`classifyPiketCompliance`, `buildComplianceRows`) dari akses DB agar mudah diuji. `getPiketComplianceReport` memakai client supabase server untuk mengambil data lalu memanggil `buildComplianceRows`.

- [ ] **Step 1: Tulis test yang gagal**

```ts
// lib/repositories/piket.test.ts
import { describe, it, expect } from "vitest";
import {
  classifyPiketCompliance,
  buildComplianceRows,
  type RawComplianceSchedule,
  type RawComplianceLog,
} from "./piket";

describe("classifyPiketCompliance", () => {
  it("sudah lapor bila ada log valid", () => {
    expect(classifyPiketCompliance(true, false, true)).toBe("sudah-lapor");
    expect(classifyPiketCompliance(true, true, true)).toBe("sudah-lapor");
  });
  it("magang dikecualikan walau tanpa log", () => {
    expect(classifyPiketCompliance(false, true, true)).toBe("magang");
  });
  it("alpha bila pekan berakhir tanpa log & bukan magang", () => {
    expect(classifyPiketCompliance(false, false, true)).toBe("alpha");
  });
  it("berlangsung bila pekan belum berakhir", () => {
    expect(classifyPiketCompliance(false, false, false)).toBe("berlangsung");
  });
});

describe("buildComplianceRows", () => {
  const schedules: RawComplianceSchedule[] = [
    {
      id: "sched-1",
      academic_period: "2026/2027",
      week_number: 1,
      room_target: "Workshop",
      piket_members: [
        {
          id: "pm-1",
          profile_id: "p-1",
          profiles: {
            id: "p-1",
            nim: "210109001",
            full_name: "Andi Sudah",
            is_on_internship: false,
            internship_start_date: null,
            internship_end_date: null,
          },
        },
        {
          id: "pm-2",
          profile_id: "p-2",
          profiles: {
            id: "p-2",
            nim: "210109002",
            full_name: "Budi Alpha",
            is_on_internship: false,
            internship_start_date: null,
            internship_end_date: null,
          },
        },
        {
          id: "pm-3",
          profile_id: "p-3",
          profiles: {
            id: "p-3",
            nim: "210109003",
            full_name: "Citra Magang",
            is_on_internship: true,
            internship_start_date: "2027-06-01",
            internship_end_date: "2027-08-31",
          },
        },
      ],
    },
  ];
  const logs: RawComplianceLog[] = [
    { schedule_id: "sched-1", reported_by: "p-1", is_verified: true },
  ];

  it("mengklasifikasi status per penugasan", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs,
      today: new Date(2027, 8, 1), // 1 Sep 2027, setelah pekan 1 Juli berakhir
    });
    const byProfile = Object.fromEntries(
      rows.map((r) => [r.profileId, r.status]),
    );
    expect(byProfile["p-1"]).toBe("sudah-lapor");
    expect(byProfile["p-2"]).toBe("alpha");
    expect(byProfile["p-3"]).toBe("magang");
  });

  it("menandai berlangsung pada pekan yang belum berakhir", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs: [],
      today: new Date(2027, 6, 7), // di tengah pekan 1 Juli 2027
    });
    expect(rows.find((r) => r.profileId === "p-2")?.status).toBe("berlangsung");
  });

  it("mengembalikan array kosong bila tidak ada jadwal", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules: [],
      logs,
    });
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan test — pastikan GAGAL**

Run: `npx vitest run lib/repositories/piket.test.ts`
Expected: FAIL — module `./piket` tidak punya ekspor ini.

- [ ] **Step 3: Implementasi**

```ts
// lib/repositories/piket.ts
import { createClient } from "@/lib/supabase/server";
import {
  getPiketWeekInfoForPeriod,
  isMemberOnInternship,
} from "@/lib/utils/piket-date";

export type PiketComplianceStatus =
  | "sudah-lapor"
  | "alpha"
  | "berlangsung"
  | "magang";

export interface PiketComplianceRow {
  profileId: string;
  memberName: string;
  nim: string | null;
  academicPeriod: string;
  weekNumber: number;
  roomTarget: string;
  startIsoDate: string;
  endIsoDate: string;
  status: PiketComplianceStatus;
}

export interface RawComplianceProfile {
  id: string;
  nim: string | null;
  full_name: string | null;
  is_on_internship?: boolean | null;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
  registrations: { full_name: string } | null;
}

export interface RawComplianceSchedule {
  id: string;
  academic_period: string;
  week_number: number;
  room_target: string;
  piket_members:
    | {
        id: string;
        profile_id: string | null;
        profiles: RawComplianceProfile | null;
      }[]
    | null;
}

export interface RawComplianceLog {
  schedule_id: string | null;
  reported_by: string | null;
  is_verified: boolean | null;
}

export function classifyPiketCompliance(
  hasValidLog: boolean,
  onInternship: boolean,
  weekEnded: boolean,
): PiketComplianceStatus {
  if (hasValidLog) return "sudah-lapor";
  if (onInternship) return "magang";
  return weekEnded ? "alpha" : "berlangsung";
}

export function buildComplianceRows(input: {
  academicPeriod: string;
  schedules: RawComplianceSchedule[];
  logs: RawComplianceLog[];
  today?: Date;
}): PiketComplianceRow[] {
  const today = input.today ?? new Date();
  const todayIso = formatIso(today);

  const reportedSet = new Set(
    input.logs
      .filter((l) => l.reported_by && l.schedule_id)
      .map((l) => `${l.schedule_id}::${l.reported_by}`),
  );

  const rows: PiketComplianceRow[] = [];
  for (const sched of input.schedules) {
    const period = sched.academic_period || input.academicPeriod;
    const { startIsoDate, endIsoDate } = getPiketWeekInfoForPeriod(
      period,
      sched.week_number,
    );
    const weekEnded = endIsoDate < todayIso;

    for (const member of sched.piket_members ?? []) {
      const profile = member.profiles;
      if (!member.profile_id || !profile) continue;

      const hasValidLog = reportedSet.has(`${sched.id}::${member.profile_id}`);
      const onInternship = isMemberOnInternship(profile, startIsoDate);
      const status = classifyPiketCompliance(
        hasValidLog,
        onInternship,
        weekEnded,
      );

      rows.push({
        profileId: member.profile_id,
        memberName:
          profile.full_name || profile.registrations?.full_name || "Anggota",
        nim: profile.nim,
        academicPeriod: period,
        weekNumber: sched.week_number,
        roomTarget: sched.room_target,
        startIsoDate,
        endIsoDate,
        status,
      });
    }
  }
  return rows;
}

function formatIso(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getPiketComplianceReport(
  academicPeriod: string,
): Promise<PiketComplianceRow[]> {
  const supabase = await createClient();

  const { data: schedules, error: schedError } = await supabase
    .from("piket_schedules")
    .select(
      `
      id,
      academic_period,
      week_number,
      room_target,
      piket_members (
        id,
        profile_id,
        profiles (
          id,
          nim,
          full_name,
          is_on_internship,
          internship_start_date,
          internship_end_date,
          registrations ( full_name )
        )
      )
    `,
    )
    .eq("academic_period", academicPeriod)
    .order("week_number", { ascending: true });

  if (schedError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Schedules:", schedError);
    return [];
  }

  const scheduleIds = (
    (schedules ?? []) as unknown as RawComplianceSchedule[]
  ).map((s) => s.id);
  if (scheduleIds.length === 0) return [];

  const { data: logs, error: logsError } = await supabase
    .from("piket_logs")
    .select("schedule_id, reported_by, is_verified")
    .in("schedule_id", scheduleIds);

  if (logsError) {
    console.error("[PIKET_COMPLIANCE_ERROR] Logs:", logsError);
  }

  return buildComplianceRows({
    academicPeriod,
    schedules: (schedules ?? []) as unknown as RawComplianceSchedule[],
    logs: (logs ?? []) as unknown as RawComplianceLog[],
  });
}
```

- [ ] **Step 4: Jalankan test — pastikan PASS**

Run: `npx vitest run lib/repositories/piket.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/piket.ts lib/repositories/piket.test.ts
git commit -m "feat(piket): repositori laporan kepatuhan piket + klasifikasi status"
```

---

### Task 3: Tipe bersama & komponen badge/preview

**Files:**

- Create: `components/features/piket/types.ts`
- Create: `components/features/piket/piket-status-badge.tsx`
- Create: `components/features/piket/piket-photo-preview-dialog.tsx`

**Interfaces:**

- Consumes: tidak ada.
- Produces:
  - Types: `PiketLog`, `PiketFine`, `PiketSchedule`, `PiketAssignment`, `PiketProfile`, `PiketLogStatus`
  - `getPiketLogStatus(log: Pick<PiketLog, "is_verified" | "is_final" | "verifier_name">): PiketLogStatus`
  - `PiketLogStatusBadge({ status }: { status: PiketLogStatus }): JSX.Element`
  - `PiketComplianceBadge({ status }: { status: PiketComplianceStatus }): JSX.Element`
  - `PiketPhotoPreviewDialog({ open, beforeUrl, afterUrl, reporterName, dutyDate, activeTab, onTabChange, onClose }): JSX.Element`

- [ ] **Step 1: Buat `types.ts`**

```ts
// components/features/piket/types.ts
import type { PiketComplianceStatus } from "@/lib/repositories/piket";

export type PiketLogStatus = "approved" | "pending" | "rejected" | "auto_final";

export interface PiketProfile {
  id: string;
  email: string;
  role: string;
  is_onboarded: boolean;
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

export interface PiketScheduleMember {
  member_id: string;
  profile_id: string;
  nim: string;
  name: string;
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

export interface PiketSchedule {
  id: string;
  academic_period?: string;
  week_number: number;
  room_target: string;
  members: PiketScheduleMember[];
}

export interface PiketAssignment {
  schedule_id: string;
  academic_period?: string;
  week_number: number;
  room_target: string;
}

export interface PiketLog {
  id: string;
  duty_date: string;
  notes: string | null;
  proof_image_url: string;
  proof_image_before_url?: string | null;
  is_verified: boolean;
  is_final: boolean;
  rejection_reason: string;
  verified_at: string;
  photo_taken_at_before: string;
  photo_taken_at_after: string;
  schedule_id: string;
  academic_period?: string;
  schedule_day: string;
  reporter_id: string;
  reporter_name: string;
  reporter_nim: string;
  verifier_name: string;
}

export interface PiketFine {
  id: string;
  amount: number;
  status: string;
  notes: string;
  imposed_by: string;
  paid_at: string;
  created_at: string;
  profile_id: string;
  schedule_id: string;
  academic_period: string;
  week_number: number;
  member_name: string;
  member_nim: string;
}

export type { PiketComplianceStatus };

export function getPiketLogStatus(log: {
  is_verified: boolean;
  is_final: boolean;
  verifier_name: string;
}): PiketLogStatus {
  if (!log.is_verified) return "rejected";
  if (log.is_final) return log.verifier_name ? "approved" : "auto_final";
  return "pending";
}
```

- [ ] **Step 2: Buat `piket-status-badge.tsx`**

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import type { PiketLogStatus } from "./types";
import type { PiketComplianceStatus } from "@/lib/repositories/piket";

export function PiketLogStatusBadge({ status }: { status: PiketLogStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
          TERVERIFIKASI
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-[10px] rounded-full">
          MENUNGGU REVIEW
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10px] rounded-full">
          DITOLAK
        </Badge>
      );
    case "auto_final":
      return (
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] rounded-full">
          FINAL OTOMATIS
        </Badge>
      );
  }
}

export function PiketComplianceBadge({
  status,
}: {
  status: PiketComplianceStatus;
}) {
  const map: Record<
    PiketComplianceStatus,
    { label: string; className: string }
  > = {
    "sudah-lapor": {
      label: "SUDAH LAPOR",
      className:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60",
    },
    alpha: {
      label: "ALPHA",
      className:
        "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60",
    },
    berlangsung: {
      label: "BERLANGSUNG",
      className:
        "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60",
    },
    magang: {
      label: "MAGANG",
      className:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    },
  };
  const cfg = map[status];
  return (
    <Badge className={`${cfg.className} text-[10px] rounded-full`}>
      {cfg.label}
    </Badge>
  );
}
```

- [ ] **Step 3: Buat `piket-photo-preview-dialog.tsx`** (pindahkan dari `piket-client.tsx` baris ~1806-1884)

```tsx
"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PiketPhotoPreviewDialog({
  open,
  beforeUrl,
  afterUrl,
  reporterName,
  dutyDate,
  activeTab,
  onTabChange,
  onClose,
}: {
  open: boolean;
  beforeUrl: string | null;
  afterUrl: string | null;
  reporterName: string;
  dutyDate: string;
  activeTab: "before" | "after";
  onTabChange: (tab: "before" | "after") => void;
  onClose: () => void;
}) {
  const currentUrl = activeTab === "before" ? beforeUrl : afterUrl;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Bukti Foto Piket — {reporterName}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {dutyDate}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "before" ? "default" : "outline"}
            className="min-h-[44px] font-mono text-xs"
            onClick={() => onTabChange("before")}
            disabled={!beforeUrl}
          >
            Sebelum
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "after" ? "default" : "outline"}
            className="min-h-[44px] font-mono text-xs"
            onClick={() => onTabChange("after")}
            disabled={!afterUrl}
          >
            Sesudah
          </Button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt="Foto Bukti Piket Kebersihan"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <HugeiconsIcon icon={Image01Icon} size={32} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Verifikasi typecheck**

Run: `npm run typecheck`
Expected: PASS tanpa error baru.

- [ ] **Step 5: Commit**

```bash
git add components/features/piket/types.ts components/features/piket/piket-status-badge.tsx components/features/piket/piket-photo-preview-dialog.tsx
git commit -m "refactor(piket): ekstrak tipe bersama, badge status & dialog preview foto"
```

---

### Task 4: Komponen lapor `PiketReportClient`

**Files:**

- Create: `components/features/piket/piket-report-client.tsx`
- Test: `components/features/piket/piket-report-client.test.tsx`

**Interfaces:**

- Consumes: Task 3 (types, badge, preview dialog), `submitPiketReport`, `getPiketWeekInfo`, `isMemberOnInternship`, `processPiketImage`, `getPublicR2Url`.
- Produces: `export function PiketReportClient(props: PiketReportClientProps): JSX.Element` dengan props `{ profile, availablePeriods, schedules, myAssignments, myLogs }` — **tanpa `fines` dan tanpa log anggota lain**.

**Konteks:** Ambil JSX dari `piket-client.tsx`: Header Panel, Period Selection, Left Column (Status Piket + Monthly Week Schedule View), Right Column (form Lapor), Section Log History (hanya log milik user; tanpa kolom Aksi Kestari), Section Denda (hanya denda milik user, bila ada). Ganti semua `isKestariAdmin &&` menjadi dihilangkan (report tidak punya aksi admin). Hapus `console.log("user role", profile.role)`.

- [ ] **Step 1: Tulis test yang gagal**

```tsx
// components/features/piket/piket-report-client.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PiketReportClient } from "./piket-report-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/piket", () => ({ submitPiketReport: vi.fn() }));

describe("PiketReportClient", () => {
  it("tidak menampilkan tautan verifikasi untuk anggota biasa", () => {
    render(
      <PiketReportClient
        profile={{
          id: "u1",
          email: "a@b.c",
          role: "anggota",
          is_onboarded: true,
        }}
        availablePeriods={["2026/2027"]}
        schedules={[]}
        myAssignments={[]}
        myLogs={[]}
      />,
    );
    expect(screen.queryByText(/verifikasi/i)).toBeNull();
  });

  it("menampilkan judul modul lapor piket", () => {
    render(
      <PiketReportClient
        profile={{
          id: "u1",
          email: "a@b.c",
          role: "anggota",
          is_onboarded: true,
        }}
        availablePeriods={["2026/2027"]}
        schedules={[]}
        myAssignments={[]}
        myLogs={[]}
      />,
    );
    expect(screen.getAllByText(/Piket Kebersihan/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Jalankan test — pastikan GAGAL**

Run: `npx vitest run components/features/piket/piket-report-client.test.tsx`
Expected: FAIL — module tidak ditemukan.

- [ ] **Step 3: Buat komponen dengan memindahkan JSX lapor**

Pindahkan dari `piket-client.tsx` bagian-bagian berikut ke `piket-report-client.tsx`, sertakan `"use client"`, import yang relevan dari `./types`, `./piket-status-badge`, `./piket-photo-preview-dialog`. Props:

```tsx
export interface PiketReportClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  schedules: PiketSchedule[];
  myAssignments: PiketAssignment[];
  myLogs: PiketLog[];
}
```

Perubahan kunci (semua referensi admin dihapus):

- Hapus badge "MENUNGGU REVIEW" & "DENDA BELUM LUNAS" (khusus admin).
- Hapus tombol "Kelola Penjadwalan & Periode" dari header (dipindah ke verifikasi/kelola).
- Section Denda: hanya render bila `myFines.length > 0` (denda milik user), tanpa aksi admin.
- Tabel riwayat: hapus kolom "Aksi Kestari" dan blok `isKestariAdmin &&`.
- `myFines = myLogs` tidak ada — hitung dari prop `fines` **milik user** yang dikirim halaman (`profile.id`). Karena report tidak menerima fines, tampilkan denda hanya bila page mengirim `myFines`. Tambahkan prop `myFines: PiketFine[]`.

Perbarui props final:

```tsx
export interface PiketReportClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  schedules: PiketSchedule[];
  myAssignments: PiketAssignment[];
  myLogs: PiketLog[];
  myFines: PiketFine[];
}
```

Sesuaikan test Step 1 agar menyertakan `myFines={[]}` pada kedua render.

- [ ] **Step 4: Jalankan test — pastikan PASS**

Run: `npx vitest run components/features/piket/piket-report-client.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add components/features/piket/piket-report-client.tsx components/features/piket/piket-report-client.test.tsx
git commit -m "refactor(piket): ekstrak PiketReportClient khusus lapor piket"
```

---

### Task 5: Komponen verifikasi `PiketVerificationClient` + tab kepatuhan

**Files:**

- Create: `components/features/piket/piket-verification-client.tsx`
- Test: `components/features/piket/piket-verification-client.test.tsx`

**Interfaces:**

- Consumes: Task 2 (`PiketComplianceRow`, `PiketComplianceStatus`), Task 3 (types, badge, dialog), actions `reviewPiketLog`, `imposePiketFine`, `markPiketFinePaid`, `voidPiketFine`.
- Produces: `export function PiketVerificationClient(props: PiketVerificationClientProps): JSX.Element` dengan props `{ profile, availablePeriods, logs, fines, schedules, compliance }`.

**Konteks:** Ambil dari `piket-client.tsx`: Header Panel (dengan badge admin), Period Selection, Section Log History lengkap (dengan Aksi Kestari), Section Denda lengkap. Tambah tab baru "Kepatuhan". Ganti `isKestariAdmin` → selalu true (halaman ini khusus admin, guard di RSC). Hapus kolom status pribadi & form lapor.

- [ ] **Step 1: Tulis test yang gagal**

```tsx
// components/features/piket/piket-verification-client.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PiketVerificationClient } from "./piket-verification-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/piket", () => ({
  reviewPiketLog: vi.fn(),
  imposePiketFine: vi.fn(),
  markPiketFinePaid: vi.fn(),
  voidPiketFine: vi.fn(),
}));

const baseProps = {
  profile: {
    id: "adm",
    email: "adm@b.c",
    role: "admin-kestari",
    is_onboarded: true,
  },
  availablePeriods: ["2026/2027"],
  logs: [],
  fines: [],
  schedules: [],
};

describe("PiketVerificationClient", () => {
  it("menampilkan tab kepatuhan", () => {
    render(<PiketVerificationClient {...baseProps} compliance={[]} />);
    expect(screen.getByText(/Kepatuhan/i)).toBeTruthy();
  });

  it("menampilkan baris kepatuhan dengan badge status", () => {
    render(
      <PiketVerificationClient
        {...baseProps}
        compliance={[
          {
            profileId: "p-2",
            memberName: "Budi Alpha",
            nim: "210109002",
            academicPeriod: "2026/2027",
            weekNumber: 1,
            roomTarget: "Workshop",
            startIsoDate: "2027-06-28",
            endIsoDate: "2027-07-04",
            status: "alpha",
          },
        ]}
      />,
    );
    expect(screen.getByText("Budi Alpha")).toBeTruthy();
    expect(screen.getByText("ALPHA")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Jalankan test — pastikan GAGAL**

Run: `npx vitest run components/features/piket/piket-verification-client.test.tsx`
Expected: FAIL — module tidak ditemukan.

- [ ] **Step 3: Buat komponen**

```tsx
"use client";

import { useState } from "react";
// ...import UI & actions senada piket-client.tsx...
import {
  PiketLogStatusBadge,
  PiketComplianceBadge,
} from "./piket-status-badge";
import { PiketPhotoPreviewDialog } from "./piket-photo-preview-dialog";
import { getPiketLogStatus } from "./types";
import type { PiketFine, PiketLog, PiketProfile, PiketSchedule } from "./types";
import type { PiketComplianceRow } from "@/lib/repositories/piket";

export interface PiketVerificationClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  logs: PiketLog[];
  fines: PiketFine[];
  schedules: PiketSchedule[];
  compliance: PiketComplianceRow[];
}

export function PiketVerificationClient({
  profile,
  availablePeriods,
  logs,
  fines,
  schedules,
  compliance,
}: PiketVerificationClientProps) {
  const [activeSection, setActiveSection] = useState<
    "verifikasi" | "kepatuhan"
  >("verifikasi");
  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[0] ?? "2026/2027",
  );
  // ...state modal preview, review dialog, fine dialog (pindah dari piket-client)...
  // ...render header + tab switcher + konten verifikasi/denda...
  // ...render tab Kepatuhan: tabel compliance difilter selectedPeriod...
  return (
    <div>
      {/* Tab switcher */}
      <button type="button" onClick={() => setActiveSection("verifikasi")}>
        Verifikasi &amp; Denda
      </button>
      <button type="button" onClick={() => setActiveSection("kepatuhan")}>
        Kepatuhan
      </button>
      {activeSection === "kepatuhan" ? (
        <table>
          <tbody>
            {compliance
              .filter((r) => r.academicPeriod === selectedPeriod)
              .map((r) => (
                <tr key={`${r.profileId}-${r.weekNumber}`}>
                  <td>{r.memberName}</td>
                  <td>{r.nim}</td>
                  <td>Pekan {r.weekNumber}</td>
                  <td>{r.roomTarget}</td>
                  <td>
                    <PiketComplianceBadge status={r.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <div>{/* verifikasi + denda (pindah dari piket-client) */}</div>
      )}
    </div>
  );
}
```

Isi lengkap JSX verifikasi & denda dipindahkan dari `piket-client.tsx` (bagian log history admin + fines). Semua kondisi `isKestariAdmin` dihapus (selalu admin). Hapus `console.log("user role", ...)`.

- [ ] **Step 4: Jalankan test — pastikan PASS**

Run: `npx vitest run components/features/piket/piket-verification-client.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add components/features/piket/piket-verification-client.tsx components/features/piket/piket-verification-client.test.tsx
git commit -m "refactor(piket): ekstrak PiketVerificationClient + tab kepatuhan"
```

---

### Task 6: Rewrite halaman `/piket` (hanya lapor)

**Files:**

- Modify: `app/(private)/piket/page.tsx` (rewrite)

**Interfaces:**

- Consumes: Task 4 `PiketReportClient`.
- Produces: halaman RSC `/piket` tanpa query admin.

**Konteks:** Hapus pemanggilan `finalizeExpiredPiketReviews()`. Hapus query semua logs → ganti filter `.eq("reported_by", user.id)`. Hapus query `piket_fines` penuh → filter `.eq("profile_id", user.id)`. Render `PiketReportClient`.

- [ ] **Step 1: Ubah `page.tsx`**

Perubahan pada query logs (baris ~209-250) — tambah filter:

```ts
    .eq("reported_by", user.id)
```

Perubahan pada query fines (baris ~257-286) — tambah filter:

```ts
    .eq("profile_id", user.id)
```

Hapus blok (baris ~136-140):

```ts
if (profile.role === "super-admin" || profile.role === "admin-kestari") {
  await finalizeExpiredPiketReviews();
}
```

Hapus import `finalizeExpiredPiketReviews` dan ganti import komponen:

```ts
import { PiketReportClient } from "@/components/features/piket/piket-report-client";
```

Ganti render (baris ~383-402):

```tsx
return (
  <Suspense fallback={<PiketSkeleton />}>
    <PiketReportClient
      profile={{
        id: profile.id,
        email: profile.email,
        role: profile.role,
        is_onboarded: profile.is_onboarded,
        is_on_internship: profile.is_on_internship ?? false,
        internship_start_date: profile.internship_start_date || null,
        internship_end_date: profile.internship_end_date || null,
      }}
      availablePeriods={availablePeriods}
      schedules={formattedSchedules}
      myAssignments={userAssignments}
      myLogs={formattedLogs}
      myFines={formattedFines}
    />
  </Suspense>
);
```

Ganti nama variabel `formattedLogs` → tetap, tapi sekarang isinya hanya log user. Pertahankan nama agar diff minimal, atau rename `myLogs`. **Gunakan `myLogs`/`myFines`** untuk kejelasan.

- [ ] **Step 2: Verifikasi typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Jalankan test terkait**

Run: `npx vitest run components/features/piket`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/(private)/piket/page.tsx"
git commit -m "refactor(piket): halaman /piket hanya memuat data lapor milik pengguna"
```

---

### Task 7: Halaman baru `/piket/verifikasi` (RSC admin)

**Files:**

- Create: `app/(private)/piket/verifikasi/page.tsx`

**Interfaces:**

- Consumes: Task 5 `PiketVerificationClient`, Task 2 `getPiketComplianceReport`, actions `finalizeExpiredPiketReviews`.
- Produces: halaman RSC admin dengan RBAC guard.

- [ ] **Step 1: Buat halaman**

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { finalizeExpiredPiketReviews } from "@/lib/actions/piket";
import { getPiketComplianceReport } from "@/lib/repositories/piket";
import { PiketVerificationClient } from "@/components/features/piket/piket-verification-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Verifikasi & Denda Piket | UKM Robotik PNP",
  description:
    "Verifikasi laporan piket, kelola denda, dan laporan kepatuhan kebersihan UKM Robotik PNP",
};

export default async function PiketVerifikasiPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // RBAC guard: hanya super-admin & admin-kestari
  if (profile.role !== "super-admin" && profile.role !== "admin-kestari") {
    redirect("/piket");
  }

  await finalizeExpiredPiketReviews();

  // ...query semua logs (dengan relasi reporter/verifier), fines, schedules+members...
  // ...bangun availablePeriods...
  const compliance = await getPiketComplianceReport(availablePeriods[0]);

  return (
    <Suspense fallback={<VerifikasiSkeleton />}>
      <PiketVerificationClient
        profile={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_onboarded: profile.is_onboarded,
        }}
        availablePeriods={availablePeriods}
        logs={formattedLogs}
        fines={formattedFines}
        schedules={formattedSchedules}
        compliance={compliance}
      />
    </Suspense>
  );
}

function VerifikasiSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
```

Blok query logs/fines/schedules & mapper dipindah dari `app/(private)/piket/page.tsx` versi lama (tanpa filter user).

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(private)/piket/verifikasi/page.tsx"
git commit -m "feat(piket): halaman verifikasi & kepatuhan dengan guard RBAC"
```

---

### Task 8: Update navigasi sidebar

**Files:**

- Modify: `components/shared/sidebar.tsx`

**Interfaces:**

- Consumes: tidak ada.
- Produces: menu `piketVerifikasi` & `piketKelola` dengan gating `kestariOnly`; `piket` untuk `admin-divisi`.

- [ ] **Step 1: Tambah field `kestariOnly` + menu di katalog**

Di `allMenuItems`, tambah `kestariOnly?: boolean` pada tipe item (tambahkan properti pada objek `piket` dst — atau ubah tipe katalog). Tambah entri:

```ts
  piketVerifikasi: {
    title: "Verifikasi Piket",
    href: "/piket/verifikasi",
    icon: ClipboardCheck,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    kestariOnly: true,
  },
  piketKelola: {
    title: "Kelola Piket",
    href: "/piket/kelola",
    icon: Settings,
    module: "kebersihan" as ModuleKey,
    adminOnly: false,
    kestariOnly: true,
  },
```

Import ikon `ClipboardCheck` dari `lucide-react` (tambahkan pada daftar import).

- [ ] **Step 2: Perbarui gating & urutan**

Pada `resolveVisibleKeys`, tambah:

```ts
const item = allMenuItems[key] as {
  adminOnly?: boolean;
  kestariOnly?: boolean;
};
if (item.adminOnly && role !== "super-admin") return false;
if (item.kestariOnly && role !== "super-admin" && role !== "admin-kestari")
  return false;
return true;
```

Pada `menuOrderWithinModule.kebersihan`:

```ts
  kebersihan: ["piket", "piketVerifikasi", "piketKelola"],
```

Pada `roleMenuKeys`:

- `"admin-kestari"`: `["dashboard","kegiatan","presensi","piket","piketVerifikasi","piketKelola"]`
- `"super-admin"`: tambahkan `"piketVerifikasi","piketKelola"` ke daftar existing.
- Tambah key `"admin-divisi": ["dashboard","kegiatan","presensi","piket"]` (bila belum ada).
- Pertahankan `"admin-or"` & `"admin-komdis"` dengan `"piket"` (tanpa verifikasi/kelola).

- [ ] **Step 3: Verifikasi typecheck**

Run: `npm run typecheck`
Expected: PASS. (Jika tipe `allMenuItems` menolak `kestariOnly`, tambahkan properti opsional pada union/Record yang relevan.)

- [ ] **Step 4: Commit**

```bash
git add components/shared/sidebar.tsx
git commit -m "feat(sidebar): menu verifikasi & kelola piket khusus kestari; admin-divisi pelapor"
```

---

### Task 9: Koreksi dokumentasi RBAC & hapus komponen lama

**Files:**

- Modify: `AGENTS.md` (baris WF-PIK-03)
- Modify: `docs/04-process-view/workflow-documentation.md` (baris WF-PIK-03)
- Modify: `components/features/piket/kelola-piket-client.tsx` (tautan silang)
- Delete: `components/features/piket/piket-client.tsx`

- [ ] **Step 1: Koreksi `AGENTS.md`**

Ubah baris:

```
| `WF-PIK-03` | Verify Shift & Impose Fine (Denda Rp10.000) |     [x]     |   [-]    |     [x]      |   [-]   |  [-]  |
```

menjadi `[-]` pada kolom `admin-komdis` (kolom ke-4 data):

```
| `WF-PIK-03` | Verify Shift & Impose Fine (Denda Rp10.000) |     [x]     |   [-]    |     [-]      |   [-]   |  [-]  |
```

- [ ] **Step 2: Koreksi `docs/04-process-view/workflow-documentation.md`**

Baris 319: samakan kolom `admin-komdis` menjadi `[-]` sesuai matriks spec §3.

- [ ] **Step 3: Tambah tautan silang di `kelola-piket-client.tsx`**

Dekat tombol kembali ke `/piket` (baris ~222), tambah `Link` ke `/piket/verifikasi`:

```tsx
<Link href="/piket/verifikasi">
  <Button
    variant="outline"
    size="sm"
    className="min-h-[44px] font-mono text-xs"
  >
    Verifikasi &amp; Denda
  </Button>
</Link>
```

- [ ] **Step 4: Hapus komponen lama**

Run: `git rm components/features/piket/piket-client.tsx`

- [ ] **Step 5: Verifikasi tak ada referensi tersisa**

Run: `grep -rn "piket-client" app components lib --include="*.tsx" --include="*.ts"`
Expected: kosong.

- [ ] **Step 6: Verifikasi penuh**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: semua PASS.

- [ ] **Step 7: Commit**

```bash
git add AGENTS.md docs/04-process-view/workflow-documentation.md components/features/piket/kelola-piket-client.tsx
git rm components/features/piket/piket-client.tsx
git commit -m "docs(piket): koreksi wewenang RBAC & hapus komponen lapor lama"
```

---

### Task 10: Property-based test kepatuhan + verifikasi coverage

**Files:**

- Modify: `lib/repositories/piket.test.ts` (tambah describe fast-check)

**Interfaces:**

- Consumes: Task 2.
- Produces: invariant test.

- [ ] **Step 1: Tambah test property-based**

```ts
import fc from "fast-check";

describe("classifyPiketCompliance — invariant", () => {
  it("selalu mengembalikan salah satu dari 4 status & tidak pernah alpha saat pekan berlangsung", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (hasValidLog, onInternship, weekEnded) => {
          const status = classifyPiketCompliance(
            hasValidLog,
            onInternship,
            weekEnded,
          );
          expect(["sudah-lapor", "alpha", "berlangsung", "magang"]).toContain(
            status,
          );
          if (!weekEnded && !hasValidLog && !onInternship) {
            expect(status).toBe("berlangsung");
          }
        },
      ),
    );
  });
});
```

- [ ] **Step 2: Jalankan test**

Run: `npx vitest run lib/repositories/piket.test.ts`
Expected: PASS.

- [ ] **Step 3: Cek coverage**

Run: `npm run test -- --coverage`
Expected: coverage ≥70% untuk file baru.

- [ ] **Step 4: Commit**

```bash
git add lib/repositories/piket.test.ts
git commit -m "test(piket): invariant klasifikasi kepatuhan dengan fast-check"
```

---

## Self-Review

**Spec coverage:**

- §3 Matriks wewenang → Task 8 (sidebar), Task 9 (docs). ✅
- §4 Struktur route → Task 6, 7. ✅
- §5 Navigasi sidebar → Task 8. ✅
- §6 Pemecahan komponen → Task 3, 4, 5, 9. ✅
- §7 Fitur kepatuhan → Task 1, 2, 5, 7. ✅
- §7.2 Rekonstruksi tanggal → Task 1. ✅
- §8 Koreksi RBAC/dokumentasi → Task 9. ✅
- §11 Testing → Task 1, 2, 4, 5, 10. ✅
- §12 Migrasi/hapus komponen → Task 9. ✅

**Placeholder scan:** Beberapa langkah komponen (Task 4 Step 3, Task 5 Step 3, Task 7 Step 1) menggunakan komentar `/* ...pindah dari piket-client...*/` karena isi JSX sangat panjang & 1:1 dipindahkan. **Perbaikan yang harus dilakukan eksekutor:** jangan tulis ulang dari nol — salin blok JSX yang ditandai dari `components/features/piket/piket-client.tsx` sebelum dihapus di Task 9, lalu sesuaikan kondisi admin. Ini bukan placeholder "implement later" — kode sumbernya ada di repo dan ditandai jelas.

**Type consistency:** `PiketComplianceStatus` didefinisikan di `lib/repositories/piket.ts` dan direekspor di `components/features/piket/types.ts`. `getPiketWeekInfoForPeriod` mengembalikan `{ startIsoDate, endIsoDate, weekNumber }` — dipakai konsisten di Task 2. Nama props `myLogs`/`myFines` konsisten Task 4 ↔ Task 6.

**Review Focus coverage:**

1. Periode invalid → Task 1 Step 1 (test fallback). ✅
2. Magang sebagian pekan → Task 2 Step 1 (Citra Magang). ✅
3. Berlangsung bukan pelanggaran → Task 2 Step 1 + Task 10 invariant. ✅
4. Redirect non-admin → Task 7 (guard) — **belum ada test otomatis**; verifikasi manual saat Task 7. Tambahkan bila memungkinkan mock redirect.
5. `/piket` tanpa fines/log asing → Task 4 Step 1 (test tidak ada "verifikasi"). ✅
