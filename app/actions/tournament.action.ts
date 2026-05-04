"use server";

/**
 * Server Actions — Modul Tournament Setup
 *
 * Guard akses:
 * - requireAuth() — semua user yang sudah login
 * - Untuk tournament: cek role MRC atau admin
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  isActionError,
  ok,
  fail,
} from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";

// ── Validasi Schema ──

const addTeamSchema = z.object({
  name: z.string().min(1, "Nama tim tidak boleh kosong"),
});

const editTeamSchema = z.object({
  teamId: z.string().uuid("ID tim tidak valid"),
  name: z.string().min(1, "Nama tim tidak boleh kosong"),
});

const deleteTeamSchema = z.object({
  teamId: z.string().uuid("ID tim tidak valid"),
});

const getTeamsSchema = z.object({
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

const getGroupsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

const deleteGroupSchema = z.object({
  groupId: z.string().uuid("ID grup tidak valid"),
});

const assignTeamToGroupSchema = z.object({
  teamId: z.string().uuid("ID tim tidak valid"),
  groupId: z.string().uuid("ID grup tidak valid"),
});

const addMatchSchema = z.object({
  groupId: z.string().uuid("ID grup tidak valid"),
  teamAId: z.string().uuid("ID tim A tidak valid"),
  teamBId: z.string().uuid("ID tim B tidak valid"),
});

const updateMatchResultSchema = z.object({
  matchId: z.string().uuid("ID pertandingan tidak valid"),
  scoreA: z.number().int().min(0, "Skor tim A tidak valid"),
  scoreB: z.number().int().min(0, "Skor tim B tidak valid"),
  status: z.enum(["pending", "live", "finished"]),
  field: z.enum(["arena_1", "arena_2"]),
});

const updateTournamentBracketMatchSchema = z.object({
  matchId: z.string().uuid("ID pertandingan tidak valid"),
  teamAId: z.string().uuid("ID tim A tidak valid").nullable(),
  teamBId: z.string().uuid("ID tim B tidak valid").nullable(),
  scoreA: z.number().int().min(0, "Skor tim A tidak valid"),
  scoreB: z.number().int().min(0, "Skor tim B tidak valid"),
  status: z.enum(["pending", "live", "finished"]),
});

// ── Type Definitions ──

export interface TeamData {
  id: string;
  name: string;
  group_id: string | null;
}

export interface GroupData {
  id: string;
  name: string;
  teams: TeamData[];
}

export type MatchStatus = "pending" | "live" | "finished";
export type MatchField = "arena_1" | "arena_2";

export interface MatchData {
  id: string;
  group_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: MatchStatus | null;
  field: MatchField | null;
  created_at: string | null;
  group: Pick<GroupData, "id" | "name"> | null;
  team_a: TeamData | null;
  team_b: TeamData | null;
}

export interface GenerateGroupMatchesResult {
  created: number;
  skipped: number;
  expected: number;
  groups: number;
}

export interface TournamentBracketTeam {
  id: string;
  name: string;
  institution: string | null;
}

export interface TournamentBracketMatch {
  id: string;
  tournament_id: string;
  match_code: string;
  round_name: string;
  stage: string;
  side: string;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_label: string | null;
  team_b_label: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_team_id: string | null;
  winner_label: string | null;
  status: MatchStatus;
  sort_order: number;
  source_match_a_id: string | null;
  source_match_b_id: string | null;
  source_rule_a: string | null;
  source_rule_b: string | null;
  team_a?: TournamentBracketTeam | null;
  team_b?: TournamentBracketTeam | null;
  winner_team?: TournamentBracketTeam | null;
}

export interface TournamentBracketData {
  tournament: {
    id: string;
    name: string;
    category: string | null;
  } | null;
  matches: TournamentBracketMatch[];
  teams: TournamentBracketTeam[];
}

// ═════════════════════════════════════════════════════
// SERVER ACTIONS: TEAMS
// ═════════════════════════════════════════════════════

/**
 * Tambah tim baru
 */
export async function addTeam(input: unknown): Promise<ActionResult<TeamData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = addTeamSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { name } = validationResult.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .insert([{ name, group_id: null }])
    .select("id, name, group_id")
    .single();

  if (error) {
    console.error("[addTeam Error]", error);
    return fail("Gagal menambahkan tim. Silakan coba lagi.");
  }

  return ok(data as TeamData);
}

/**
 * Edit tim
 */
export async function editTeam(input: unknown): Promise<ActionResult<TeamData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = editTeamSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { teamId, name } = validationResult.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .update({ name })
    .eq("id", teamId)
    .select("id, name, group_id")
    .single();

  if (error) {
    console.error("[editTeam Error]", error);
    return fail("Gagal mengubah tim. Silakan coba lagi.");
  }

  return ok(data as TeamData);
}

/**
 * Hapus tim
 */
export async function deleteTeam(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = deleteTeamSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { teamId } = validationResult.data;
  const supabase = await createClient();

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    console.error("[deleteTeam Error]", error);
    return fail("Gagal menghapus tim. Silakan coba lagi.");
  }

  return ok({ id: teamId });
}

/**
 * Fetch semua tim dengan pagination (infinite scroll)
 */
export async function getTeams(
  input: unknown,
): Promise<ActionResult<{ teams: TeamData[]; total: number }>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = getTeamsSchema.safeParse(input);
  if (!validationResult.success) {
    return fail("Validasi parameter gagal");
  }

  const { limit, offset } = validationResult.data;
  const supabase = await createClient();

  // Fetch data
  const [teamsResult, countResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, group_id")
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1),
    supabase.from("teams").select("id", { count: "exact", head: true }),
  ]);

  if (teamsResult.error) {
    console.error("[getTeams Error]", teamsResult.error);
    return fail("Gagal memuat daftar tim");
  }

  const teams = (teamsResult.data ?? []) as TeamData[];
  const total = countResult.count ?? 0;

  return ok({ teams, total });
}

// ═════════════════════════════════════════════════════
// SERVER ACTIONS: GROUPS
// ═════════════════════════════════════════════════════

/**
 * Fetch semua grup dengan tim di dalamnya
 */
export async function getGroups(
  input: unknown,
): Promise<ActionResult<{ groups: GroupData[]; total: number }>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = getGroupsSchema.safeParse(input);
  if (!validationResult.success) {
    return fail("Validasi parameter gagal");
  }

  const { limit, offset } = validationResult.data;
  const supabase = await createClient();

  // Fetch groups
  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("id, name")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (groupsError) {
    console.error("[getGroups Error]", groupsError);
    return fail("Gagal memuat daftar grup");
  }

  // Fetch teams untuk setiap grup
  const groupsWithTeams: GroupData[] = [];

  for (const group of groupsData ?? []) {
    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name, group_id")
      .eq("group_id", group.id);

    groupsWithTeams.push({
      id: group.id,
      name: group.name,
      teams: (teamsData ?? []) as TeamData[],
    });
  }

  // Fetch total count
  const { count: total } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true });

  return ok({ groups: groupsWithTeams, total: total ?? 0 });
}

/**
 * Tambah grup baru dengan auto-naming (Group A, B, C, dst)
 */
export async function addGroup(
  _input: unknown,
): Promise<ActionResult<GroupData>> {
  void _input;

  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const supabase = await createClient();

  // Cari grup terbanyak untuk naming
  const { data: groupsData } = await supabase
    .from("groups")
    .select("name")
    .order("name", { ascending: true });

  const existingCount = groupsData?.length ?? 0;
  const groupName = `Group ${String.fromCharCode(65 + existingCount)}`; // A, B, C, dst

  const { data, error } = await supabase
    .from("groups")
    .insert([{ name: groupName }])
    .select("id, name")
    .single();

  if (error) {
    console.error("[addGroup Error]", error);
    return fail("Gagal membuat grup. Silakan coba lagi.");
  }

  return ok({
    id: data.id,
    name: data.name,
    teams: [],
  });
}

/**
 * Hapus grup beserta teams di dalamnya (via cascade)
 */
export async function deleteGroup(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = deleteGroupSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { groupId } = validationResult.data;
  const supabase = await createClient();

  // Sebelum delete, unset group_id dari teams
  await supabase.from("teams").update({ group_id: null }).eq("group_id", groupId);

  // Kemudian delete group
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    console.error("[deleteGroup Error]", error);
    return fail("Gagal menghapus grup. Silakan coba lagi.");
  }

  return ok({ id: groupId });
}

/**
 * Assign tim ke grup (only 1 team per group rule)
 */
export async function assignTeamToGroup(
  input: unknown,
): Promise<ActionResult<TeamData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = assignTeamToGroupSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { teamId, groupId } = validationResult.data;
  const supabase = await createClient();

  // Validasi: cek apakah team sudah ada di group lain
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("group_id")
    .eq("id", teamId)
    .single();

  if (existingTeam?.group_id) {
    return fail(
      "Tim ini sudah berada di grup lain. Silakan keluar dari grup sebelumnya terlebih dahulu.",
    );
  }

  // Assign team ke group
  const { data, error } = await supabase
    .from("teams")
    .update({ group_id: groupId })
    .eq("id", teamId)
    .select("id, name, group_id")
    .single();

  if (error) {
    console.error("[assignTeamToGroup Error]", error);
    return fail("Gagal menambahkan tim ke grup. Silakan coba lagi.");
  }

  return ok(data as TeamData);
}

/**
 * Remove tim dari grup (set group_id to null)
 */
export async function removeTeamFromGroup(
  input: unknown,
): Promise<ActionResult<TeamData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = z
    .object({ teamId: z.string().uuid() })
    .safeParse(input);
  if (!validationResult.success) {
    return fail("Validasi gagal");
  }

  const { teamId } = validationResult.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .update({ group_id: null })
    .eq("id", teamId)
    .select("id, name, group_id")
    .single();

  if (error) {
    console.error("[removeTeamFromGroup Error]", error);
    return fail("Gagal mengeluarkan tim dari grup. Silakan coba lagi.");
  }

  return ok(data as TeamData);
}

// ═════════════════════════════════════════════════════════════
// SERVER ACTIONS: MATCHES
// ═════════════════════════════════════════════════════════════

/**
 * Fetch semua pertandingan beserta grup dan timnya.
 */
export async function getMatches(): Promise<ActionResult<{ matches: MatchData[] }>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(`
      id,
      group_id,
      team_a_id,
      team_b_id,
      score_a,
      score_b,
      status,
      field,
      created_at,
      group:groups!matches_group_id_fkey(id, name),
      team_a:teams!matches_team_a_id_fkey(id, name, group_id),
      team_b:teams!matches_team_b_id_fkey(id, name, group_id)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMatches Error]", error);
    return fail("Gagal memuat daftar pertandingan");
  }

  return ok({ matches: (data ?? []) as unknown as MatchData[] });
}

/**
 * Tambah pertandingan baru dalam satu grup.
 */
export async function addMatch(input: unknown): Promise<ActionResult<MatchData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = addMatchSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { groupId, teamAId, teamBId } = validationResult.data;

  if (teamAId === teamBId) {
    return fail("Tim A dan Tim B tidak boleh sama");
  }

  const supabase = await createClient();

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, group_id")
    .in("id", [teamAId, teamBId]);

  if (teamsError) {
    console.error("[addMatch Teams Error]", teamsError);
    return fail("Gagal memvalidasi tim pertandingan");
  }

  if ((teamsData ?? []).length !== 2) {
    return fail("Tim yang dipilih tidak ditemukan");
  }

  const invalidTeam = teamsData?.find((team) => team.group_id !== groupId);
  if (invalidTeam) {
    return fail("Tim A dan Tim B harus berasal dari grup yang dipilih");
  }

  const { data: existingMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id, team_a_id, team_b_id")
    .eq("group_id", groupId);

  if (matchesError) {
    console.error("[addMatch Existing Error]", matchesError);
    return fail("Gagal memeriksa pertandingan yang sudah ada");
  }

  const hasDuplicate = (existingMatches ?? []).some((match) => {
    return (
      (match.team_a_id === teamAId && match.team_b_id === teamBId) ||
      (match.team_a_id === teamBId && match.team_b_id === teamAId)
    );
  });

  if (hasDuplicate) {
    return fail("Pertandingan untuk kedua tim ini sudah dibuat");
  }

  const { data, error } = await supabase
    .from("matches")
    .insert([
      {
        group_id: groupId,
        team_a_id: teamAId,
        team_b_id: teamBId,
        score_a: 0,
        score_b: 0,
        status: "pending",
      },
    ])
    .select(`
      id,
      group_id,
      team_a_id,
      team_b_id,
      score_a,
      score_b,
      status,
      field,
      created_at,
      group:groups!matches_group_id_fkey(id, name),
      team_a:teams!matches_team_a_id_fkey(id, name, group_id),
      team_b:teams!matches_team_b_id_fkey(id, name, group_id)
    `)
    .single();

  if (error) {
    console.error("[addMatch Error]", error);
    return fail("Gagal membuat pertandingan. Silakan coba lagi.");
  }

  revalidatePath("/tournament/matches");

  return ok(data as unknown as MatchData);
}

/**
 * Generate semua pertandingan round-robin untuk setiap grup.
 */
export async function generateGroupMatches(): Promise<
  ActionResult<GenerateGroupMatchesResult>
> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const supabase = await createClient();

  const [groupsResult, teamsResult, matchesResult] = await Promise.all([
    supabase.from("groups").select("id").order("name", { ascending: true }),
    supabase
      .from("teams")
      .select("id, group_id")
      .not("group_id", "is", null)
      .order("name", { ascending: true }),
    supabase.from("matches").select("group_id, team_a_id, team_b_id"),
  ]);

  if (groupsResult.error) {
    console.error("[generateGroupMatches Groups Error]", groupsResult.error);
    return fail("Gagal memuat grup untuk generate pertandingan");
  }

  if (teamsResult.error) {
    console.error("[generateGroupMatches Teams Error]", teamsResult.error);
    return fail("Gagal memuat tim untuk generate pertandingan");
  }

  if (matchesResult.error) {
    console.error("[generateGroupMatches Matches Error]", matchesResult.error);
    return fail("Gagal memeriksa pertandingan yang sudah ada");
  }

  const teamsByGroup = new Map<string, Array<{ id: string }>>();

  for (const team of teamsResult.data ?? []) {
    if (!team.group_id) continue;

    const groupTeams = teamsByGroup.get(team.group_id) ?? [];
    groupTeams.push({ id: team.id });
    teamsByGroup.set(team.group_id, groupTeams);
  }

  const existingPairs = new Set<string>();

  for (const match of matchesResult.data ?? []) {
    if (!match.group_id || !match.team_a_id || !match.team_b_id) continue;
    existingPairs.add(createMatchPairKey(match.group_id, match.team_a_id, match.team_b_id));
  }

  const rowsToInsert: Array<{
    group_id: string;
    team_a_id: string;
    team_b_id: string;
    score_a: number;
    score_b: number;
    status: MatchStatus;
  }> = [];

  let expected = 0;
  let skipped = 0;

  for (const group of groupsResult.data ?? []) {
    const groupTeams = teamsByGroup.get(group.id) ?? [];

    for (let teamAIndex = 0; teamAIndex < groupTeams.length; teamAIndex += 1) {
      for (
        let teamBIndex = teamAIndex + 1;
        teamBIndex < groupTeams.length;
        teamBIndex += 1
      ) {
        const teamA = groupTeams[teamAIndex];
        const teamB = groupTeams[teamBIndex];
        if (!teamA || !teamB) continue;

        expected += 1;

        const pairKey = createMatchPairKey(group.id, teamA.id, teamB.id);

        if (existingPairs.has(pairKey)) {
          skipped += 1;
          continue;
        }

        existingPairs.add(pairKey);
        rowsToInsert.push({
          group_id: group.id,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          score_a: 0,
          score_b: 0,
          status: "pending",
        });
      }
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("matches").insert(rowsToInsert);

    if (error) {
      console.error("[generateGroupMatches Insert Error]", error);
      return fail("Gagal membuat pertandingan otomatis. Silakan coba lagi.");
    }
  }

  revalidatePath("/tournament/matches");

  return ok({
    created: rowsToInsert.length,
    skipped,
    expected,
    groups: groupsResult.data?.length ?? 0,
  });
}

/**
 * Update status dan skor pertandingan.
 */
export async function updateMatchResult(
  input: unknown,
): Promise<ActionResult<MatchData>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = updateMatchResultSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { matchId, scoreA, scoreB, status, field } = validationResult.data;
  const supabase = (await createClient()) as unknown as SupabaseLooseClient;

  if (status === "live") {
    const { error: unsetLiveError } = await supabase
      .from("matches")
      .update({ status: "pending" })
      .eq("field", field)
      .eq("status", "live")
      .neq("id", matchId);

    if (unsetLiveError) {
      console.error("[updateMatchResult Unset Live Error]", unsetLiveError);
      return fail("Gagal mengubah status live arena");
    }
  }

  const { data, error } = await supabase
    .from("matches")
    .update({
      score_a: scoreA,
      score_b: scoreB,
      status,
      field,
    })
    .eq("id", matchId)
    .select(`
      id,
      group_id,
      team_a_id,
      team_b_id,
      score_a,
      score_b,
      status,
      field,
      created_at,
      group:groups!matches_group_id_fkey(id, name),
      team_a:teams!matches_team_a_id_fkey(id, name, group_id),
      team_b:teams!matches_team_b_id_fkey(id, name, group_id)
    `)
    .single();

  if (error) {
    console.error("[updateMatchResult Error]", error);
    return fail("Gagal menyimpan hasil pertandingan. Silakan coba lagi.");
  }

  revalidatePath("/tournament/matches");

  return ok(data as unknown as MatchData);
}

function createMatchPairKey(groupId: string, teamAId: string, teamBId: string) {
  const [firstTeamId, secondTeamId] = [teamAId, teamBId].sort();
  return `${groupId}:${firstTeamId}:${secondTeamId}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER ACTIONS: CUSTOM BRACKET
// ═══════════════════════════════════════════════════════════════════════════════

type SupabaseLooseClient = {
  // database.types.ts belum memuat tabel tournament_* yang baru dibuat di Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

const DEFAULT_TOURNAMENT_NAME = "Robot Soccer Tournament";

const DEFAULT_BRACKET_MATCHES = [
  {
    match_code: "RS-S2-A01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "left",
    team_a_label: "Rank 1 Grup A",
    team_b_label: "Rank 2 Grup A",
    source_rule_a: "group:A:rank:1",
    source_rule_b: "group:A:rank:2",
    sort_order: 10,
  },
  {
    match_code: "RS-S2-B01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "left",
    team_a_label: "Rank 1 Grup B",
    team_b_label: "Rank 2 Grup B",
    source_rule_a: "group:B:rank:1",
    source_rule_b: "group:B:rank:2",
    sort_order: 20,
  },
  {
    match_code: "RS-S2-C01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "left",
    team_a_label: "Rank 1 Grup C",
    team_b_label: "Rank 2 Grup C",
    source_rule_a: "group:C:rank:1",
    source_rule_b: "group:C:rank:2",
    sort_order: 30,
  },
  {
    match_code: "RS-S2-D01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "right",
    team_a_label: "Rank 1 Grup D",
    team_b_label: "Rank 2 Grup D",
    source_rule_a: "group:D:rank:1",
    source_rule_b: "group:D:rank:2",
    sort_order: 40,
  },
  {
    match_code: "RS-S2-E01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "right",
    team_a_label: "Rank 1 Grup E",
    team_b_label: "Rank 2 Grup E",
    source_rule_a: "group:E:rank:1",
    source_rule_b: "group:E:rank:2",
    sort_order: 50,
  },
  {
    match_code: "RS-S2-F01",
    round_name: "Sesi 2",
    stage: "session_2",
    side: "right",
    team_a_label: "Rank 1 Grup F",
    team_b_label: "Rank 2 Grup F",
    source_rule_a: "group:F:rank:1",
    source_rule_b: "group:F:rank:2",
    sort_order: 60,
  },
  {
    match_code: "RS-S3-AB01",
    round_name: "Sesi 3",
    stage: "session_3",
    side: "left",
    team_a_label: "Pemenang RS-S2-A01",
    team_b_label: "Pemenang RS-S2-B01",
    source_rule_a: "winner:RS-S2-A01",
    source_rule_b: "winner:RS-S2-B01",
    sort_order: 70,
  },
  {
    match_code: "RS-S3-CF01",
    round_name: "Sesi 3",
    stage: "session_3",
    side: "left",
    team_a_label: "Pemenang RS-S2-C01",
    team_b_label: "Pemenang RS-S2-F01",
    source_rule_a: "winner:RS-S2-C01",
    source_rule_b: "winner:RS-S2-F01",
    sort_order: 80,
  },
  {
    match_code: "RS-S3-DE01",
    round_name: "Sesi 3",
    stage: "session_3",
    side: "right",
    team_a_label: "Pemenang RS-S2-D01",
    team_b_label: "Pemenang RS-S2-E01",
    source_rule_a: "winner:RS-S2-D01",
    source_rule_b: "winner:RS-S2-E01",
    sort_order: 90,
  },
  {
    match_code: "RS-GP-G01",
    round_name: "Play-in G",
    stage: "group_g_path",
    side: "group_g",
    team_a_label: "Juara Grup G",
    team_b_label: "Best loser Sesi 2",
    source_rule_a: "group:G:rank:1",
    source_rule_b: "best_loser:session_2:1",
    sort_order: 100,
  },
  {
    match_code: "RS-GP-G02",
    round_name: "Menuju Semi Final 2",
    stage: "group_g_path",
    side: "group_g",
    team_a_label: "Pemenang RS-GP-G01",
    team_b_label: "Best loser Sesi 3",
    source_rule_a: "winner:RS-GP-G01",
    source_rule_b: "best_loser:session_3:1",
    sort_order: 110,
  },
  {
    match_code: "RS-S4-M01",
    round_name: "Semi Final 1",
    stage: "semifinal",
    side: "center",
    team_a_label: "Pemenang RS-S3-AB01",
    team_b_label: "Pemenang RS-S3-DE01",
    source_rule_a: "winner:RS-S3-AB01",
    source_rule_b: "winner:RS-S3-DE01",
    sort_order: 120,
  },
  {
    match_code: "RS-S4-M02",
    round_name: "Semi Final 2",
    stage: "semifinal",
    side: "center",
    team_a_label: "Pemenang RS-S3-CF01",
    team_b_label: "Pemenang RS-GP-G02",
    source_rule_a: "winner:RS-S3-CF01",
    source_rule_b: "winner:RS-GP-G02",
    sort_order: 130,
  },
  {
    match_code: "RS-FN-001",
    round_name: "Grand Final",
    stage: "final",
    side: "center",
    team_a_label: "Pemenang RS-S4-M01",
    team_b_label: "Pemenang RS-S4-M02",
    source_rule_a: "winner:RS-S4-M01",
    source_rule_b: "winner:RS-S4-M02",
    sort_order: 140,
  },
] as const;

export async function getTournamentBracket(): Promise<
  ActionResult<TournamentBracketData>
> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const supabase = (await createClient()) as unknown as SupabaseLooseClient;

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, category")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tournamentError) {
    console.error("[getTournamentBracket Tournament Error]", tournamentError);
    return fail("Gagal memuat tournament");
  }

  if (!tournament) {
    return ok({ tournament: null, matches: [], teams: [] });
  }

  const [matchesResult, teamsResult] = await Promise.all([
    supabase
      .from("tournament_matches")
      .select(`
      id,
      tournament_id,
      match_code,
      round_name,
      stage,
      side,
      team_a_id,
      team_b_id,
      team_a_label,
      team_b_label,
      score_a,
      score_b,
      winner_team_id,
      winner_label,
      status,
      sort_order,
      source_match_a_id,
      source_match_b_id,
      source_rule_a,
      source_rule_b,
      team_a:tournament_teams!tournament_matches_team_a_id_fkey(id, name, institution),
      team_b:tournament_teams!tournament_matches_team_b_id_fkey(id, name, institution),
      winner_team:tournament_teams!tournament_matches_winner_team_id_fkey(id, name, institution)
    `)
      .eq("tournament_id", tournament.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tournament_teams")
      .select("id, name, institution")
      .eq("tournament_id", tournament.id)
      .order("name", { ascending: true }),
  ]);

  if (matchesResult.error) {
    console.error("[getTournamentBracket Matches Error]", matchesResult.error);
    return fail("Gagal memuat bracket");
  }

  if (teamsResult.error) {
    console.error("[getTournamentBracket Teams Error]", teamsResult.error);
    return fail("Gagal memuat daftar tim bracket");
  }

  return ok({
    tournament: tournament as TournamentBracketData["tournament"],
    matches: (matchesResult.data ?? []) as TournamentBracketMatch[],
    teams: (teamsResult.data ?? []) as TournamentBracketTeam[],
  });
}

export async function generateDefaultTournamentBracket(): Promise<
  ActionResult<{ tournamentId: string; created: number; skipped: number }>
> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const supabase = (await createClient()) as unknown as SupabaseLooseClient;

  let tournamentId = "";

  const { data: existingTournament, error: fetchTournamentError } = await supabase
    .from("tournaments")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchTournamentError) {
    console.error("[generateDefaultTournamentBracket Fetch Error]", fetchTournamentError);
    return fail("Gagal memeriksa tournament");
  }

  if (existingTournament?.id) {
    tournamentId = existingTournament.id;
  } else {
    const { data: newTournament, error: createTournamentError } = await supabase
      .from("tournaments")
      .insert({
        name: DEFAULT_TOURNAMENT_NAME,
        category: "robot_soccer",
      })
      .select("id")
      .single();

    if (createTournamentError) {
      console.error("[generateDefaultTournamentBracket Create Tournament Error]", createTournamentError);
      return fail("Gagal membuat tournament");
    }

    tournamentId = newTournament.id;
  }

  const { data: existingMatches, error: fetchMatchesError } = await supabase
    .from("tournament_matches")
    .select("match_code")
    .eq("tournament_id", tournamentId);

  if (fetchMatchesError) {
    console.error("[generateDefaultTournamentBracket Fetch Matches Error]", fetchMatchesError);
    return fail("Gagal memeriksa bracket yang sudah ada");
  }

  const existingCodes = new Set(
    (existingMatches ?? []).map((match: { match_code: string }) => match.match_code),
  );
  const rowsToInsert = DEFAULT_BRACKET_MATCHES
    .filter((match) => !existingCodes.has(match.match_code))
    .map((match) => ({
      ...match,
      tournament_id: tournamentId,
      score_a: 0,
      score_b: 0,
      status: "pending",
    }));

  if (rowsToInsert.length === 0) {
    revalidatePath("/tournament/bracket");
    return ok({
      tournamentId,
      created: 0,
      skipped: DEFAULT_BRACKET_MATCHES.length,
    });
  }

  const { error: insertError } = await supabase
    .from("tournament_matches")
    .insert(rowsToInsert);

  if (insertError) {
    console.error("[generateDefaultTournamentBracket Insert Error]", insertError);
    return fail("Gagal membuat bracket default");
  }

  revalidatePath("/tournament/bracket");

  return ok({
    tournamentId,
    created: rowsToInsert.length,
    skipped: DEFAULT_BRACKET_MATCHES.length - rowsToInsert.length,
  });
}

export async function updateTournamentBracketMatch(
  input: unknown,
): Promise<ActionResult<TournamentBracketMatch>> {
  const auth = await requireAuth();
  if (isActionError(auth)) return auth;

  const validationResult = updateTournamentBracketMatchSchema.safeParse(input);
  if (!validationResult.success) {
    return fail(validationResult.error.issues[0]?.message ?? "Validasi gagal");
  }

  const { matchId, teamAId, teamBId, scoreA, scoreB, status } =
    validationResult.data;

  if (teamAId && teamBId && teamAId === teamBId) {
    return fail("Tim A dan Tim B tidak boleh sama");
  }

  const supabase = (await createClient()) as unknown as SupabaseLooseClient;

  let winnerTeamId: string | null = null;
  let winnerLabel: string | null = null;

  if (status === "finished" && scoreA !== scoreB) {
    winnerTeamId = scoreA > scoreB ? teamAId : teamBId;

    if (!winnerTeamId) {
      winnerLabel = scoreA > scoreB ? "Tim A" : "Tim B";
    }
  }

  const { data, error } = await supabase
    .from("tournament_matches")
    .update({
      team_a_id: teamAId,
      team_b_id: teamBId,
      score_a: scoreA,
      score_b: scoreB,
      status,
      winner_team_id: winnerTeamId,
      winner_label: winnerLabel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select(`
      id,
      tournament_id,
      match_code,
      round_name,
      stage,
      side,
      team_a_id,
      team_b_id,
      team_a_label,
      team_b_label,
      score_a,
      score_b,
      winner_team_id,
      winner_label,
      status,
      sort_order,
      source_match_a_id,
      source_match_b_id,
      source_rule_a,
      source_rule_b,
      team_a:tournament_teams!tournament_matches_team_a_id_fkey(id, name, institution),
      team_b:tournament_teams!tournament_matches_team_b_id_fkey(id, name, institution),
      winner_team:tournament_teams!tournament_matches_winner_team_id_fkey(id, name, institution)
    `)
    .single();

  if (error) {
    console.error("[updateTournamentBracketMatch Error]", error);
    return fail("Gagal menyimpan pertandingan bracket");
  }

  revalidatePath("/tournament/bracket");

  return ok(data as TournamentBracketMatch);
}
