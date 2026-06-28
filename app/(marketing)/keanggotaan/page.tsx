import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import KeanggotaanClient from "./KeanggotaanClient";
import type { OrgMember, OrgSection } from "./KeanggotaanClient";

export const metadata: Metadata = {
  title: "Struktur Organisasi — UKM Robotik PNP",
  description:
    "Sinergi di Balik Inovasi. Kenali talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan roda organisasi dan riset robotika.",
};

function deriveLevel(
  roleName: string,
): "Ketua" | "Wakil" | "Koordinator" | "Anggota" {
  const lower = roleName.toLowerCase();
  if (lower.includes("wakil")) return "Wakil";
  if (lower.includes("ketua")) return "Ketua";
  if (lower.includes("koordinator")) return "Koordinator";
  return "Anggota";
}

// -----------------------------------------------------------------------
// Raw row types setelah Supabase join.
// Relasi Many-to-One (org_histories → departments / legacy_members /
// divisions) selalu dikembalikan sebagai OBJEK TUNGGAL oleh Supabase JS
// Client, bukan array. TypeScript inference kadang memunculkan union dengan
// array – kita cast secara eksplisit via helper di bawah.
// -----------------------------------------------------------------------
type RawDept = {
  id: string;
  name: string;
  category: string;
  sort_order: number | null;
};

type RawLegacyMember = {
  full_name: string;
  avatar_url: string | null;
};

type RawDivision = {
  id: string;
  name: string;
};

/** Normalise a Many-to-One Supabase join result to a single object or null. */
function toSingle<T extends object>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw as T[])[0] ?? null;
  return raw;
}

export default async function KeanggotaanPage() {
  // Halaman publik — pakai admin client (service_role) karena RLS di semua
  // tabel belum mengizinkan akses anon. Admin client bypass RLS dan aman
  // digunakan di Server Component karena tidak pernah dikirim ke browser.
  const supabase = createAdminClient();

  // Fetch active period id.
  // Gunakan .maybeSingle() + .limit(1) agar:
  //   - Tidak crash bila 0 baris (tabel kosong / semua is_active=false)
  //   - Tidak crash bila >1 baris aktif (duplikat data)
  // .single() melempar PGRST116 di kedua skenario tersebut.
  const { data: activePeriod, error: periodError } = await supabase
    .from("membership_periods")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (periodError) {
    // PGRST116 = no rows found (aman diabaikan, periodId akan null)
    // Error lain perlu diperhatikan (misal: RLS menolak akses)
    if (periodError.code !== "PGRST116") {
      console.error(
        "[keanggotaan] period fetch error:",
        periodError.code,
        periodError.message,
      );
    }
  }

  const periodId = activePeriod?.id ?? null;

  // -----------------------------------------------------------------------
  // Supabase join query.
  //
  // Catatan relasi di tabel organizational_histories:
  //   - department_id  → departments   (Many-to-One) → hasil: objek tunggal
  //   - nim_member     → legacy_members (Many-to-One) → hasil: objek tunggal
  //   - division_id    → divisions     (Many-to-One, nullable) → objek/null
  //
  // Gunakan FK hint eksplisit `tabel!nama_fk_constraint(kolom)` untuk
  // mencegah ambiguitas "Could not embed because more than one relationship
  // was found for the same table".
  // -----------------------------------------------------------------------
  const { data: rows, error } = periodId
    ? await supabase
        .from("organizational_histories")
        .select(
          `
          id,
          role_name,
          sort_order,
          sub_section,
          division_id,
          departments:org_histories_department_fkey ( id, name, category, sort_order ),
          legacy_members:org_histories_member_fkey ( full_name, avatar_url ),
          divisions:org_histories_division_id_fkey ( id, name )
        `,
        )
        .eq("period_id", periodId)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (error) {
    console.error("[keanggotaan] fetch error:", error.message, error.details);
  }

  // --- Transform raw rows into typed OrgSection[] ---
  type SectionEntry = {
    category: string;
    deptName: string;
    deptSortOrder: number;
    members: OrgMember[];
    divisionMap: Map<string, { divName: string; members: OrgMember[] }>;
  };

  const sectionMap = new Map<string, SectionEntry>();

  for (const row of rows ?? []) {
    // Supabase mengembalikan relasi Many-to-One sebagai objek tunggal.
    // Helper toSingle() menangani kasus edge di mana TypeScript/runtime
    // mungkin mengembalikannya sebagai array.
    const dept = toSingle(row.departments as RawDept | RawDept[] | null);
    const lm = toSingle(
      row.legacy_members as RawLegacyMember | RawLegacyMember[] | null,
    );
    const div = toSingle(row.divisions as RawDivision | RawDivision[] | null);

    // Lewati baris yang tidak punya departemen atau anggota
    if (!dept || !lm) continue;

    const member: OrgMember = {
      id: row.id,
      name: lm.full_name,
      avatarUrl: lm.avatar_url ?? null,
      role: dept.name,
      level: deriveLevel(dept.name),
      subSection: row.sub_section ?? null,
      sortOrder: row.sort_order ?? 999,
    };

    if (!sectionMap.has(dept.id)) {
      sectionMap.set(dept.id, {
        category: dept.category,
        deptName: dept.name,
        deptSortOrder: dept.sort_order ?? 999,
        members: [],
        divisionMap: new Map(),
      });
    }

    const sec = sectionMap.get(dept.id)!;

    if (div && dept.category.toLowerCase() === "departemen") {
      if (!sec.divisionMap.has(div.id)) {
        sec.divisionMap.set(div.id, { divName: div.name, members: [] });
      }
      sec.divisionMap.get(div.id)!.members.push(member);
    } else {
      sec.members.push(member);
    }
  }

  // Sort members within each section / division by sortOrder
  for (const sec of sectionMap.values()) {
    sec.members.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const div of sec.divisionMap.values()) {
      div.members.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  // Validasi nilai category — harus salah satu dari tiga nilai yang valid.
  // Nilai di DB harus lowercase persis: 'presidium', 'adhoc', 'departemen'.
  const VALID_CATEGORIES = new Set(["presidium", "adhoc", "departemen"]);

  const orgSections: OrgSection[] = [...sectionMap.values()]
    .sort((a, b) => a.deptSortOrder - b.deptSortOrder)
    .filter((sec) => {
      const categoryLower = sec.category.toLowerCase();
      const isValid = VALID_CATEGORIES.has(categoryLower);
      if (!isValid) {
        console.warn(
          `[keanggotaan] Kategori tidak dikenal diabaikan: "${sec.category}" (dept: "${sec.deptName}")`,
        );
      }
      return isValid;
    })
    .map((sec) => ({
      category: sec.category.toLowerCase() as OrgSection["category"],
      deptName: sec.deptName,
      members: sec.members,
      divisions:
        sec.divisionMap.size > 0
          ? [...sec.divisionMap.values()].map((d) => ({
              divName: d.divName,
              members: d.members,
            }))
          : undefined,
    }));

  return (
    <div className="bg-canvas-dark text-foreground min-h-screen pt-20">
      <KeanggotaanClient sections={orgSections} />
    </div>
  );
}
