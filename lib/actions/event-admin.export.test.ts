import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Regresi ekspor CSV lengkap.
 *
 * Sebelumnya ekspor hanya memuat ~12 kolom tingkat tim (tanpa data anggota,
 * tanpa metadata pembayaran internal). Sekarang ekspor memuat SELURUH data form
 * (tim + anggota) dan metadata. Test ini mengunci:
 *  - header memuat kolom anggota berulang sebanyak plafon keras (20),
 *  - header memuat kolom metadata kunci (access token, midtrans, rules),
 *  - baris data mengisi data anggota & jumlah anggota dengan benar,
 *  - escaping CSV aman untuk nilai berkoma/berkutip.
 */

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/audit", () => ({ recordAuditLog: vi.fn(async () => {}) }));
vi.mock("@/lib/services/resend", () => ({
  sendETicketEmail: vi.fn(async () => ({ success: true })),
}));

const state = vi.hoisted(() => ({
  user: { id: "admin-1" } as { id: string } | null,
  profile: { role: "super-admin", role_event: "panitia-pendaftaran" } as {
    role: string;
    role_event: string | null;
  } | null,
  rows: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn(async () => ({ data: state.profile, error: null })),
        }),
      }),
    }),
  })),
  createAdminClient: vi.fn(() => ({
    from: () => {
      const b: Record<string, unknown> = {};
      const chain = () => b;
      b.select = vi.fn(chain);
      b.order = vi.fn(chain);
      b.then = (resolve: (v: unknown) => void) =>
        resolve({ data: state.rows, error: null });
      return b;
    },
    rpc: vi.fn(),
  })),
}));

vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }) => client.from("t"),
  untypedRpc: vi.fn(),
}));

import { getEventRegistrationsExportAction } from "./event-admin";
import { HARD_MAX_TEAM_MEMBERS } from "@/lib/schemas/event-registration";

function makeRow() {
  return {
    id: "reg-1",
    registration_code: "MRC-000000-0001",
    access_token: "11111111-1111-1111-1111-111111111111",
    team_name: 'Tim "Merah", A',
    category_id: "cat-1",
    institution: "SMKN 1 Padang",
    origin_city: "Padang",
    advisor_name: "Bu Ani",
    team_email: "tim@example.com",
    team_whatsapp: "081234567890",
    payment_status: "paid",
    total_amount: 195000,
    midtrans_order_id: "ORDER-1",
    midtrans_snap_token: "snap-1",
    midtrans_qr_url: null,
    midtrans_qr_expiry: null,
    midtrans_payment_type: "bank_transfer",
    paid_at: "2026-10-01T10:00:00.000Z",
    manual_payment_proof_url: "https://x/proof.webp",
    payment_bank_name: "Bank Nagari",
    payment_bank_account_number: "123",
    payment_bank_account_holder: "UKM Robotik",
    rejection_reason: null,
    rules_version_id: "rv-1",
    rules_accepted_at: "2026-09-30T09:00:00.000Z",
    registration_batch: "batch1",
    created_at: "2026-09-30T09:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    category: { name: "Line Follower Umum", slug: "line-follower-umum" },
    members: [
      {
        id: "m-1",
        registration_id: "reg-1",
        full_name: "Budi",
        photo_url: "https://x/1.webp",
        identity_card_url: null,
        birth_date: "2005-01-02",
        member_qr_token: "tok-1",
        verification_status: "verified",
        role_in_team: "Ketua Tim",
        created_at: "2026-09-30T09:00:00.000Z",
      },
      {
        id: "m-2",
        registration_id: "reg-1",
        full_name: "Siti",
        photo_url: "https://x/2.webp",
        identity_card_url: "https://x/k2.webp",
        birth_date: null,
        member_qr_token: "tok-2",
        verification_status: "pending",
        role_in_team: "Anggota",
        created_at: "2026-09-30T09:01:00.000Z",
      },
    ],
  };
}

describe("event-admin: ekspor CSV lengkap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: "admin-1" };
    state.profile = { role: "super-admin", role_event: "panitia-pendaftaran" };
    state.rows = [makeRow()];
  });

  it("header memuat kolom anggota berulang sebanyak plafon keras", async () => {
    const res = await getEventRegistrationsExportAction();
    expect(res.success).toBe(true);
    if (!res.success) return;

    const header = res.data.csv.split("\n")[0];
    expect(header).toContain('"Anggota 1 - Nama"');
    expect(header).toContain('"Anggota 2 - Nama"');
    expect(header).toContain(`"Anggota ${HARD_MAX_TEAM_MEMBERS} - Nama"`);
    expect(header).not.toContain(
      `"Anggota ${HARD_MAX_TEAM_MEMBERS + 1} - Nama"`,
    );
  });

  it("header memuat metadata kunci (token, midtrans, rules, bukti bayar)", async () => {
    const res = await getEventRegistrationsExportAction();
    if (!res.success) throw new Error("export gagal");
    const header = res.data.csv.split("\n")[0];

    for (const col of [
      '"Access Token"',
      '"Midtrans Order ID"',
      '"Bukti Bayar (URL)"',
      '"Rules Version ID"',
      '"Alasan Penolakan"',
      '"Rekening Bank (Panitia)"',
      '"Tanggal Bayar"',
    ]) {
      expect(header).toContain(col);
    }
  });

  it("baris data mengisi data anggota & jumlah anggota", async () => {
    const res = await getEventRegistrationsExportAction();
    if (!res.success) throw new Error("export gagal");
    const [header, row] = res.data.csv.split("\n");

    const cells = parseCsvLine(row);
    const headerCells = parseCsvLine(header);
    const idx = (name: string) => headerCells.indexOf(name);

    expect(cells[idx("Jumlah Anggota")]).toBe("2");
    expect(cells[idx("Anggota 1 - Nama")]).toBe("Budi");
    expect(cells[idx("Anggota 1 - Peran")]).toBe("Ketua Tim");
    expect(cells[idx("Anggota 1 - Status Verifikasi")]).toBe("verified");
    expect(cells[idx("Anggota 2 - Nama")]).toBe("Siti");
    expect(cells[idx("Anggota 2 - QR Token")]).toBe("tok-2");
    // Slot anggota ke-3 dan seterusnya dikosongkan.
    expect(cells[idx("Anggota 3 - Nama")]).toBe("");
  });

  it("meng-escape nilai berkoma/berkutip dengan benar", async () => {
    const res = await getEventRegistrationsExportAction();
    if (!res.success) throw new Error("export gagal");
    expect(res.data.csv).toContain('"Tim ""Merah"", A"');
  });

  it("rowCount = jumlah tim (satu baris per tim)", async () => {
    const res = await getEventRegistrationsExportAction();
    if (!res.success) throw new Error("export gagal");
    expect(res.data.rowCount).toBe(1);
    // 1 header + 1 baris data (tanpa newline trailing).
    expect(res.data.csv.split("\n")).toHaveLength(2);
  });
});

/** Parser CSV minim yang menangani tanda kutip ganda & koma dalam kutip. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
