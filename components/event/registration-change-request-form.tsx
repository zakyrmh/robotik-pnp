"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { submitRegistrationChangeRequestAction } from "@/lib/actions/event-registration";
import {
  createEmptyMember,
  uploadMemberImage,
  type MemberFormState,
} from "@/lib/event-member-form";
import { MIN_TEAM_MEMBERS } from "@/lib/schemas/event-registration";
import { validateJuniorBirthDate } from "@/lib/mrc-rules";
import type { EventRegistration } from "@/types/event-registration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Upload, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  registration: EventRegistration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toMemberState(
  m: NonNullable<EventRegistration["members"]>[number],
): MemberFormState {
  return {
    full_name: m.full_name,
    photo_url: m.photo_url,
    identity_card_url: m.identity_card_url ?? "",
    birth_date: m.birth_date ?? "",
    role_in_team: m.role_in_team,
    isUploading: false,
    isUploadingIdCard: false,
  };
}

/**
 * Modal "Ajukan Perbaikan Data" untuk peserta (akses via tiket).
 * Perubahan tidak langsung diterapkan — dikirim sebagai permohonan.
 */
export function RegistrationChangeRequestForm({
  registration,
  open,
  onOpenChange,
}: Props) {
  const isJuniorLineFollower =
    registration.category?.slug === "line-follower-junior";
  const maxMembers = registration.category?.max_team_members ?? 20;

  const [teamName, setTeamName] = useState(registration.team_name);
  const [institution, setInstitution] = useState(registration.institution);
  const [originCity, setOriginCity] = useState(registration.origin_city ?? "");
  const [advisorName, setAdvisorName] = useState(
    registration.advisor_name ?? "",
  );
  const [teamEmail, setTeamEmail] = useState(registration.team_email);
  const [teamWhatsapp, setTeamWhatsapp] = useState(registration.team_whatsapp);
  const [members, setMembers] = useState<MemberFormState[]>(() =>
    registration.members && registration.members.length > 0
      ? registration.members.map(toMemberState)
      : [createEmptyMember("Ketua Tim"), createEmptyMember("Anggota")],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const photoInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const ktmInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const addMember = () => {
    if (members.length >= maxMembers) return;
    setMembers((prev) => [...prev, createEmptyMember("Anggota")]);
  };

  const removeMember = (index: number) => {
    if (members.length <= MIN_TEAM_MEMBERS) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = (
    index: number,
    key: keyof MemberFormState,
    value: string,
  ) => {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const uploadForMember = async (
    index: number,
    file: File,
    kind: "photo" | "identityCard",
  ) => {
    setMembers((prev) => {
      const next = [...prev];
      if (kind === "photo") {
        next[index] = {
          ...next[index],
          isUploading: true,
          uploadError: undefined,
        };
      } else {
        next[index] = {
          ...next[index],
          isUploadingIdCard: true,
          uploadIdCardError: undefined,
        };
      }
      return next;
    });

    try {
      const url = await uploadMemberImage(file, kind);
      setMembers((prev) => {
        const next = [...prev];
        next[index] =
          kind === "photo"
            ? { ...next[index], photo_url: url, isUploading: false }
            : {
                ...next[index],
                identity_card_url: url,
                isUploadingIdCard: false,
              };
        return next;
      });
    } catch (err) {
      const msg = (err as Error).message || "Gagal mengunggah file.";
      setMembers((prev) => {
        const next = [...prev];
        next[index] =
          kind === "photo"
            ? { ...next[index], uploadError: msg, isUploading: false }
            : {
                ...next[index],
                uploadIdCardError: msg,
                isUploadingIdCard: false,
              };
        return next;
      });
    }
  };

  const handleSubmit = () => {
    setError(null);

    if (members.length < MIN_TEAM_MEMBERS) {
      setError(`Minimal ${MIN_TEAM_MEMBERS} anggota tim.`);
      return;
    }
    for (let i = 0; i < members.length; i++) {
      if (!members[i].photo_url) {
        setError(`Pas foto anggota #${i + 1} wajib diunggah.`);
        return;
      }
      if (isJuniorLineFollower) {
        if (!members[i].identity_card_url) {
          setError(`Kartu Pelajar/KK anggota #${i + 1} wajib diunggah.`);
          return;
        }
        if (!members[i].birth_date) {
          setError(`Tanggal lahir anggota #${i + 1} wajib diisi.`);
          return;
        }
        const v = validateJuniorBirthDate(members[i].birth_date);
        if (!v.valid) {
          setError(`Anggota #${i + 1}: ${v.error}`);
          return;
        }
      }
    }

    startTransition(async () => {
      const res = await submitRegistrationChangeRequestAction(
        registration.access_token,
        {
          team_name: teamName,
          institution,
          origin_city: originCity,
          advisor_name: advisorName || undefined,
          team_email: teamEmail,
          team_whatsapp: teamWhatsapp,
          members: members.map((m) => ({
            full_name: m.full_name,
            photo_url: m.photo_url,
            identity_card_url: isJuniorLineFollower
              ? m.identity_card_url
              : undefined,
            birth_date: isJuniorLineFollower ? m.birth_date : undefined,
            role_in_team: m.role_in_team,
          })),
        },
      );

      if (!res.success) {
        setError(res.error || "Gagal mengirim permohonan.");
        return;
      }

      toast.success(
        res.message || "Permohonan perbaikan data terkirim. Menunggu panitia.",
      );
      onOpenChange(false);
    });
  };

  const inputClass =
    "min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            Ajukan Perbaikan Data
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">
              {registration.registration_code}
            </span>{" "}
            · {registration.team_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-md border border-primary/20 bg-primary-soft/60 p-3 text-xs text-foreground">
            Perubahan akan <strong>ditinjau panitia</strong> sebelum diterapkan.
            Pastikan data sudah benar.
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Data Tim */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground border-b border-border pb-2">
              Data Tim &amp; Pembimbing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Nama Tim
                </label>
                <input
                  className={inputClass}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Instansi
                </label>
                <input
                  className={inputClass}
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Kota Asal
                </label>
                <input
                  className={inputClass}
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Nama Pembina
                </label>
                <input
                  className={inputClass}
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Email Tim
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  WhatsApp
                </label>
                <input
                  className={cn(inputClass, "font-mono")}
                  value={teamWhatsapp}
                  onChange={(e) => setTeamWhatsapp(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Anggota */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Anggota Tim ({members.length}/{maxMembers})
              </h3>
              {members.length < maxMembers && (
                <button
                  type="button"
                  onClick={addMember}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Tambah Anggota
                </button>
              )}
            </div>

            {members.map((member, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Anggota #{idx + 1}
                  </span>
                  {members.length > MIN_TEAM_MEMBERS && (
                    <button
                      type="button"
                      onClick={() => removeMember(idx)}
                      aria-label={`Hapus anggota #${idx + 1}`}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 text-micro font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Nama Lengkap
                    </label>
                    <input
                      className={inputClass}
                      value={member.full_name}
                      onChange={(e) =>
                        updateMember(idx, "full_name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Peran di Tim
                    </label>
                    <select
                      className={inputClass}
                      value={member.role_in_team}
                      onChange={(e) =>
                        updateMember(idx, "role_in_team", e.target.value)
                      }
                    >
                      <option value="Ketua Tim">Ketua Tim</option>
                      <option value="Anggota">Anggota</option>
                    </select>
                  </div>
                  {isJuniorLineFollower && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        className={inputClass}
                        value={member.birth_date}
                        onChange={(e) =>
                          updateMember(idx, "birth_date", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Foto */}
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={`Foto anggota #${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <User className="size-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={(el) => {
                      photoInputRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadForMember(idx, f, "photo");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRefs.current[idx]?.click()}
                    disabled={member.isUploading}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {member.isUploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {member.photo_url ? "Ganti Pas Foto" : "Unggah Pas Foto"}
                  </button>
                  {member.uploadError && (
                    <span className="text-micro text-destructive">
                      {member.uploadError}
                    </span>
                  )}
                </div>

                {/* Kartu identitas (khusus junior) */}
                {isJuniorLineFollower && (
                  <div className="flex items-center gap-3">
                    <input
                      ref={(el) => {
                        ktmInputRefs.current[idx] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadForMember(idx, f, "identityCard");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => ktmInputRefs.current[idx]?.click()}
                      disabled={member.isUploadingIdCard}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      {member.isUploadingIdCard ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Upload className="size-3.5" />
                      )}
                      {member.identity_card_url
                        ? "Ganti Kartu Pelajar/KK"
                        : "Unggah Kartu Pelajar/KK"}
                    </button>
                    {member.uploadIdCardError && (
                      <span className="text-micro text-destructive">
                        {member.uploadIdCardError}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Mengirim...
              </>
            ) : (
              "Kirim Permohonan"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
