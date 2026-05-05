import { Metadata } from "next";
import { GitBranch, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ═══════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════

export const metadata: Metadata = {
  title: "Live Score Contest Robot Soccer - UKM Robotik PNP",
  description:
    "Pantau hasil pertandingan fase grup dan bracket kualifikasi secara real-time.",
};

type GroupStanding = {
  teamId: string;
  teamName: string;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  totalScore: number;
};

type TeamSlot = {
  seed: string;
  label: string;
  score: number;
};

type BracketViewMatch = {
  id: string;
  code: string;
  round: string;
  title: string;
  teamA: TeamSlot;
  teamB: TeamSlot;
  winner: string;
  tone: "blue" | "emerald" | "amber" | "rose";
};

const toneClass = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const stageTone: Record<string, BracketViewMatch["tone"]> = {
  session_2: "blue",
  session_3: "emerald",
  group_g_path: "amber",
  semifinal: "amber",
  final: "rose",
};

const leftSessionTwoCodes = ["RS-S2-A01", "RS-S2-B01", "RS-S2-C01"];
const rightSessionTwoCodes = ["RS-S2-D01", "RS-S2-E01", "RS-S2-F01"];
const leftSessionThreeCodes = ["RS-S3-AB01", "RS-S3-CF01"];
const rightSessionThreeCodes = ["RS-S3-DE01"];
const groupGCodes = ["RS-GP-G01", "RS-GP-G02"];



// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

function seedLabel(label: string | null, fallback: string) {
  if (!label) return fallback;
  if (label.startsWith("Rank 1 Grup "))
    return `${label.replace("Rank 1 Grup ", "")}1`;
  if (label.startsWith("Rank 2 Grup "))
    return `${label.replace("Rank 2 Grup ", "")}2`;
  if (label.startsWith("Pemenang ")) return label.replace("Pemenang ", "");
  if (label.startsWith("Best loser ")) return "Best Loser";
  if (label === "Juara Grup G") return "G1";
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toViewMatch(match: any): BracketViewMatch {
  const teamAName = match.team_a?.name ?? match.team_a_label ?? "Belum diisi";
  const teamBName = match.team_b?.name ?? match.team_b_label ?? "Belum diisi";
  const winnerName =
    match.winner_team?.name ?? match.winner_label ?? "Belum ditentukan";

  return {
    id: match.id,
    code: match.match_code,
    round: match.round_name,
    title: `${seedLabel(match.team_a_label, "A")} vs ${seedLabel(match.team_b_label, "B")}`,
    teamA: {
      seed: seedLabel(match.team_a_label, "A"),
      label: teamAName,
      score: match.score_a ?? 0,
    },
    teamB: {
      seed: seedLabel(match.team_b_label, "B"),
      label: teamBName,
      score: match.score_b ?? 0,
    },
    winner: winnerName,
    tone: stageTone[match.stage] ?? "blue",
  };
}

function pickMatches(
  matchesByCode: Map<string, BracketViewMatch>,
  codes: string[],
) {
  return codes.map((code) => matchesByCode.get(code) ?? createEmptyMatch(code));
}

function createEmptyMatch(code: string): BracketViewMatch {
  return {
    id: code,
    code,
    round: "Belum dibuat",
    title: "Slot belum dibuat",
    teamA: { seed: "A", label: "Belum diisi", score: 0 },
    teamB: { seed: "B", label: "Belum diisi", score: 0 },
    winner: "Belum ditentukan",
    tone: "blue",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStandingsByGroup(groups: any[], matches: any[]) {
  return groups.map((group) => {
    const standingsMap = new Map<string, GroupStanding>();

    for (const team of group.teams || []) {
      standingsMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        points: 0,
        goalDifference: 0,
        goalsFor: 0,
        totalScore: 0,
      });
    }

    for (const match of matches) {
      if (
        match.group_id !== group.id ||
        match.status !== "finished" ||
        !match.team_a_id ||
        !match.team_b_id
      ) {
        continue;
      }

      const teamAStanding = standingsMap.get(match.team_a_id);
      const teamBStanding = standingsMap.get(match.team_b_id);
      if (!teamAStanding || !teamBStanding) continue;

      const scoreA = match.score_a ?? 0;
      const scoreB = match.score_b ?? 0;
      const penaltyA = match.penalty_a ?? 0;
      const penaltyB = match.penalty_b ?? 0;

      teamAStanding.played += 1;
      teamBStanding.played += 1;
      teamAStanding.goalsFor += scoreA;
      teamBStanding.goalsFor += scoreB;
      teamAStanding.goalDifference += scoreA - scoreB;
      teamBStanding.goalDifference += scoreB - scoreA;
      teamAStanding.totalScore += penaltyA;
      teamBStanding.totalScore += penaltyB;

      if (scoreA > scoreB) {
        teamAStanding.points += 3;
      } else if (scoreB > scoreA) {
        teamBStanding.points += 3;
      } else {
        teamAStanding.points += 1;
        teamBStanding.points += 1;
      }
    }

    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      return (
        b.totalScore - a.totalScore ||
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName)
      );
    });

    return {
      groupId: group.id,
      groupName: group.name,
      standings,
    };
  });
}

// ═══════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════

function TeamRow({
  slot,
  winner,
  mirrored = false,
}: {
  slot: TeamSlot;
  winner?: string;
  mirrored?: boolean;
}) {
  const isWinner = slot.label === winner && winner !== "Belum ditentukan";

  return (
    <div
      className={`flex items-center justify-between gap-3 border-t px-4 py-3 ${isWinner ? "bg-emerald-500/10" : ""} ${mirrored ? "flex-row-reverse" : ""}`}
    >
      <div className={`min-w-0 ${mirrored ? "text-right" : ""}`}>
        <p
          className={`truncate text-sm ${isWinner ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-medium"}`}
        >
          {slot.label}
        </p>
        <p className="text-xs text-muted-foreground">{slot.seed}</p>
      </div>
      <div
        className={`flex items-center gap-2 ${mirrored ? "flex-row-reverse" : ""}`}
      >
        <Badge variant="secondary">{slot.seed}</Badge>
        <div
          className={`min-w-8 rounded-md border px-2 py-1 text-center font-mono text-sm font-bold ${isWinner ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-background"}`}
        >
          {slot.score}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  mirrored = false,
}: {
  match: BracketViewMatch;
  mirrored?: boolean;
}) {
  return (
    <Card className="w-65 gap-0 overflow-hidden py-0">
      <div className={`h-1 border-b ${toneClass[match.tone]}`} />
      <CardHeader className="gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className={mirrored ? "text-right" : ""}>
            <CardDescription className="text-xs font-medium uppercase tracking-wide">
              {match.round}
            </CardDescription>
            <CardTitle className="text-sm">{match.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {match.code}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <TeamRow slot={match.teamA} winner={match.winner} mirrored={mirrored} />
        <TeamRow slot={match.teamB} winner={match.winner} mirrored={mirrored} />
        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2">
          <span className="text-xs text-muted-foreground">Winner</span>
          <Badge variant="outline" className={toneClass[match.tone]}>
            {match.winner}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CenterMatchCard({ match }: { match: BracketViewMatch }) {
  return (
    <Card className="w-[320px] gap-0 overflow-hidden border-rose-500/30 py-0 shadow-sm">
      <div className={`h-1 border-b ${toneClass[match.tone]}`} />
      <CardHeader className="px-5 py-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {match.code}
          </Badge>
        </div>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {match.round}
        </CardDescription>
        <CardTitle className="text-base">{match.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <TeamRow slot={match.teamA} winner={match.winner} />
        <TeamRow slot={match.teamB} winner={match.winner} />
        <div className="flex items-center justify-center border-t bg-muted/40 px-4 py-3">
          <Badge variant="outline" className={toneClass[match.tone]}>
            {match.winner}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Connector({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div
      className={`flex w-10 shrink-0 items-center ${mirrored ? "rotate-180" : ""}`}
    >
      <div className="h-px flex-1 bg-border" />
      <div className="h-12 w-px bg-border" />
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function RoundColumn({
  title,
  description,
  align = "left",
  children,
}: {
  title: string;
  description: string;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}) {
  return (
    <section className="shrink-0">
      <div
        className={`mb-3 ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE EXPORT
// ═══════════════════════════════════════════════

export const revalidate = 10; // Auto update data dari database tiap 10 detik

export default async function PublicTournamentPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  // 1. Fetch Group Data
  const { data: groupsData } = await supabase
    .from("groups")
    .select("id, name, teams(id, name)")
    .order("name");

  const { data: groupMatches } = await supabase
    .from("matches")
    .select(
      `id, group_id, team_a_id, team_b_id, score_a, score_b, penalty_a, penalty_b, status, field, created_at, group:groups!matches_group_id_fkey(id, name), team_a:teams!matches_team_a_id_fkey(id, name, group_id), team_b:teams!matches_team_b_id_fkey(id, name, group_id)`,
    )
    .order("created_at", { ascending: true });

  const standingsByGroup = buildStandingsByGroup(
    groupsData ?? [],
    groupMatches ?? [],
  );



  // 2. Fetch Bracket Data
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, category")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: bracketMatchesData } = await supabase
    .from("tournament_matches")
    .select(
      `id, match_code, round_name, stage, side, team_a_id, team_b_id, team_a_label, team_b_label, score_a, score_b, winner_team_id, winner_label, status, sort_order, team_a:tournament_teams!tournament_matches_team_a_id_fkey(id, name), team_b:tournament_teams!tournament_matches_team_b_id_fkey(id, name), winner_team:tournament_teams!tournament_matches_winner_team_id_fkey(id, name)`,
    )
    .eq("tournament_id", tournament?.id)
    .order("sort_order", { ascending: true });

  const matchesByCode = new Map<string, BracketViewMatch>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (bracketMatchesData ?? []).map((match: any) => [
      match.match_code,
      toViewMatch(match),
    ]),
  );

  const leftSessionTwo = pickMatches(matchesByCode, leftSessionTwoCodes);
  const rightSessionTwo = pickMatches(matchesByCode, rightSessionTwoCodes);
  const leftSessionThree = pickMatches(matchesByCode, leftSessionThreeCodes);
  const rightSessionThree = pickMatches(matchesByCode, rightSessionThreeCodes);
  const groupGPath = pickMatches(matchesByCode, groupGCodes);
  const semiFinalOne =
    matchesByCode.get("RS-S4-M01") ?? createEmptyMatch("RS-S4-M01");
  const semiFinalTwo =
    matchesByCode.get("RS-S4-M02") ?? createEmptyMatch("RS-S4-M02");
  const grandFinal =
    matchesByCode.get("RS-FN-001") ?? createEmptyMatch("RS-FN-001");

  return (
    <div className="container mx-auto max-w-[1400px] py-12 px-4 space-y-8">
      {/* Header Halaman */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
          Live Score Contest Robot Soccer PNP
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Pantau klasemen fase grup, jadwal pertandingan, dan bagan kualifikasi
          secara langsung. Data diperbarui otomatis.
        </p>
      </div>

      {/* Navigasi Tabs */}
      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="size-4" />
            Fase Grup
          </TabsTrigger>
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Trophy className="size-4" />
            Bracket Knockout
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Fase Grup */}
        <TabsContent
          value="groups"
          className="mt-6 animate-in fade-in-50 duration-500"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Kolom Tengah: Klasemen */}
            <Card>
              <CardHeader>
                <CardTitle>Kualifikasi Grup</CardTitle>
                <CardDescription>
                  Dua tim dengan poin tertinggi dari setiap grup lolos ke
                  babak selanjutnya.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y px-4">
                  {standingsByGroup.map(
                    ({ groupId, groupName, standings }) => (
                      <div
                        key={groupId}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold">
                            {groupName}
                          </span>
                          <Badge variant="outline">
                            {groupName?.trim()?.toUpperCase()?.endsWith("G")
                              ? "Juara"
                              : "Top 2"}{" "}
                            lolos
                          </Badge>
                        </div>
                        <div className="divide-y rounded-md border overflow-x-auto">
                          {standings.length === 0 ? (
                            <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                              Belum ada tim
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow className="text-[10px] sm:text-xs">
                                  <TableHead className="w-8">#</TableHead>
                                  <TableHead>Tim</TableHead>
                                  <TableHead className="text-center px-2">Gol</TableHead>
                                  <TableHead className="text-center px-2">Poin Akhir</TableHead>
                                  <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {standings.map((standing, index) => {
                                  const isGroupG = groupName
                                    ?.trim()
                                    ?.toUpperCase()
                                    ?.endsWith("G");
                                  const isQualified = isGroupG
                                    ? index < 1
                                    : index < 2;

                                  return (
                                    <TableRow key={standing.teamId} className="text-[11px] sm:text-sm">
                                      <TableCell className="font-medium text-muted-foreground">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell className="font-medium max-w-[140px] truncate sm:max-w-none">
                                        {standing.teamName}
                                      </TableCell>
                                      <TableCell className="text-center px-2">
                                        {standing.goalsFor}
                                      </TableCell>
                                      <TableCell className="text-center font-bold px-2">
                                        {standing.totalScore}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {isQualified ? (
                                          <Badge
                                            variant="success"
                                            className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5"
                                          >
                                            Lolos
                                          </Badge>
                                        ) : null}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Bracket */}
        <TabsContent
          value="bracket"
          className="mt-6 animate-in fade-in-50 duration-500"
        >
          <Card className="min-w-0 border-none shadow-none sm:border-solid sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="size-5 text-blue-600" />
                    Visual Bracket
                  </CardTitle>
                  <CardDescription>
                    Peta perjalanan tim menuju juara.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden px-0 sm:px-6 pb-6">
              <div className="max-w-full overflow-auto rounded-lg border bg-muted/10 p-4">
                <div className="grid min-w-[1500px] grid-cols-[260px_40px_260px_40px_320px_40px_260px_40px_260px] items-center gap-3">
                  <RoundColumn title="Kiri - Sesi 2" description="Grup A, B, C">
                    <div className="space-y-8">
                      {leftSessionTwo.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </RoundColumn>

                  <div className="space-y-24">
                    <Connector />
                    <Connector />
                    <Connector />
                  </div>

                  <RoundColumn
                    title="Kiri - Sesi 3"
                    description="AB ke SF1, CF ke SF2"
                  >
                    <div className="space-y-20">
                      {leftSessionThree.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </RoundColumn>

                  <div className="space-y-40">
                    <Connector />
                    <Connector />
                  </div>

                  <RoundColumn
                    title="Tengah"
                    description="Semi final dan grand final"
                    align="center"
                  >
                    <div className="flex flex-col items-center gap-6">
                      <CenterMatchCard match={semiFinalOne} />
                      <div className="h-8 w-px bg-border" />
                      <CenterMatchCard match={grandFinal} />
                      <div className="h-8 w-px bg-border" />
                      <CenterMatchCard match={semiFinalTwo} />
                    </div>
                  </RoundColumn>

                  <div className="space-y-40">
                    <Connector mirrored />
                    <Connector mirrored />
                  </div>

                  <RoundColumn
                    title="Kanan - Sesi 3"
                    description="DE ke SF1, Grup G ke SF2"
                    align="right"
                  >
                    <div className="space-y-8">
                      {rightSessionThree.map((match) => (
                        <MatchCard key={match.id} match={match} mirrored />
                      ))}

                      <Card className="w-65 gap-2 border-amber-500/30 bg-amber-500/5 py-4">
                        <CardHeader className="px-4 text-right">
                          <CardTitle className="flex items-center justify-end gap-2 text-sm">
                            Jalur Khusus Grup G
                            <Trophy className="size-4 text-amber-600" />
                          </CardTitle>
                          <CardDescription>
                            Juara Grup G melawan best loser S2, lalu best loser
                            S3, lalu masuk Semi Final 2.
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {groupGPath.map((match) => (
                        <MatchCard key={match.id} match={match} mirrored />
                      ))}
                    </div>
                  </RoundColumn>

                  <div className="space-y-24">
                    <Connector mirrored />
                    <Connector mirrored />
                    <Connector mirrored />
                  </div>

                  <RoundColumn
                    title="Kanan - Sesi 2"
                    description="Grup D, E, F"
                    align="right"
                  >
                    <div className="space-y-8">
                      {rightSessionTwo.map((match) => (
                        <MatchCard key={match.id} match={match} mirrored />
                      ))}
                    </div>
                  </RoundColumn>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
