"use client";

/**
 * VerifikasiManager — Review & verifikasi pendaftaran caang.
 *
 * Fitur:
 * - Filter status: submitted / revision / accepted / rejected / all
 * - Statistik pending vs accepted vs rejected
 * - Daftar kartu pendaftar dengan biodata ringkas
 * - Detail modal: biodata, dokumen (preview), pembayaran
 * - Aksi: Terima, Tolak, Minta Revisi (dengan catatan & field revisi)
 */

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Filter,
  Loader2,
  Eye,
  X,
  Search,
  Phone,
  MapPin,
  CalendarDays,
  GraduationCap,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getRegistrations, verifyRegistration } from "@/app/actions/or.action";
import type {
  OrRegistrationWithUser,
  OrRegistrationStatus,
} from "@/lib/db/schema/or";
import {
  OR_REGISTRATION_STATUS_LABELS,
  OR_REGISTRATION_STEP_LABELS,
} from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════

const STATUS_COLORS: Record<OrRegistrationStatus, string> = {
  draft: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25",
  submitted: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  revision: "bg-orange-500/15 text-orange-600 border-orange-500/25",
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  rejected: "bg-red-500/15 text-red-600 border-red-500/25",
  training: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  interview_1: "bg-purple-500/15 text-purple-600 border-purple-500/25",
  project_phase: "bg-indigo-500/15 text-indigo-600 border-indigo-500/25",
  interview_2: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/25",
  graduated: "bg-emerald-600/20 text-emerald-700 border-emerald-600/30 font-bold",
};

const REVISION_FIELD_OPTIONS = [
  { value: "photo_url", label: "Pas Foto" },
  { value: "ktm_url", label: "KTM" },
  { value: "ig_follow_url", label: "Bukti Follow IG Robotik" },
  { value: "ig_mrc_url", label: "Bukti Follow IG MRC" },
  { value: "yt_sub_url", label: "Bukti Subscribe YT" },
  { value: "payment_url", label: "Bukti Pembayaran" },
  { value: "motivation", label: "Motivasi" },
  { value: "phone", label: "No HP" },
  { value: "address_domicile", label: "Alamat" },
];

interface Props {
  initialRegistrations: OrRegistrationWithUser[];
}

export function VerifikasiManager({ initialRegistrations }: Props) {
  const [isPending, startTransition] = useTransition();
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [filterStatus, setFilterStatus] = useState<string>("submitted");
  const [searchText, setSearchText] = useState("");
  const [selectedReg, setSelectedReg] = useState<OrRegistrationWithUser | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Verification form
  const [verifyNotes, setVerifyNotes] = useState("");
  const [revisionFields, setRevisionFields] = useState<string[]>([]);
  const [showVerifyForm, setShowVerifyForm] = useState<
    "accept" | "reject" | "revision" | null
  >(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: OrRegistrationStatus; search?: string } = {};
      if (filterStatus !== "all")
        filters.status = filterStatus as OrRegistrationStatus;
      if (searchText) filters.search = searchText;
      const result = await getRegistrations(filters);
      setRegistrations(result.data ?? []);
    });
  };

  const handleFilter = () => reload();

  const handleVerify = (decision: "accepted" | "rejected" | "revision") => {
    if (!selectedReg) return;
    startTransition(async () => {
      const result = await verifyRegistration(
        selectedReg.id,
        decision,
        verifyNotes || undefined,
        decision === "revision" ? revisionFields : undefined,
      );
      if (result.error) {
        showFeedback("error", result.error);
      } else {
        const labels = {
          accepted: "diterima",
          rejected: "ditolak",
          revision: "diminta revisi",
        };
        showFeedback(
          "success",
          `Pendaftaran ${selectedReg.full_name} ${labels[decision]}.`,
        );
        setSelectedReg(null);
        setShowVerifyForm(null);
        setVerifyNotes("");
        setRevisionFields([]);
        reload();
      }
    });
  };

  const toggleRevisionField = (field: string) => {
    setRevisionFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  // Stats
  const submittedCount = registrations.filter(
    (r) => r.status === "submitted",
  ).length;
  const revisionCount = registrations.filter(
    (r) => r.status === "revision",
  ).length;

  // Display
  const displayList =
    searchText && filterStatus === "all"
      ? registrations.filter((r) => {
          const q = searchText.toLowerCase();
          return (
            r.full_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
          );
        })
      : registrations;

  return (
    <div className="space-y-4">
      {/* Alert */}
      {submittedCount > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <strong>{submittedCount}</strong> pendaftar menunggu verifikasi
          {revisionCount > 0 && (
            <span>
              {" "}
              · <strong>{revisionCount}</strong> menunggu revisi ulang
            </span>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Status
          </Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(OR_REGISTRATION_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari nama / email..."
            className="w-[200px] h-9 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={handleFilter}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Filter className="size-3" />
          )}
          Filter
        </Button>
      </div>

      {/* Daftar */}
      {displayList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada pendaftar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayList.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border bg-card shadow-sm overflow-hidden hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Avatar */}
                <div className="size-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0">
                  {(r.full_name || "?").charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{r.full_name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_COLORS[r.status]}`}
                    >
                      {OR_REGISTRATION_STATUS_LABELS[r.status]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-sky-500/15 text-sky-600 border-sky-500/25"
                    >
                      {OR_REGISTRATION_STEP_LABELS[r.current_step]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                    <span>{r.email}</span>
                    {r.nim && <span>NIM: {r.nim}</span>}
                    {r.study_program_name && (
                      <span>{r.study_program_name}</span>
                    )}
                    {r.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone className="size-2.5" /> {r.phone}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedReg(r);
                      setShowVerifyForm(null);
                    }}
                  >
                    <Eye className="size-3" /> Detail
                  </Button>
                  {(r.status === "submitted" || r.status === "revision") && (
                    <>
                      <Button
                        size="sm"
                        className="text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setSelectedReg(r);
                          setShowVerifyForm("accept");
                        }}
                      >
                        <CheckCircle2 className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs cursor-pointer border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                        onClick={() => {
                          setSelectedReg(r);
                          setShowVerifyForm("revision");
                        }}
                      >
                        <RotateCcw className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs cursor-pointer border-red-500/30 text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          setSelectedReg(r);
                          setShowVerifyForm("reject");
                        }}
                      >
                        <XCircle className="size-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Revision fields info */}
              {r.status === "revision" &&
                r.revision_fields &&
                r.revision_fields.length > 0 && (
                  <div className="px-4 py-2 border-t bg-orange-500/5 text-xs text-orange-600">
                    <strong>Revisi:</strong>{" "}
                    {r.revision_fields
                      .map(
                        (f) =>
                          REVISION_FIELD_OPTIONS.find((o) => o.value === f)
                            ?.label ?? f,
                      )
                      .join(", ")}
                    {r.verification_notes && (
                      <span className="ml-2 italic">
                        &quot;{r.verification_notes}&quot;
                      </span>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReg && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedReg(null);
            setShowVerifyForm(null);
          }}
        >
          <div
            className="bg-card rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b px-5 py-3 flex items-center justify-between z-10">
              <div>
                <p className="font-semibold">{selectedReg.full_name}</p>
                <div className="flex gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${STATUS_COLORS[selectedReg.status]}`}
                  >
                    {OR_REGISTRATION_STATUS_LABELS[selectedReg.status]}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReg(null);
                  setShowVerifyForm(null);
                }}
                className="cursor-pointer p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm">
              {/* Biodata */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Data Diri
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nama:</span>{" "}
                    {selectedReg.full_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Panggilan:</span>{" "}
                    {selectedReg.nickname ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedReg.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />{" "}
                    {selectedReg.phone ?? "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3 text-muted-foreground" />{" "}
                    {selectedReg.address_domicile ?? "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="size-3 text-muted-foreground" />{" "}
                    {selectedReg.birth_place ?? "—"},{" "}
                    {selectedReg.birth_date ?? "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="size-3 text-muted-foreground" />{" "}
                    NIM: {selectedReg.nim ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prodi:</span>{" "}
                    {selectedReg.study_program_name ?? "—"} (
                    {selectedReg.major_name ?? "—"})
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tahun Masuk:</span>{" "}
                    {selectedReg.year_enrolled ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{" "}
                    {selectedReg.gender === "L"
                      ? "Laki-laki"
                      : selectedReg.gender === "P"
                        ? "Perempuan"
                        : "—"}
                  </div>
                </div>
              </div>

              {/* Motivasi */}
              {selectedReg.motivation && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Motivasi
                  </h3>
                  <p className="text-xs bg-muted/30 p-2 rounded-md">
                    {selectedReg.motivation}
                  </p>
                </div>
              )}
              {selectedReg.org_experience && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Pengalaman Organisasi
                  </h3>
                  <p className="text-xs bg-muted/30 p-2 rounded-md">
                    {selectedReg.org_experience}
                  </p>
                </div>
              )}
              {selectedReg.achievements && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Prestasi
                  </h3>
                  <p className="text-xs bg-muted/30 p-2 rounded-md">
                    {selectedReg.achievements}
                  </p>
                </div>
              )}

              {/* Dokumen */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Dokumen
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {
                      label: "Pas Foto",
                      url: selectedReg.photo_url,
                      required: true,
                    },
                    { label: "KTM", url: selectedReg.ktm_url, required: false },
                    {
                      label: "Follow IG Robotik",
                      url: selectedReg.ig_follow_url,
                      required: true,
                    },
                    {
                      label: "Follow IG MRC",
                      url: selectedReg.ig_mrc_url,
                      required: true,
                    },
                    {
                      label: "Subscribe YT",
                      url: selectedReg.yt_sub_url,
                      required: true,
                    },
                  ].map((doc) => (
                    <div
                      key={doc.label}
                      className="rounded-lg border p-2 space-y-1.5"
                    >
                      <p className="text-[10px] text-muted-foreground text-center">
                        {doc.label}
                        {!doc.required && " (opsional)"}
                      </p>
                      {doc.url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(doc.url)}
                          className="cursor-pointer w-full block group relative rounded overflow-hidden border bg-muted"
                          title={`Perbesar: ${doc.label}`}
                        >
                          <Image
                            src={doc.url}
                            alt={doc.label}
                            width={300}
                            height={300}
                            unoptimized
                            className="w-full h-20 object-cover transition-opacity group-hover:opacity-70"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <Eye className="size-4 text-white drop-shadow" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center rounded border border-dashed bg-muted/30">
                          <span className="text-[10px] text-red-500">
                            Belum upload
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pembayaran */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Pembayaran
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Metode:</span>{" "}
                    {selectedReg.payment_method ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nominal:</span>{" "}
                    {selectedReg.payment_amount
                      ? `Rp ${selectedReg.payment_amount.toLocaleString("id-ID")}`
                      : "—"}
                  </div>
                </div>
                {selectedReg.payment_url ? (
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(selectedReg.payment_url)}
                    className="cursor-pointer mt-2 block w-full group relative rounded-lg overflow-hidden border bg-muted"
                    title="Perbesar: Bukti Pembayaran"
                  >
                    <Image
                      src={selectedReg.payment_url}
                      alt="Bukti Pembayaran"
                      width={400}
                      height={400}
                      unoptimized
                      className="w-full h-24 object-cover transition-opacity group-hover:opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <Eye className="size-4 text-white drop-shadow" />
                    </div>
                  </button>
                ) : (
                  <p className="text-xs text-red-500 mt-1">
                    Belum upload bukti bayar
                  </p>
                )}
              </div>

              {/* Catatan verifikasi sebelumnya */}
              {selectedReg.verification_notes && (
                <div className="border-l-2 border-amber-400 pl-3 text-xs">
                  <p className="font-medium text-amber-600">
                    Catatan sebelumnya:
                  </p>
                  <p>{selectedReg.verification_notes}</p>
                </div>
              )}

              {/* Verification actions */}
              {(selectedReg.status === "submitted" ||
                selectedReg.status === "revision") && (
                <div className="border-t pt-3 space-y-3">
                  {!showVerifyForm && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setShowVerifyForm("accept")}
                      >
                        <CheckCircle2 className="size-3" /> Terima
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                        onClick={() => setShowVerifyForm("revision")}
                      >
                        <RotateCcw className="size-3" /> Minta Revisi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer border-red-500/30 text-red-600 hover:bg-red-500/10"
                        onClick={() => setShowVerifyForm("reject")}
                      >
                        <XCircle className="size-3" /> Tolak
                      </Button>
                    </div>
                  )}

                  {showVerifyForm && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 bg-muted/20 rounded-lg p-3">
                      <Label className="text-xs font-semibold">
                        {showVerifyForm === "accept"
                          ? "✅ Terima Pendaftaran"
                          : showVerifyForm === "reject"
                            ? "❌ Tolak Pendaftaran"
                            : "🔄 Minta Revisi"}
                      </Label>

                      {showVerifyForm === "revision" && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Field yang perlu direvisi:
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {REVISION_FIELD_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleRevisionField(opt.value)}
                                className={`cursor-pointer text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                  revisionFields.includes(opt.value)
                                    ? "bg-orange-500/20 text-orange-600 border-orange-500/30"
                                    : "bg-background hover:bg-accent"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Catatan
                        </Label>
                        <Textarea
                          value={verifyNotes}
                          onChange={(e) => setVerifyNotes(e.target.value)}
                          placeholder={
                            showVerifyForm === "accept"
                              ? "Catatan (opsional)..."
                              : showVerifyForm === "reject"
                                ? "Alasan penolakan..."
                                : "Instruksi revisi..."
                          }
                          className="min-h-[60px] text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleVerify(
                              showVerifyForm === "accept"
                                ? "accepted"
                                : showVerifyForm === "reject"
                                  ? "rejected"
                                  : "revision",
                            )
                          }
                          disabled={isPending}
                          className={`cursor-pointer text-xs ${
                            showVerifyForm === "accept"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : showVerifyForm === "reject"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-orange-600 hover:bg-orange-700"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : showVerifyForm === "accept" ? (
                            <CheckCircle2 className="size-3" />
                          ) : showVerifyForm === "reject" ? (
                            <XCircle className="size-3" />
                          ) : (
                            <RotateCcw className="size-3" />
                          )}
                          Konfirmasi
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowVerifyForm(null);
                            setVerifyNotes("");
                            setRevisionFields([]);
                          }}
                          className="cursor-pointer text-xs"
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview image */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <Image
              src={previewUrl}
              alt="Preview dokumen"
              width={1200}
              height={1200}
              unoptimized
              className="rounded-lg max-h-[80vh] w-auto h-auto object-contain"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-black/50 text-white border-white/20 cursor-pointer"
              onClick={() => setPreviewUrl(null)}
            >
              ✕ Tutup
            </Button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
            feedback.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

export function VerifikasiSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
