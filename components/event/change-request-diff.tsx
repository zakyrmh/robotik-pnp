"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  ChangeRequestData,
  EventRegistration,
  RegistrationChangeRequest,
} from "@/types/event-registration";
import { cn } from "@/lib/utils";

interface Props {
  request: RegistrationChangeRequest;
  current: EventRegistration;
}

const TEAM_FIELD_LABELS: Record<keyof ChangeRequestData["team"], string> = {
  team_name: "Nama Tim",
  institution: "Instansi",
  origin_city: "Kota Asal",
  advisor_name: "Nama Pembina",
  team_email: "Email Tim",
  team_whatsapp: "WhatsApp",
};

function DiffRow({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  const changed = before !== after;
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="w-32 shrink-0 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-xs">
        {changed ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground line-through">
              {before || "—"}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">
              {after || "—"}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{after || "—"}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Tampilan perbandingan (sebelum → sesudah) satu permohonan perbaikan data.
 */
export function ChangeRequestDiff({ request, current }: Props) {
  const { team, members } = request.requested_data;

  const currentTeam: ChangeRequestData["team"] = {
    team_name: current.team_name,
    institution: current.institution,
    origin_city: current.origin_city ?? "",
    advisor_name: current.advisor_name ?? "",
    team_email: current.team_email,
    team_whatsapp: current.team_whatsapp,
  };

  const currentMembers = current.members ?? [];

  return (
    <div className="space-y-4">
      {/* Data Tim */}
      <div>
        <h4 className="mb-1 font-display text-xs font-semibold uppercase tracking-wide text-primary">
          Data Tim
        </h4>
        <div className="divide-y divide-border">
          {(
            Object.keys(
              TEAM_FIELD_LABELS,
            ) as (keyof ChangeRequestData["team"])[]
          ).map((key) => (
            <DiffRow
              key={key}
              label={TEAM_FIELD_LABELS[key]}
              before={currentTeam[key] ?? ""}
              after={team[key] ?? ""}
            />
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Anggota */}
      <div>
        <h4 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-primary">
          Anggota Tim ({currentMembers.length} → {members.length})
        </h4>
        <div className="space-y-2">
          {members.map((m, idx) => {
            const prev = currentMembers[idx];
            const nameChanged = prev && prev.full_name !== m.full_name;
            const roleChanged = prev && prev.role_in_team !== m.role_in_team;
            const photoChanged = prev && prev.photo_url !== m.photo_url;
            const isNew = !prev;

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-md border border-border bg-secondary/20 p-3",
                  isNew && "border-success/30 bg-success-soft/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5 text-xs">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {isNew ? (
                        <span className="font-semibold text-foreground">
                          {m.full_name}
                        </span>
                      ) : nameChanged ? (
                        <>
                          <span className="text-muted-foreground line-through">
                            {prev.full_name}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-foreground">
                            {m.full_name}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-foreground">
                          {m.full_name}
                        </span>
                      )}
                    </span>
                    <span className="block text-micro text-muted-foreground font-mono">
                      {roleChanged ? `${prev.role_in_team} → ` : ""}
                      {m.role_in_team}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-micro font-semibold",
                      isNew
                        ? "border-success/30 bg-success-soft text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {isNew ? "Baru" : "Perbarui"}
                  </Badge>
                </div>

                {photoChanged && prev?.photo_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative size-12 overflow-hidden rounded border border-border bg-background">
                      <Image
                        src={prev.photo_url}
                        alt={`Foto lama ${prev.full_name}`}
                        fill
                        className="object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="relative size-12 overflow-hidden rounded border border-border bg-background">
                      <Image
                        src={m.photo_url}
                        alt={`Foto baru ${m.full_name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-micro text-muted-foreground">
                      Foto diperbarui
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
