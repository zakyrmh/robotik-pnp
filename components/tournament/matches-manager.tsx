"use client";

/**
 * MatchesManager - form dan daftar pertandingan tournament.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  useRef,
} from "react";
import { Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  addMatch,
  generateGroupMatches,
  getGroups,
  getMatches,
  updateMatchResult,
  type GroupData,
  type MatchField,
  type MatchData,
  type MatchStatus,
} from "@/app/actions/tournament.action";

type MatchDraft = {
  scoreA: string;
  scoreB: string;
  penaltyA: string;
  penaltyB: string;
  status: MatchStatus;
  field: MatchField;
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

const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: "Pending",
  live: "Live",
  finished: "Finished",
};

const STATUS_BADGE_VARIANTS: Record<
  MatchStatus,
  "secondary" | "blue" | "success"
> = {
  pending: "secondary",
  live: "blue",
  finished: "success",
};

const FIELD_LABELS: Record<MatchField, string> = {
  arena_1: "Arena 1",
  arena_2: "Arena 2",
};

export function MatchesManager() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MatchDraft>>({});
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTeamAId, setSelectedTeamAId] = useState("");
  const [selectedTeamBId, setSelectedTeamBId] = useState("");
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const saveTimeoutRefs = useRef<Record<string, number>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [groupsResult, matchesResult] = await Promise.all([
      getGroups({ limit: 100, offset: 0 }),
      getMatches(),
    ]);

    if (groupsResult.error) {
      toast.error(groupsResult.error);
    } else {
      setGroups(groupsResult.data?.groups ?? []);
    }

    if (matchesResult.error) {
      toast.error(matchesResult.error);
    } else {
      const loadedMatches = matchesResult.data?.matches ?? [];
      setMatches(loadedMatches);
      setDrafts(createDrafts(loadedMatches));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId],
  );

  const selectedGroupTeams = selectedGroup?.teams ?? [];

  const expectedMatchesByGroup = useMemo(() => {
    return new Map(
      groups.map((group) => [
        group.id,
        (group.teams.length * (group.teams.length - 1)) / 2,
      ]),
    );
  }, [groups]);

  const createdMatchesByGroup = useMemo(() => {
    const counts = new Map<string, number>();

    for (const match of matches) {
      if (!match.group_id) continue;
      counts.set(match.group_id, (counts.get(match.group_id) ?? 0) + 1);
    }

    return counts;
  }, [matches]);

  const totalExpectedMatches = useMemo(() => {
    return Array.from(expectedMatchesByGroup.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
  }, [expectedMatchesByGroup]);

  const standingsByGroup = useMemo(() => {
    return buildStandingsByGroup(groups, matches);
  }, [groups, matches]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedTeamAId("");
    setSelectedTeamBId("");
  };

  const handleCreateMatch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedGroupId || !selectedTeamAId || !selectedTeamBId) {
      toast.error("Pilih grup, tim A, dan tim B terlebih dahulu");
      return;
    }

    startTransition(async () => {
      const result = await addMatch({
        groupId: selectedGroupId,
        teamAId: selectedTeamAId,
        teamBId: selectedTeamBId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Pertandingan berhasil dibuat");
      setSelectedTeamAId("");
      setSelectedTeamBId("");
      await loadData();
    });
  };

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    const result = await generateGroupMatches();

    if (result.error) {
      toast.error(result.error);
      setIsGenerating(false);
      return;
    }

    const created = result.data?.created ?? 0;
    const skipped = result.data?.skipped ?? 0;

    if (created === 0) {
      toast.info("Semua pertandingan grup sudah dibuat");
    } else {
      toast.success(
        `${created} pertandingan berhasil dibuat otomatis (${skipped} sudah ada)`,
      );
    }

    await loadData();
    setIsGenerating(false);
  };

  const saveMatchResult = async (matchId: string, draft: MatchDraft) => {
    const scoreA = Number(draft.scoreA);
    const scoreB = Number(draft.scoreB);
    const penaltyA = Number(draft.penaltyA);
    const penaltyB = Number(draft.penaltyB);

    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB) ||
      !Number.isInteger(penaltyA) ||
      !Number.isInteger(penaltyB)
    ) {
      toast.error("Skor dan penyesuaian harus berupa angka bulat");
      return;
    }

    setSavingMatchId(matchId);
    const result = await updateMatchResult({
      matchId,
      scoreA,
      scoreB,
      penaltyA,
      penaltyB,
      status: draft.status,
      field: draft.field,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Hasil pertandingan tersimpan otomatis");
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                score_a: scoreA,
                score_b: scoreB,
                penalty_a: penaltyA,
                penalty_b: penaltyB,
                status: draft.status,
                field: draft.field,
              }
            : m,
        ),
      );
    }
    setSavingMatchId(null);
  };

  const handleDraftChange = (
    matchId: string,
    field: keyof MatchDraft,
    value: string,
  ) => {
    setDrafts((prev) => {
      const newDraft = {
        ...prev[matchId],
        [field]: value,
      };

      if (saveTimeoutRefs.current[matchId]) {
        window.clearTimeout(saveTimeoutRefs.current[matchId]);
      }

      saveTimeoutRefs.current[matchId] = window.setTimeout(() => {
        saveMatchResult(matchId, newDraft);
      }, 1500);

      return {
        ...prev,
        [matchId]: newDraft,
      };
    });
  };

  if (isLoading) {
    return <MatchesManagerSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Daftar Pertandingan</h2>
        <p className="text-sm text-muted-foreground">
          Buat pertandingan antar tim dalam grup yang sama dan kelola status
          serta hasilnya.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border p-4 lg:col-span-1">
          <h3 className="mb-4 font-medium">Buat Pertandingan</h3>

          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Grup</Label>
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih grup..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      disabled={group.teams.length < 2}
                    >
                      {group.name} ({group.teams.length} tim)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pilih Tim A</Label>
              <Select
                value={selectedTeamAId}
                onValueChange={setSelectedTeamAId}
                disabled={!selectedGroupId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tim A..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroupTeams.map((team) => (
                    <SelectItem
                      key={team.id}
                      value={team.id}
                      disabled={team.id === selectedTeamBId}
                    >
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pilih Tim B</Label>
              <Select
                value={selectedTeamBId}
                onValueChange={setSelectedTeamBId}
                disabled={!selectedGroupId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tim B..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroupTeams.map((team) => (
                    <SelectItem
                      key={team.id}
                      value={team.id}
                      disabled={team.id === selectedTeamAId}
                    >
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Progress Pertandingan</h3>
                <p className="text-sm text-muted-foreground">
                  {matches.length} dari {totalExpectedMatches} pertandingan
                  sudah dibuat
                </p>
              </div>
              <Badge
                variant={
                  matches.length === totalExpectedMatches
                    ? "success"
                    : "outline"
                }
              >
                {matches.length === totalExpectedMatches
                  ? "Lengkap"
                  : "Belum Lengkap"}
              </Badge>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="mt-4 w-full sm:w-auto"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 size-4" />
              )}
              Auto Generate Pertandingan Grup
            </Button>

            <Separator className="my-4" />

            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((group) => {
                const expected = expectedMatchesByGroup.get(group.id) ?? 0;
                const created = createdMatchesByGroup.get(group.id) ?? 0;

                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                  >
                    <span className="text-sm font-medium">{group.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {created}/{expected} match
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <GroupQualificationStandings standingsByGroup={standingsByGroup} />

          <MatchesTable
            drafts={drafts}
            matches={matches}
            savingMatchId={savingMatchId}
            onDraftChange={handleDraftChange}
          />
        </div>
      </div>
    </div>
  );
}

function GroupQualificationStandings({
  standingsByGroup,
}: {
  standingsByGroup: Array<{
    groupId: string;
    groupName: string;
    standings: GroupStanding[];
  }>;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div>
        <h3 className="font-medium">Kualifikasi Grup</h3>
        <p className="text-sm text-muted-foreground">
          Dua tim dengan poin tertinggi dari setiap grup lolos ke babak
          kualifikasi.
        </p>
      </div>

      <Separator className="my-4" />

      <div className="grid gap-4 xl:grid-cols-2">
        {standingsByGroup.map(({ groupId, groupName, standings }) => (
          <div key={groupId} className="rounded-md border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{groupName}</span>
              <Badge variant="outline">Top 2 lolos</Badge>
            </div>
            <div className="divide-y overflow-x-auto">
              {standings.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  Belum ada tim di grup ini
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Tim</TableHead>
                      <TableHead className="text-center">Gol</TableHead>
                      <TableHead className="text-center">Poin Akhir</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((standing, index) => (
                      <TableRow key={standing.teamId}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {standing.teamName}
                        </TableCell>
                        <TableCell className="text-center">
                          {standing.goalsFor}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {standing.totalScore}
                        </TableCell>
                        <TableCell className="text-right">
                          {index < 2 && <Badge variant="success">Lolos</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchesTable({
  drafts,
  matches,
  savingMatchId,
  onDraftChange,
}: {
  drafts: Record<string, MatchDraft>;
  matches: MatchData[];
  savingMatchId: string | null;
  onDraftChange: (
    matchId: string,
    field: keyof MatchDraft,
    value: string,
  ) => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>Belum ada pertandingan yang dibuat</p>
      </div>
    );
  }

  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

    return dateA - dateB;
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grup</TableHead>
            <TableHead>Pertandingan</TableHead>
            <TableHead className="w-35">Arena</TableHead>
            <TableHead className="w-45">Status</TableHead>
            <TableHead className="w-40 text-center">Skor & Poin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMatches.map((match) => {
            const draft = drafts[match.id];
            const status = draft?.status ?? "pending";
            const field = draft?.field ?? "arena_1";

            return (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.group?.name ?? "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>
                      {match.team_a?.name ?? "-"} vs {match.team_b?.name ?? "-"}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANTS[status]}>
                      {STATUS_LABELS[status]} - {FIELD_LABELS[field]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={field}
                    onValueChange={(value) =>
                      onDraftChange(match.id, "field", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arena_1">Arena 1</SelectItem>
                      <SelectItem value="arena_2">Arena 2</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      onDraftChange(match.id, "status", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs text-muted-foreground">Gol</span>
                      <Input
                        min={0}
                        type="number"
                        value={draft?.scoreA ?? "0"}
                        onChange={(event) =>
                          onDraftChange(match.id, "scoreA", event.target.value)
                        }
                        className="h-8 w-14"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        min={0}
                        type="number"
                        value={draft?.scoreB ?? "0"}
                        onChange={(event) =>
                          onDraftChange(match.id, "scoreB", event.target.value)
                        }
                        className="h-8 w-14"
                      />
                      {savingMatchId === match.id && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs text-muted-foreground">Poin</span>
                      <Input
                        type="number"
                        value={draft?.penaltyA ?? "0"}
                        onChange={(event) =>
                          onDraftChange(match.id, "penaltyA", event.target.value)
                        }
                        className="h-8 w-14"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        value={draft?.penaltyB ?? "0"}
                        onChange={(event) =>
                          onDraftChange(match.id, "penaltyB", event.target.value)
                        }
                        className="h-8 w-14"
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MatchesManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border p-4 lg:col-span-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border p-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-3 h-20 w-full" />
          </div>
          <div className="rounded-lg border p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-3 h-8 w-full" />
            <Skeleton className="mt-3 h-8 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function createDrafts(matches: MatchData[]) {
  return matches.reduce<Record<string, MatchDraft>>((acc, match) => {
    acc[match.id] = {
      scoreA: String(match.score_a ?? 0),
      scoreB: String(match.score_b ?? 0),
      penaltyA: String(match.penalty_a ?? 0),
      penaltyB: String(match.penalty_b ?? 0),
      status: match.status ?? "pending",
      field: match.field ?? "arena_1",
    };

    return acc;
  }, {});
}

function buildStandingsByGroup(groups: GroupData[], matches: MatchData[]) {
  return groups.map((group) => {
    const standingsMap = new Map<string, GroupStanding>();

    for (const team of group.teams) {
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
