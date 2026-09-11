"use client";

import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import {
  uploadMemberPhotoAction,
  uploadMemberIdentityCardAction,
  registerEventAction,
} from "@/lib/actions/event-registration";
import {
  MRC_ACCEPT_ATTR,
  MRC_ALLOWED_EXTENSIONS,
  MRC_MAX_RAW_BYTES,
  mrcMaxRawLabel,
  type MrcImageKind,
} from "@/lib/mrc-image-config";
import type {
  EventCategory,
  EventRulesVersion,
  RegistrationBatch,
} from "@/types/event-registration";
import { BATCH_LABELS } from "@/lib/event-batch";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  FileText,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import indonesiaCitiesData from "@/lib/data/indonesia-cities.json";

interface RegisterFormProps {
  category: EventCategory;
  rulesVersion?: EventRulesVersion | null;
  /** Batch aktif saat form dibuka (ditentukan server dari event_settings). */
  activeBatch?: RegistrationBatch | null;
  /** Nominal efektif yang akan ditagihkan (ditentukan server). */
  activeFee?: number | null;
}

interface MemberFormState {
  full_name: string;
  photo_url: string;
  identity_card_url: string;
  birth_date: string;
  role_in_team: string;
  isUploading: boolean;
  uploadError?: string;
  isUploadingIdCard: boolean;
  uploadIdCardError?: string;
}

/**
 * Validasi client-side (UX cepat) — BUKAN pengganti validasi server.
 * Server selalu memvalidasi ulang berbasis magic bytes via `file-type`,
 * karena `File.type`/ekstensi dari browser mudah dipalsukan.
 */
function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : "";
}

function isHeicFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  const type = (file.type || "").toLowerCase();
  return (
    ext === ".heic" ||
    ext === ".heif" ||
    type.includes("heic") ||
    type.includes("heif")
  );
}

function validateImageFileClient(
  file: File,
  kind: MrcImageKind,
): string | null {
  const label = kind === "photo" ? "Pas foto" : "Foto kartu identitas";
  if (file.size === 0) return `${label} kosong atau tidak terbaca.`;
  if (file.size > MRC_MAX_RAW_BYTES[kind]) {
    return `${label} melebihi batas ${mrcMaxRawLabel(kind)}. Silakan pilih file yang lebih kecil.`;
  }
  if (file.type && !file.type.toLowerCase().startsWith("image/")) {
    return `${label} harus berupa file gambar (JPG, PNG, WebP, atau HEIC).`;
  }
  const ext = getFileExtension(file.name);
  if (ext && !(MRC_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `${label} berekstensi "${ext}" yang tidak didukung. Gunakan JPG, PNG, WebP, atau HEIC.`;
  }
  return null;
}

/** Konversi HEIC/HEIF (foto iPhone) → JPEG via `heic2any` sebelum kompresi. */
async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    throw new Error(
      "Gagal mengonversi foto iPhone (HEIC). Silakan pilih file JPG/PNG manual.",
    );
  }
}

/**
 * Kompresi RINGAN client-side: resize kasar + turunkan ukuran agar upload
 * cepat dan hemat bandwidth. Kompresi final yang kanonis dilakukan server
 * via `sharp` (convert ke WebP + varian thumbnail).
 */
async function compressLightly(file: File, kind: MrcImageKind): Promise<File> {
  const normalized = await convertHeicToJpegIfNeeded(file);
  try {
    const compressed = await imageCompression(normalized, {
      maxSizeMB: kind === "photo" ? 1 : 1.5,
      maxWidthOrHeight: kind === "photo" ? 1280 : 1920,
      useWebWorker: true,
    });
    const targetName =
      (compressed as File)?.name || normalized.name || "photo.jpg";
    return new File([compressed], targetName, {
      type: compressed.type || normalized.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // Gagal kompres bukan fatal — kirim file ternormalisasi, server yang menangani.
    return normalized;
  }
}

export function RegistrationForm({
  category,
  rulesVersion,
  activeBatch,
  activeFee,
}: RegisterFormProps) {
  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamWhatsapp, setTeamWhatsapp] = useState("");
  const [acceptRules, setAcceptRules] = useState(false);

  const isLineFollower =
    category.slug === "line-follower-senior" ||
    category.slug === "line-follower-junior";

  const [members, setMembers] = useState<MemberFormState[]>([
    {
      full_name: "",
      photo_url: "",
      identity_card_url: "",
      birth_date: "",
      role_in_team: "Ketua Tim",
      isUploading: false,
      isUploadingIdCard: false,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [cityOpen, setCityOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    registrationCode: string;
    accessToken: string;
  } | null>(null);

  const addMember = () => {
    if (members.length >= category.max_team_members) return;
    setMembers([
      ...members,
      {
        full_name: "",
        photo_url: "",
        identity_card_url: "",
        birth_date: "",
        role_in_team: "Anggota",
        isUploading: false,
        isUploadingIdCard: false,
      },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (
    index: number,
    key: keyof MemberFormState,
    value: string,
  ) => {
    const next = [...members];
    next[index] = { ...next[index], [key]: value };
    setMembers(next);
  };

  const uploadImageForMember = async (
    index: number,
    file: File,
    kind: MrcImageKind,
  ) => {
    const next = [...members];
    if (kind === "photo") {
      next[index].isUploading = true;
      next[index].uploadError = undefined;
    } else {
      next[index].isUploadingIdCard = true;
      next[index].uploadIdCardError = undefined;
    }
    setMembers([...next]);

    const setUploadError = (message: string) => {
      if (kind === "photo") next[index].uploadError = message;
      else next[index].uploadIdCardError = message;
    };

    try {
      const clientError = validateImageFileClient(file, kind);
      if (clientError) {
        setUploadError(clientError);
        return;
      }

      const lightFile = await compressLightly(file, kind);

      const formData = new FormData();
      formData.append("file", lightFile);

      const res =
        kind === "photo"
          ? await uploadMemberPhotoAction(formData)
          : await uploadMemberIdentityCardAction(formData);

      if (res.success) {
        if (kind === "photo") next[index].photo_url = res.data;
        else next[index].identity_card_url = res.data;
      } else {
        setUploadError(res.error || "Gagal mengunggah file.");
      }
    } catch (err: unknown) {
      setUploadError((err as Error).message || "Gagal memproses file.");
    } finally {
      if (kind === "photo") next[index].isUploading = false;
      else next[index].isUploadingIdCard = false;
      setMembers([...next]);
    }
  };

  const handlePhotoUpload = (index: number, file: File) =>
    uploadImageForMember(index, file, "photo");

  const handleIdentityCardUpload = (index: number, file: File) =>
    uploadImageForMember(index, file, "identityCard");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Validate photos, identity cards, and birth date
    for (let i = 0; i < members.length; i++) {
      if (!members[i].photo_url) {
        setErrorMessage(
          `Pas foto untuk anggota #${i + 1} (${members[i].full_name || "Anggota"}) wajib diunggah.`,
        );
        return;
      }
      if (isLineFollower) {
        if (!members[i].identity_card_url) {
          setErrorMessage(
            `Foto Kartu Pelajar / Kartu Keluarga untuk anggota #${i + 1} (${members[i].full_name || "Anggota"}) wajib diunggah.`,
          );
          return;
        }
        if (!members[i].birth_date) {
          setErrorMessage(
            `Tanggal lahir untuk anggota #${i + 1} (${members[i].full_name || "Anggota"}) wajib diisi untuk verifikasi umur.`,
          );
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const res = await registerEventAction({
        category_id: category.id,
        team_name: teamName,
        institution,
        origin_city: originCity,
        advisor_name: advisorName || undefined,
        team_email: teamEmail,
        team_whatsapp: teamWhatsapp,
        rules_version_id: rulesVersion?.id,
        accept_rules: acceptRules as true,
        members: members.map((m) => ({
          full_name: m.full_name,
          photo_url: m.photo_url,
          identity_card_url: isLineFollower ? m.identity_card_url : undefined,
          birth_date: isLineFollower ? m.birth_date : undefined,
          role_in_team: m.role_in_team,
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Pendaftaran gagal.");
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setIsSubmitting(false);
        return;
      }

      setSuccessData({
        registrationCode: res.data.registrationCode,
        accessToken: res.data.accessToken,
      });

      // Langsung arahkan ke halaman pembayaran QRIS dinamis.
      window.location.href = `/mrc/bayar/${res.data.accessToken}`;
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayFee = activeFee ?? category.registration_fee;

  const feeLabel =
    displayFee > 0
      ? `Rp ${Number(displayFee).toLocaleString("id-ID")}`
      : "GRATIS";

  if (successData) {
    const payPageUrl = `/mrc/bayar/${successData.accessToken}`;
    const ticketPageUrl = `/mrc/tiket/${successData.accessToken}`;

    return (
      <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-soft text-center space-y-6">
        <div className="inline-flex p-3 bg-success/15 text-success rounded-full">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-balance">Pendaftaran Berhasil Diterima!</h2>
          <p className="text-muted-foreground text-sm">
            Kode Pendaftaran Tim Anda:{" "}
            <strong className="text-foreground font-mono text-lg block sm:inline mt-1 sm:mt-0">
              {successData.registrationCode}
            </strong>
          </p>
        </div>

        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Instruksi pendaftaran dan link E-Tiket telah dikirimkan ke email{" "}
          <strong>{teamEmail}</strong>. Anda juga dapat melanjutkan pembayaran
          atau melihat E-Tiket tim Anda melalui link di bawah ini.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={payPageUrl}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-md shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Bayar via QRIS
          </a>

          <a
            href={ticketPageUrl}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-secondary hover:bg-muted text-secondary-foreground border border-border text-xs font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Buka Halaman E-Tiket & Status
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-soft space-y-6"
    >
      {errorMessage && (
        <div
          className="p-4 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-3 text-destructive text-sm"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Batch aktif & nominal */}
      {activeBatch && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-md flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-success">
            Pendaftaran {BATCH_LABELS[activeBatch]} sedang dibuka
          </span>
          <span className="font-mono font-bold text-success">
            {(activeFee ?? category.registration_fee) > 0
              ? `Rp ${Number(activeFee ?? category.registration_fee).toLocaleString("id-ID")}`
              : "GRATIS"}
          </span>
        </div>
      )}

      {/* Informasi Tim */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Informasi Tim & Pembimbing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nama Tim *
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Contoh: Robosoccer PNP A"
            />
            {fieldErrors.team_name && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {fieldErrors.team_name[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Instansi / Sekolah / Kampus *
            </label>
            <input
              type="text"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Contoh: Politeknik Negeri Padang"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Kota / Kabupaten Asal *
            </label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={cityOpen}
                  aria-controls="mrc-city-listbox"
                  aria-label="Kota atau kabupaten asal"
                  className={cn(
                    "w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring",
                    !originCity && "text-muted-foreground",
                  )}
                >
                  <span className="truncate">
                    {originCity || "Pilih Kota / Kabupaten..."}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                id="mrc-city-listbox"
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command
                  filter={(value, search) => {
                    const label = value.toLowerCase();
                    const q = search.toLowerCase();
                    return label.includes(q) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder="Cari kota atau kabupaten..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {indonesiaCitiesData.data.map((city) => {
                        const label = `${city.nama_kabupaten_kota}, ${city.nama_provinsi}`;
                        return (
                          <CommandItem
                            key={label}
                            value={label}
                            onSelect={() => {
                              setOriginCity(city.nama_kabupaten_kota);
                              setCityOpen(false);
                            }}
                            data-checked={
                              originCity === city.nama_kabupaten_kota
                            }
                          >
                            <span className="truncate">
                              {city.nama_kabupaten_kota}
                            </span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {city.nama_provinsi}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nama Pembimbing (Opsional)
            </label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Contoh: Dr. Eng. Pembimbing, S.T., M.T."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Tim *
            </label>
            <input
              type="email"
              required
              value={teamEmail}
              onChange={(e) => setTeamEmail(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="email.tim@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              WhatsApp Official Tim *
            </label>
            <input
              type="tel"
              required
              value={teamWhatsapp}
              onChange={(e) => setTeamWhatsapp(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="08123456789"
            />
          </div>
        </div>
      </div>

      {/* Anggota Tim & Upload Foto */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-foreground">
            Anggota Tim (Maks {category.max_team_members} Orang)
          </h3>
          {members.length < category.max_team_members && (
            <button
              type="button"
              onClick={addMember}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Plus className="w-4 h-4" /> Tambah Anggota
            </button>
          )}
        </div>

        {members.map((member, idx) => (
          <div
            key={idx}
            className="p-4 bg-muted/40 border border-border rounded-md space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Anggota #{idx + 1}
              </span>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  aria-label={`Hapus anggota ${idx + 1}`}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={member.full_name}
                  onChange={(e) =>
                    updateMember(idx, "full_name", e.target.value)
                  }
                  className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nama sesuai kartu identitas"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Peran dalam Tim
                </label>
                <select
                  value={member.role_in_team}
                  onChange={(e) =>
                    updateMember(idx, "role_in_team", e.target.value)
                  }
                  className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Ketua Tim">Ketua Tim</option>
                  <option value="Anggota">Anggota</option>
                  <option value="Programmer">Programmer</option>
                  <option value="Mechanic">Mechanic</option>
                </select>
              </div>

              {isLineFollower && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={member.birth_date}
                    onChange={(e) =>
                      updateMember(idx, "birth_date", e.target.value)
                    }
                    className="w-full min-h-[44px] px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {category.slug === "line-follower-junior"
                      ? "Maksimal 19 tahun"
                      : "Minimal 19 tahun"}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-foreground">
                    Pas Foto (Verifikasi Wajah) *
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Rasio 3:4 / 1:1
                  </span>
                </div>
                {member.photo_url ? (
                  <div className="flex items-center gap-2 min-h-[44px] px-3 py-2 bg-background border border-border rounded-md">
                    <Image
                      src={member.photo_url}
                      alt="Foto anggota"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded-md border"
                    />
                    <span className="text-xs text-success font-medium">
                      Pas Foto Tersimpan
                    </span>
                    <button
                      type="button"
                      onClick={() => updateMember(idx, "photo_url", "")}
                      className="min-h-[44px] px-1 text-xs text-muted-foreground hover:underline hover:text-foreground ml-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Ubah
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept={MRC_ACCEPT_ATTR}
                      disabled={member.isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handlePhotoUpload(idx, file);
                      }}
                      className="hidden"
                      id={`photo-upload-${idx}`}
                    />
                    <label
                      htmlFor={`photo-upload-${idx}`}
                      className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 bg-background border border-dashed border-input rounded-md text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    >
                      {member.isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />{" "}
                          Mengompres & Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-muted-foreground" />{" "}
                          Upload Pas Foto
                        </>
                      )}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      JPG/PNG/WebP/HEIC • maks {mrcMaxRawLabel("photo")}
                    </p>
                  </div>
                )}
                {member.uploadError && (
                  <p className="text-xs text-destructive mt-1" role="alert">
                    {member.uploadError}
                  </p>
                )}
              </div>

              {isLineFollower && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-foreground">
                      Foto Kartu Pelajar / KK *
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Kartu Pelajar/KK
                    </span>
                  </div>
                  {member.identity_card_url ? (
                    <div className="flex items-center gap-2 min-h-[44px] px-3 py-2 bg-background border border-border rounded-md">
                      <Image
                        src={member.identity_card_url}
                        alt="Kartu Identitas"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded-md border"
                      />
                      <span className="text-xs text-success font-medium">
                        Kartu Tersimpan
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateMember(idx, "identity_card_url", "")
                        }
                        className="min-h-[44px] px-1 text-xs text-muted-foreground hover:underline hover:text-foreground ml-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Ubah
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept={MRC_ACCEPT_ATTR}
                        disabled={member.isUploadingIdCard}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) handleIdentityCardUpload(idx, file);
                        }}
                        className="hidden"
                        id={`idcard-upload-${idx}`}
                      />
                      <label
                        htmlFor={`idcard-upload-${idx}`}
                        className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 bg-background border border-dashed border-input rounded-md text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                      >
                        {member.isUploadingIdCard ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />{" "}
                            Mengompres & Upload...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-muted-foreground" />{" "}
                            Upload Kartu Pelajar / KK
                          </>
                        )}
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        JPG/PNG/WebP/HEIC • maks{" "}
                        {mrcMaxRawLabel("identityCard")}
                      </p>
                    </div>
                  )}
                  {member.uploadIdCardError && (
                    <p className="text-xs text-destructive mt-1" role="alert">
                      {member.uploadIdCardError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Persetujuan Aturan Lomba */}
      <div className="space-y-3 pt-2">
        {rulesVersion && (
          <div className="p-3 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground max-h-32 overflow-y-auto">
            <span className="font-semibold block mb-1">
              Aturan Perlombaan Versi {rulesVersion.version}:
            </span>
            {rulesVersion.content}
          </div>
        )}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={acceptRules}
            onChange={(e) => setAcceptRules(e.target.checked)}
            className="mt-0.5 size-5 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-xs text-muted-foreground">
            Saya menyatakan data yang diisi adalah benar, foto anggota asli, dan
            menyetujui seluruh aturan perlombaan.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[48px] px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-md shadow-soft transition-colors flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Memproses
            Pendaftaran...
          </>
        ) : (
          `Daftar & Lanjut Pembayaran (${feeLabel})`
        )}
      </button>
    </form>
  );
}
