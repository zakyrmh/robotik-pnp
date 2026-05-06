"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";

import {
  updateTournamentBracketMatch,
  type MatchStatus,
  type TournamentBracketMatch,
  type TournamentBracketTeam,
} from "@/app/actions/tournament.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_TEAM_VALUE = "__empty__";

const statusOptions: Array<{ value: MatchStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

// ── Form inner component — state ini di-reset otomatis tiap kali komponen
//    di-mount ulang (ketika dialog dibuka), tanpa perlu useEffect.
function BracketMatchForm({
  match,
  teams,
  onClose,
}: {
  match: TournamentBracketMatch;
  teams: TournamentBracketTeam[];
  onClose: () => void;
}) {
  const [teamAId, setTeamAId] = useState(match.team_a_id ?? EMPTY_TEAM_VALUE);
  const [teamBId, setTeamBId] = useState(match.team_b_id ?? EMPTY_TEAM_VALUE);
  const [scoreA, setScoreA] = useState(String(match.score_a ?? 0));
  const [scoreB, setScoreB] = useState(String(match.score_b ?? 0));
  const [status, setStatus] = useState<MatchStatus>(match.status ?? "pending");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedScoreA = Number(scoreA);
    const parsedScoreB = Number(scoreB);

    if (!Number.isInteger(parsedScoreA) || parsedScoreA < 0) {
      toast.error("Skor tim A harus berupa angka bulat minimal 0");
      return;
    }

    if (!Number.isInteger(parsedScoreB) || parsedScoreB < 0) {
      toast.error("Skor tim B harus berupa angka bulat minimal 0");
      return;
    }

    const normalizedTeamAId = teamAId === EMPTY_TEAM_VALUE ? null : teamAId;
    const normalizedTeamBId = teamBId === EMPTY_TEAM_VALUE ? null : teamBId;

    startTransition(async () => {
      const result = await updateTournamentBracketMatch({
        matchCode: match.match_code,
        teamAId: normalizedTeamAId,
        teamBId: normalizedTeamBId,
        scoreA: parsedScoreA,
        scoreB: parsedScoreB,
        status,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Pertandingan bracket berhasil disimpan");
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tim A</Label>
          <Select value={teamAId} onValueChange={setTeamAId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih tim A" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              <SelectItem value={EMPTY_TEAM_VALUE}>Belum diisi</SelectItem>
              {teams.map((team) => (
                <SelectItem
                  key={team.id}
                  value={team.id}
                  disabled={team.id === teamBId}
                >
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tim B</Label>
          <Select value={teamBId} onValueChange={setTeamBId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih tim B" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              <SelectItem value={EMPTY_TEAM_VALUE}>Belum diisi</SelectItem>
              {teams.map((team) => (
                <SelectItem
                  key={team.id}
                  value={team.id}
                  disabled={team.id === teamAId}
                >
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Skor Tim A</Label>
          <Input
            min={0}
            type="number"
            value={scoreA}
            onChange={(event) => setScoreA(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Skor Tim B</Label>
          <Input
            min={0}
            type="number"
            value={scoreB}
            onChange={(event) => setScoreB(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as MatchStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Dialog wrapper — hanya mengelola state open/close.
export function BracketMatchEditDialog({
  match,
  teams,
}: {
  match: TournamentBracketMatch;
  teams: TournamentBracketTeam[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Edit ${match.match_code}`}
        >
          <Pencil className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pertandingan</DialogTitle>
          <DialogDescription>
            {match.match_code} - {match.round_name}
          </DialogDescription>
        </DialogHeader>

        {/* key={match.match_code + String(open)} memastikan BracketMatchForm
            di-mount ulang dengan state fresh setiap kali dialog dibuka. */}
        {open && (
          <BracketMatchForm
            key={match.match_code}
            match={match}
            teams={teams}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
