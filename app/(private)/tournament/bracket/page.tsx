import { GitBranch, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import {
  getTournamentBracket,
  type TournamentBracketMatch,
  type TournamentBracketTeam,
} from "@/app/actions/tournament.action";
import { BracketMatchEditDialog } from "@/components/tournament/bracket-match-edit-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  rawMatch: TournamentBracketMatch;
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

const leftSessionTwoCodes = ["RS-S2-A01", "RS-S2-B01", "RS-S2-C01"];
const rightSessionTwoCodes = ["RS-S2-D01", "RS-S2-E01", "RS-S2-F01"];
const leftSessionThreeCodes = ["RS-S3-AB01", "RS-S3-CF01"];
const rightSessionThreeCodes = ["RS-S3-DE01"];
const groupGCodes = ["RS-GP-G01", "RS-GP-G02"];

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

function toViewMatch(match: TournamentBracketMatch): BracketViewMatch {
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
    rawMatch: match,
  };
}

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
    rawMatch: {
      id: code,
      tournament_id: "",
      match_code: code,
      round_name: "Slot belum dibuat",
      stage: "",
      side: "",
      team_a_id: null,
      team_b_id: null,
      team_a_label: null,
      team_b_label: null,
      score_a: 0,
      score_b: 0,
      winner_team_id: null,
      winner_label: null,
      status: "pending",
      sort_order: 0,
      source_match_a_id: null,
      source_match_b_id: null,
      source_rule_a: null,
      source_rule_b: null,
    },
  };
}

function MatchCard({
  match,
  teams,
  mirrored = false,
}: {
  match: BracketViewMatch;
  teams: TournamentBracketTeam[];
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
            <BracketMatchEditDialog match={match.rawMatch} teams={teams} />
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

function CenterMatchCard({
  match,
  teams,
}: {
  match: BracketViewMatch;
  teams: TournamentBracketTeam[];
}) {
  return (
    <Card className="w-[320px] gap-0 overflow-hidden border-rose-500/30 py-0 shadow-sm">
      <div className={`h-1 border-b ${toneClass[match.tone]}`} />
      <CardHeader className="px-5 py-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {match.code}
          </Badge>
          <BracketMatchEditDialog match={match.rawMatch} teams={teams} />
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

export default async function TournamentBracketPage() {
  const supabase = await createClient();

  const { data: groupsData } = await supabase
    .from("groups")
    .select("id, name, teams(id, name)")
    .order("name");

  const { data: groupMatches } = await supabase
    .from("matches")
    .select(
      `id, group_id, team_a_id, team_b_id, score_a, score_b, penalty_a, penalty_b, status`,
    );

  const standingsByGroup = buildStandingsByGroup(
    groupsData ?? [],
    groupMatches ?? [],
  );

  const [bracketResult, allTeamsResult] = await Promise.all([
    getTournamentBracket(),
    supabase
      .from("teams")
      .select("id, name, group:groups(name)")
      .order("name", { ascending: true }),
  ]);

  const matches = bracketResult.data?.matches ?? [];

  // Buat daftar tim dengan nama grup untuk dropdown form edit
  type RawTeam = { id: string; name: string; group: { name: string } | null };
  const teams: { id: string; name: string; institution: string | null }[] = (
    (allTeamsResult.data ?? []) as RawTeam[]
  ).map((t) => ({
    id: t.id,
    name: t.group?.name ? `${t.name} (${t.group.name})` : t.name,
    institution: null,
  }));

  console.log("[BracketPage] teams fetched:", teams.length, teams.map((t) => t.name));

  const matchesByCode = new Map(
    matches.map((match) => [match.match_code, toViewMatch(match)]),
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <GitBranch className="size-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tournament Bracket
            </h1>
            <p className="text-sm text-muted-foreground">
              Bracket custom robot soccer 7 grup dan 26 tim dari database
              Supabase.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {bracketResult.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {bracketResult.error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-emerald-600" />
                  Tim Lolos Fase Grup
                </CardTitle>
                <CardDescription>
                  2 tim dengan poin akhir tertinggi dari setiap grup.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {standingsByGroup.map((group) => {
                const isGroupG = group.groupName
                  ?.trim()
                  ?.toUpperCase()
                  ?.endsWith("G");
                const qualifiedTeams = group.standings.slice(0, 2);

                return (
                  <div
                    key={group.groupId}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-sm">
                        {group.groupName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {isGroupG ? "Top 1 (Group G)" : "Top 2"}
                      </Badge>
                    </div>
                    {qualifiedTeams.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Belum ada data
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {qualifiedTeams.map((team, idx) => (
                          <div
                            key={team.teamId}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-xs font-bold text-muted-foreground w-3 shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="text-sm truncate font-medium">
                                {team.teamName}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="font-mono text-[10px] ml-2 shrink-0"
                            >
                              {team.totalScore} pt
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Visual Bracket</CardTitle>
                <CardDescription>
                  Data diambil dari tabel tournament_matches. Penempatan tim
                  pada slot pertama diatur secara manual.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="w-fit">
                  {bracketResult.data?.tournament?.name ??
                    "Belum ada tournament"}
                </Badge>
                <Badge variant="success" className="w-fit">
                  {matches.length} Match
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-w-0 overflow-hidden px-5">
            <div className="max-h-[calc(100vh-260px)] max-w-full overflow-auto rounded-lg border bg-muted/20 p-4">
              <div className="grid min-w-415 grid-cols-[260px_40px_260px_40px_320px_40px_260px_40px_260px] items-center gap-3">
                <RoundColumn title="Kiri - Sesi 2" description="Grup A, B, C">
                  <div className="space-y-8">
                    {leftSessionTwo.map((match) => (
                      <MatchCard key={match.id} match={match} teams={teams} />
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
                      <MatchCard key={match.id} match={match} teams={teams} />
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
                    <CenterMatchCard match={semiFinalOne} teams={teams} />
                    <div className="h-8 w-px bg-border" />
                    <CenterMatchCard match={grandFinal} teams={teams} />
                    <div className="h-8 w-px bg-border" />
                    <CenterMatchCard match={semiFinalTwo} teams={teams} />
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
                      <MatchCard
                        key={match.id}
                        match={match}
                        teams={teams}
                        mirrored
                      />
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
                      <MatchCard
                        key={match.id}
                        match={match}
                        teams={teams}
                        mirrored
                      />
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
                      <MatchCard
                        key={match.id}
                        match={match}
                        teams={teams}
                        mirrored
                      />
                    ))}
                  </div>
                </RoundColumn>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
