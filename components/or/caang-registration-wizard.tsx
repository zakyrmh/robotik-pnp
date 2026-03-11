"use client";

/**
 * CaangRegistrationWizard — Wizard pendaftaran calon anggota (step-by-step).
 *
 * Steps:
 * 1. Biodata: nama, panggilan, gender, TTL, alamat, telepon, NIM, prodi, motivasi, dll
 * 2. Dokumen: pas foto, KTM, bukti follow IG, bukti subscribe YT
 * 3. Pembayaran: bukti transfer/offline
 * 4. Review & Submit: preview data dan kirim untuk verifikasi
 *
 * Status: draft → submitted → [accepted | revision | rejected]
 * Jika revision → caang bisa edit dan submit ulang
 */

import Image from "next/image";
import { useState, useTransition, useEffect } from "react";
import {
  User,
  FileText,
  CreditCard,
  Send,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
  AlertTriangle,
  XCircle,
  PartyPopper,
  Camera,
  Instagram,
  Youtube,
  Copy,
  Landmark,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  saveBiodata,
  saveDocuments,
  savePayment,
  submitRegistration,
  getMyRegistration,
} from "@/app/actions/or.action";
import { uploadImageToSupabase } from "@/app/actions/upload.action";
import imageCompression from "browser-image-compression";
import type { OrRegistrationWithUser } from "@/lib/db/schema/or";
import { OR_REGISTRATION_STATUS_LABELS } from "@/lib/db/schema/or";

// ═══════════════════════════════════════════════

const STEPS = [
  { key: "biodata", label: "Data Diri", icon: User },
  { key: "documents", label: "Dokumen", icon: FileText },
  { key: "payment", label: "Pembayaran", icon: CreditCard },
  { key: "review", label: "Kirim", icon: Send },
] as const;

interface Props {
  registration: OrRegistrationWithUser;
  studyPrograms: { id: string; major_id: string; name: string }[];
  majors: { id: string; name: string }[];
}

export function CaangRegistrationWizard({
  registration: initialReg,
  studyPrograms,
  majors,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [reg, setReg] = useState(initialReg);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Determine initial step from registration progress
  const getInitialStep = (): number => {
    if (
      reg.status === "submitted" ||
      reg.status === "accepted" ||
      reg.status === "rejected"
    )
      return 3;
    if (reg.current_step === "completed") return 3;
    if (reg.current_step === "payment") return 2;
    if (reg.current_step === "documents") return 1;
    return 0;
  };

  const [activeStep, setActiveStep] = useState(getInitialStep());

  // ── Biodata form ──
  const [fullName, setFullName] = useState(reg.full_name || "");
  const [nickname, setNickname] = useState(reg.nickname || "");
  const [gender, setGender] = useState(reg.gender || "");
  const [birthPlace, setBirthPlace] = useState(reg.birth_place || "");
  const [birthDate, setBirthDate] = useState(reg.birth_date || "");
  const [phone, setPhone] = useState(reg.phone || "");
  const [address, setAddress] = useState(reg.address_domicile || "");
  const [nim, setNim] = useState(reg.nim || "");
  const [studyProgramId, setStudyProgramId] = useState("");
  const [yearEnrolled, setYearEnrolled] = useState(
    reg.year_enrolled ? String(reg.year_enrolled) : "",
  );
  const [motivation, setMotivation] = useState(reg.motivation || "");
  const [orgExperience, setOrgExperience] = useState(reg.org_experience || "");
  const [achievements, setAchievements] = useState(reg.achievements || "");

  // ── Document form ──
  const [photoUrl, setPhotoUrl] = useState(reg.photo_url || "");
  const [ktmUrl, setKtmUrl] = useState(reg.ktm_url || "");
  const [igFollowUrl, setIgFollowUrl] = useState(reg.ig_follow_url || "");
  const [igMrcUrl, setIgMrcUrl] = useState(reg.ig_mrc_url || "");
  const [ytSubUrl, setYtSubUrl] = useState(reg.yt_sub_url || "");

  // Document Files
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [igFollowFile, setIgFollowFile] = useState<File | null>(null);
  const [igMrcFile, setIgMrcFile] = useState<File | null>(null);
  const [ytSubFile, setYtSubFile] = useState<File | null>(null);

  const [uploadStatus, setUploadStatus] = useState<
    Record<string, "pending" | "uploading" | "done" | "error">
  >({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // ── Payment form ──
  const [paymentUrl, setPaymentUrl] = useState(reg.payment_url || "");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(
    reg.payment_method || "transfer",
  );

  // ── Unsaved Document Warning (BeforeUnload) ──
  useEffect(() => {
    const hasUnsavedFiles = !!(
      photoFile ||
      ktmFile ||
      igFollowFile ||
      igMrcFile ||
      ytSubFile ||
      paymentFile
    );

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedFiles) {
        e.preventDefault();
        e.returnValue = ""; // Standar browser untuk memunculkan default alert popup
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [photoFile, ktmFile, igFollowFile, igMrcFile, ytSubFile, paymentFile]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const reload = async () => {
    const result = await getMyRegistration();
    if (result.data) setReg(result.data);
  };

  // ── Status checks ──
  const isReadOnly =
    reg.status === "submitted" ||
    reg.status === "accepted" ||
    reg.status === "rejected";
  const isRevision = reg.status === "revision";
  const needsRevision = (field: string) =>
    isRevision && reg.revision_fields?.includes(field);

  // ── Handle step saves ──
  const handleSaveBiodata = () => {
    if (!fullName.trim()) {
      showFeedback("error", "Nama lengkap wajib diisi.");
      return;
    }
    startTransition(async () => {
      const result = await saveBiodata({
        fullName,
        nickname: nickname || undefined,
        gender: gender || undefined,
        birthPlace: birthPlace || undefined,
        birthDate: birthDate || undefined,
        phone: phone || undefined,
        addressDomicile: address || undefined,
        nim: nim || undefined,
        studyProgramId: studyProgramId || undefined,
        yearEnrolled: yearEnrolled ? parseInt(yearEnrolled) : undefined,
        motivation: motivation || undefined,
        orgExperience: orgExperience || undefined,
        achievements: achievements || undefined,
      });
      if (result.error) {
        showFeedback("error", result.error);
        return;
      }
      showFeedback("success", "Data diri berhasil disimpan!");
      await reload();
      setActiveStep(1);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFeedback("error", "Hanya gambar (JPG, PNG) yang diperbolehkan.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback("error", `Ukuran ${file.name} melebihi 5MB.`);
      e.target.value = "";
      return;
    }

    try {
      showFeedback("success", `Mengkompresi gambar...`);
      setUploadStatus((prev) => ({ ...prev, [fieldName]: "pending" }));
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      const finalFile = new File([compressed], file.name, { type: file.type });
      setFile(finalFile);

      // Update preview immediately
      setPreviews((prev) => ({
        ...prev,
        [fieldName]: URL.createObjectURL(finalFile),
      }));
      showFeedback("success", `Gambar siap diunggah.`);
    } catch {
      setFile(file);
    }
  };

  const handleSaveDocuments = () => {
    if (!photoUrl && !photoFile) {
      showFeedback("error", "Pas foto wajib diupload.");
      return;
    }
    if (!igFollowUrl && !igFollowFile) {
      showFeedback("error", "Bukti follow IG Robotik wajib diupload.");
      return;
    }
    if (!igMrcUrl && !igMrcFile) {
      showFeedback("error", "Bukti follow IG MRC wajib diupload.");
      return;
    }
    if (!ytSubUrl && !ytSubFile) {
      showFeedback("error", "Bukti subscribe YT wajib diupload.");
      return;
    }

    startTransition(async () => {
      try {
        const uploadIfFile = async (
          file: File | null,
          existingUrl: string,
          field: string,
        ) => {
          if (!file) return existingUrl;

          setUploadStatus((prev) => ({ ...prev, [field]: "uploading" }));
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadImageToSupabase(
            fd,
            `caang/2026/${reg.user_id}`,
          );

          if (!res.success) {
            setUploadStatus((prev) => ({ ...prev, [field]: "error" }));
            throw new Error(String(res.error));
          }

          setUploadStatus((prev) => ({ ...prev, [field]: "done" }));
          return res.url as string;
        };

        const newPhotoUrl = await uploadIfFile(
          photoFile,
          photoUrl,
          "photo_url",
        );
        const newKtmUrl = await uploadIfFile(ktmFile, ktmUrl, "ktm_url");
        const newIgFollowUrl = await uploadIfFile(
          igFollowFile,
          igFollowUrl,
          "ig_follow_url",
        );
        const newIgMrcUrl = await uploadIfFile(
          igMrcFile,
          igMrcUrl,
          "ig_mrc_url",
        );
        const newYtSubUrl = await uploadIfFile(
          ytSubFile,
          ytSubUrl,
          "yt_sub_url",
        );

        const result = await saveDocuments({
          photoUrl: newPhotoUrl,
          ktmUrl: newKtmUrl || undefined,
          igFollowUrl: newIgFollowUrl,
          igMrcUrl: newIgMrcUrl,
          ytSubUrl: newYtSubUrl,
        });

        if (result.error) throw new Error(result.error);

        setPhotoUrl(newPhotoUrl);
        setKtmUrl(newKtmUrl);
        setIgFollowUrl(newIgFollowUrl);
        setIgMrcUrl(newIgMrcUrl);
        setYtSubUrl(newYtSubUrl);

        setPhotoFile(null);
        setKtmFile(null);
        setIgFollowFile(null);
        setIgMrcFile(null);
        setYtSubFile(null);

        showFeedback("success", "Dokumen berhasil disimpan!");
        await reload();
        setActiveStep(2);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        showFeedback(
          "error",
          errorMsg || "Gagal menyimpan / mengupload dokumen.",
        );
      }
    });
  };

  const handleSavePayment = () => {
    if (!paymentUrl && !paymentFile) {
      showFeedback("error", "Bukti pembayaran wajib diupload.");
      return;
    }

    startTransition(async () => {
      try {
        let newPaymentUrl = paymentUrl;
        if (paymentFile) {
          setUploadStatus((prev) => ({ ...prev, payment_url: "uploading" }));
          const fd = new FormData();
          fd.append("file", paymentFile);
          const res = await uploadImageToSupabase(
            fd,
            `caang/2026/${reg.user_id}`,
          );

          if (!res.success) {
            setUploadStatus((prev) => ({ ...prev, payment_url: "error" }));
            throw new Error(String(res.error));
          }

          newPaymentUrl = res.url as string;
          setUploadStatus((prev) => ({ ...prev, payment_url: "done" }));
        }

        const result = await savePayment({
          paymentUrl: newPaymentUrl,
          paymentMethod,
          paymentAmount: undefined,
        });

        if (result.error) throw new Error(result.error);

        setPaymentUrl(newPaymentUrl);
        setPaymentFile(null);

        showFeedback("success", "Pembayaran berhasil disimpan!");
        await reload();
        setActiveStep(3);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        showFeedback(
          "error",
          errorMsg || "Gagal menyimpan / mengupload dokumen.",
        );
      }
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitRegistration();
      if (result.error) {
        showFeedback("error", result.error);
        return;
      }
      showFeedback(
        "success",
        "Pendaftaran berhasil dikirim! Tunggu verifikasi dari tim OR.",
      );
      await reload();
    });
  };

  // ── Filter prodi by selected major ──
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const filteredProdi = selectedMajorId
    ? studyPrograms.filter((p) => p.major_id === selectedMajorId)
    : studyPrograms;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {reg.status === "submitted" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 flex items-start gap-3">
          <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              Menunggu Verifikasi
            </p>
            <p className="text-sm text-amber-600/80 mt-0.5">
              Pendaftaran kamu sedang direview oleh tim OR. Kami akan
              memberitahu hasilnya.
            </p>
          </div>
        </div>
      )}
      {reg.status === "accepted" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex items-start gap-3">
          <PartyPopper className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Pendaftaran Diterima! 🎉
            </p>
            <p className="text-sm text-emerald-600/80 mt-0.5">
              Selamat, kamu resmi menjadi calon anggota UKM Robotik PNP!
            </p>
          </div>
        </div>
      )}
      {reg.status === "rejected" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 flex items-start gap-3">
          <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Pendaftaran Ditolak
            </p>
            <p className="text-sm text-red-600/80 mt-0.5">
              {reg.verification_notes ||
                "Pendaftaran kamu tidak memenuhi syarat."}
            </p>
          </div>
        </div>
      )}
      {isRevision && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-700 dark:text-orange-400">
              Perlu Revisi
            </p>
            <p className="text-sm text-orange-600/80 mt-0.5">
              {reg.verification_notes || "Ada data yang perlu diperbaiki."}
            </p>
            {reg.revision_fields && reg.revision_fields.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {reg.revision_fields.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="text-[10px] bg-orange-500/15 text-orange-600 border-orange-500/25"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeStep === i;
          const isDone =
            activeStep > i || (reg.current_step === "completed" && i < 3);
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => !isReadOnly && setActiveStep(i)}
                disabled={isReadOnly && reg.status !== "revision"}
                className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full justify-center
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isDone
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
              >
                {isDone && !isActive ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        {/* ── STEP 1: Biodata ── */}
        {activeStep === 0 && (
          <div className="space-y-4 animate-in fade-in-0">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="size-5" /> Data Diri
              </h2>
              <p className="text-xs text-muted-foreground">
                Isi data diri kamu dengan lengkap dan benar.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Lengkap *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai KTM"
                  disabled={isReadOnly}
                  className={
                    needsRevision("full_name") ? "border-orange-500" : ""
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Panggilan</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nama panggilan"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis Kelamin</Label>
                <Select
                  value={gender}
                  onValueChange={setGender}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tempat Lahir</Label>
                <Input
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Kota kelahiran"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">No HP / WhatsApp *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  disabled={isReadOnly}
                  className={needsRevision("phone") ? "border-orange-500" : ""}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Alamat Domisili</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat tempat tinggal saat ini"
                  disabled={isReadOnly}
                  className={
                    needsRevision("address_domicile") ? "border-orange-500" : ""
                  }
                />
              </div>

              {/* Edukasi */}
              <div className="sm:col-span-2 border-t pt-3 mt-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Informasi Akademik
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">NIM *</Label>
                <Input
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="2211xxxxx"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun Masuk</Label>
                <Input
                  type="number"
                  value={yearEnrolled}
                  onChange={(e) => setYearEnrolled(e.target.value)}
                  placeholder="2025"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jurusan</Label>
                <Select
                  value={selectedMajorId}
                  onValueChange={setSelectedMajorId}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Program Studi *</Label>
                <Select
                  value={studyProgramId}
                  onValueChange={setStudyProgramId}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prodi..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProdi.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Motivasi dll */}
              <div className="sm:col-span-2 border-t pt-3 mt-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Informasi Tambahan
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Motivasi masuk UKM Robotik PNP *
                </Label>
                <Textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Ceritakan motivasi kamu..."
                  className={`min-h-[80px] ${needsRevision("motivation") ? "border-orange-500" : ""}`}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Pengalaman Organisasi{" "}
                  <span className="text-muted-foreground">(opsional)</span>
                </Label>
                <Textarea
                  value={orgExperience}
                  onChange={(e) => setOrgExperience(e.target.value)}
                  placeholder="Pengalaman organisasi sebelumnya..."
                  className="min-h-[60px]"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Prestasi{" "}
                  <span className="text-muted-foreground">(opsional)</span>
                </Label>
                <Textarea
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Prestasi akademik/non-akademik..."
                  className="min-h-[60px]"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBiodata}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Simpan & Lanjut <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Dokumen ── */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-in fade-in-0">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="size-5" /> Upload Dokumen
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload gambar dokumen pendukung. Maksimal 5MB per file.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                {
                  label: "Pas Foto *",
                  valueUrl: photoUrl,
                  file: photoFile,
                  setFile: setPhotoFile,
                  icon: Camera,
                  field: "photo_url",
                },
                {
                  label: "KTM (opsional)",
                  valueUrl: ktmUrl,
                  file: ktmFile,
                  setFile: setKtmFile,
                  icon: FileText,
                  field: "ktm_url",
                },
                {
                  label: "Bukti Follow IG Robotik PNP *",
                  valueUrl: igFollowUrl,
                  file: igFollowFile,
                  setFile: setIgFollowFile,
                  icon: Instagram,
                  field: "ig_follow_url",
                  link: {
                    url: "https://www.instagram.com/robotikpnp",
                    text: "Buka IG Robotik PNP",
                  },
                },
                {
                  label: "Bukti Follow IG MRC *",
                  valueUrl: igMrcUrl,
                  file: igMrcFile,
                  setFile: setIgMrcFile,
                  icon: Instagram,
                  field: "ig_mrc_url",
                  link: {
                    url: "https://www.instagram.com/mrcpnp",
                    text: "Buka IG MRC",
                  },
                },
                {
                  label: "Bukti Subscribe YT Robotik *",
                  valueUrl: ytSubUrl,
                  file: ytSubFile,
                  setFile: setYtSubFile,
                  icon: Youtube,
                  field: "yt_sub_url",
                  link: {
                    url: "https://www.youtube.com/@robotikpnp",
                    text: "Buka YouTube Robotik",
                  },
                },
              ].map((doc) => {
                const Icon = doc.icon;
                return (
                  <div
                    key={doc.field}
                    className={`rounded-lg border p-3 space-y-1.5 ${needsRevision(doc.field) ? "border-orange-500 bg-orange-500/5" : ""}`}
                  >
                    <Label className="text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Icon className="size-3.5" /> {doc.label}
                        {needsRevision(doc.field) && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-orange-500/15 text-orange-600 ml-1"
                          >
                            Revisi
                          </Badge>
                        )}
                      </span>
                      {doc.link && (
                        <a
                          href={doc.link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-700 underline font-normal"
                        >
                          {doc.link.text}
                        </a>
                      )}
                    </Label>

                    <div className="flex gap-3 mt-2">
                      <div className="size-16 shrink-0 rounded border border-muted-foreground/20 overflow-hidden bg-muted flex items-center justify-center">
                        {previews[doc.field] || doc.valueUrl ? (
                          <Image
                            src={previews[doc.field] || doc.valueUrl}
                            alt={doc.label}
                            width={64}
                            height={64}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="size-5 text-muted-foreground/50" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 flex flex-col justify-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(e, doc.setFile, doc.field)
                          }
                          disabled={
                            isReadOnly ||
                            uploadStatus[doc.field] === "uploading"
                          }
                          className="h-8 py-1.5 cursor-pointer file:cursor-pointer text-xs"
                        />

                        {/* File Selection Status / Link */}
                        {!doc.file &&
                          doc.valueUrl &&
                          uploadStatus[doc.field] !== "uploading" && (
                            <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="size-3" />{" "}
                              <a
                                href={doc.valueUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-emerald-700"
                              >
                                Lihat dokumen yang tersimpan
                              </a>
                            </p>
                          )}
                        {doc.file &&
                          uploadStatus[doc.field] !== "uploading" &&
                          uploadStatus[doc.field] !== "done" && (
                            <p className="text-[10px] text-blue-600 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> Siap diunggah:{" "}
                              {doc.file.name}
                            </p>
                          )}

                        {/* Progress Indicators */}
                        {uploadStatus[doc.field] === "uploading" && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-3 animate-spin text-blue-600 shrink-0" />
                            <span className="text-[10px] text-blue-600 shrink-0">
                              Mengunggah...
                            </span>
                            <div className="flex-1 overflow-hidden h-1.5 flex rounded-full bg-blue-100">
                              <div className="w-[65%] shrink-0 shadow-none flex flex-col text-center whitespace-nowrap justify-center bg-blue-600 opacity-60 animate-pulse"></div>
                            </div>
                          </div>
                        )}
                        {uploadStatus[doc.field] === "done" && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="size-3" />
                            <span className="text-[10px]">
                              Penyimpanan berhasil!
                            </span>
                          </div>
                        )}
                        {uploadStatus[doc.field] === "error" && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="size-3" />
                            <span className="text-[10px]">
                              Gagal mengunggah file!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isReadOnly && (
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(0)}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Kembali
                </Button>
                <Button
                  onClick={handleSaveDocuments}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Simpan & Lanjut <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Pembayaran ── */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-in fade-in-0">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="size-5" /> Pembayaran
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload bukti pembayaran biaya registrasi.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Metode Pembayaran</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">
                      Transfer Bank & E-Wallet
                    </SelectItem>
                    <SelectItem value="offline">
                      Bayar Offline (Cash / Sekretariat)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tampilkan Daftar Rekening Jika Transfer */}
              {paymentMethod === "transfer" && (
                <div className="sm:col-span-2 rounded-lg border bg-muted/20 p-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold mb-1">
                      Informasi Rekening Pembayaran
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Silakan transfer biaya registrasi ke salah satu rekening
                      atau nomor e-wallet di bawah ini.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Bank List */}
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 p-3 bg-background border rounded-md">
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs">
                          <Landmark className="size-3.5" /> Bank Nagari
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium tracking-wider">
                              1234-5678-9012
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                              a.n. UKM Robotik PNP
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText("123456789012");
                              showFeedback(
                                "success",
                                "Nomor rekening Bank Nagari tersalin!",
                              );
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-background border rounded-md">
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs">
                          <Landmark className="size-3.5" /> Bank BNI
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium tracking-wider">
                              0987-6543-210
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                              a.n. UKM Robotik PNP
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText("09876543210");
                              showFeedback(
                                "success",
                                "Nomor rekening Bank BNI tersalin!",
                              );
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* E-Wallet List */}
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 p-3 bg-background border rounded-md">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                          <Wallet className="size-3.5" /> DANA / GoPay
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium tracking-wider">
                              0812-3456-7890
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                              a.n. UKM Robotik PNP
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText("081234567890");
                              showFeedback(
                                "success",
                                "Nomor e-wallet tersalin!",
                              );
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-background border rounded-md">
                        <div className="flex items-center gap-1.5 text-purple-600 font-semibold text-xs">
                          <Wallet className="size-3.5" /> OVO / ShopeePay
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium tracking-wider">
                              0852-6543-2109
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                              a.n. UKM Robotik PNP
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              navigator.clipboard.writeText("085265432109");
                              showFeedback(
                                "success",
                                "Nomor e-wallet tersalin!",
                              );
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "offline" && (
                <div className="sm:col-span-2 rounded-lg border bg-emerald-500/10 border-emerald-500/20 p-3 flex gap-3">
                  <div className="mt-0.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
                      Pembayaran di Sekretariat
                    </p>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-500 mt-1 leading-relaxed">
                      Harap serahkan biaya pendaftaran langsung ke sekretariat
                      UKM Robotik PNP. Minta bukti/kwitansi kepada panitia lalu
                      fotokan ke dalam unggahan bukti di bawah.
                    </p>
                  </div>
                </div>
              )}

              <div
                className={`space-y-1.5 rounded-lg border p-3 sm:col-span-2 ${needsRevision("payment_url") ? "border-orange-500 bg-orange-500/5" : ""}`}
              >
                <Label className="text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5" /> Bukti Pembayaran *
                    {needsRevision("payment_url") && (
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-orange-500/15 text-orange-600 ml-1"
                      >
                        Revisi
                      </Badge>
                    )}
                  </span>
                </Label>

                <div className="flex gap-3 mt-2">
                  <div className="size-16 shrink-0 rounded border border-muted-foreground/20 overflow-hidden bg-muted flex items-center justify-center">
                    {previews["payment_url"] || paymentUrl ? (
                      <Image
                        src={previews["payment_url"] || paymentUrl}
                        alt="Bukti Pembayaran"
                        width={64}
                        height={64}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="size-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 flex flex-col justify-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e, setPaymentFile, "payment_url")
                      }
                      disabled={
                        isReadOnly ||
                        uploadStatus["payment_url"] === "uploading"
                      }
                      className="h-8 py-1.5 cursor-pointer file:cursor-pointer text-xs"
                    />

                    {/* File Selection Status / Link */}
                    {!paymentFile &&
                      paymentUrl &&
                      uploadStatus["payment_url"] !== "uploading" && (
                        <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />{" "}
                          <a
                            href={paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-emerald-700"
                          >
                            Lihat dokumen yang tersimpan
                          </a>
                        </p>
                      )}
                    {paymentFile &&
                      uploadStatus["payment_url"] !== "uploading" &&
                      uploadStatus["payment_url"] !== "done" && (
                        <p className="text-[10px] text-blue-600 flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Siap diunggah:{" "}
                          {paymentFile.name}
                        </p>
                      )}

                    {/* Progress Indicators */}
                    {uploadStatus["payment_url"] === "uploading" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-3 animate-spin text-blue-600 shrink-0" />
                        <span className="text-[10px] font-medium text-blue-600 shrink-0">
                          Memproses Pemasukan Data...
                        </span>
                        <div className="flex-1 overflow-hidden h-1.5 flex rounded-full bg-blue-100">
                          <div className="w-[65%] shrink-0 shadow-none flex flex-col text-center whitespace-nowrap justify-center bg-blue-600 opacity-60 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    {uploadStatus["payment_url"] === "done" && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="size-3" />
                        <span className="text-[10px]">
                          Penyimpanan berhasil!
                        </span>
                      </div>
                    )}
                    {uploadStatus["payment_url"] === "error" && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="size-3" />
                        <span className="text-[10px]">
                          Gagal mengunggah file!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(1)}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Kembali
                </Button>
                <Button
                  onClick={handleSavePayment}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Simpan & Lanjut <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-in fade-in-0">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="size-5" /> Review & Kirim
              </h2>
              <p className="text-xs text-muted-foreground">
                Periksa kembali data kamu sebelum mengirim pendaftaran.
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  DATA DIRI
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nama:</span>{" "}
                    {reg.full_name || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Panggilan:</span>{" "}
                    {reg.nickname || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">HP:</span>{" "}
                    {reg.phone || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">NIM:</span>{" "}
                    {reg.nim || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prodi:</span>{" "}
                    {reg.study_program_name || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{" "}
                    {reg.gender === "L"
                      ? "Laki-laki"
                      : reg.gender === "P"
                        ? "Perempuan"
                        : "—"}
                  </div>
                </div>
                {reg.motivation && (
                  <p className="text-xs mt-2">
                    <span className="text-muted-foreground">Motivasi:</span>{" "}
                    {reg.motivation.slice(0, 100)}
                    {reg.motivation.length > 100 ? "..." : ""}
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  DOKUMEN
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Pas Foto", ok: !!reg.photo_url },
                    { label: "KTM", ok: !!reg.ktm_url, optional: true },
                    { label: "Follow IG Robotik", ok: !!reg.ig_follow_url },
                    { label: "Follow IG MRC", ok: !!reg.ig_mrc_url },
                    { label: "Subscribe YT", ok: !!reg.yt_sub_url },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-1">
                      {d.ok ? (
                        <CheckCircle2 className="size-3 text-emerald-600" />
                      ) : (
                        <XCircle className="size-3 text-red-500" />
                      )}
                      <span className={d.ok ? "" : "text-red-500"}>
                        {d.label}
                        {d.optional ? " (opsional)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  PEMBAYARAN
                </p>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Metode:</span>{" "}
                    {reg.payment_method === "transfer"
                      ? "Transfer"
                      : reg.payment_method === "offline"
                        ? "Offline"
                        : "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nominal:</span>{" "}
                    {reg.payment_amount
                      ? `Rp ${reg.payment_amount.toLocaleString("id-ID")}`
                      : "—"}
                  </div>
                  <div className="col-span-2 mt-1">
                    {reg.payment_url ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Bukti tersedia
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <XCircle className="size-3" /> Belum upload bukti
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {OR_REGISTRATION_STATUS_LABELS[reg.status]}
                </Badge>
              </div>
            </div>

            {(reg.status === "draft" || reg.status === "revision") &&
              reg.current_step === "completed" && (
                <div className="border-t pt-4 space-y-3">
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4 text-sm text-blue-700 dark:text-blue-400">
                    <strong>Siap kirim?</strong> Pastikan semua data sudah
                    benar. Setelah dikirim, data tidak bisa diedit sampai ada
                    keputusan dari tim OR.
                  </div>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep(2)}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="size-4" /> Kembali
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isPending}
                      size="lg"
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Kirim Pendaftaran
                    </Button>
                  </div>
                </div>
              )}

            {(reg.status === "draft" || reg.status === "revision") &&
              reg.current_step !== "completed" && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4 inline mr-1" />
                  Lengkapi semua step terlebih dahulu sebelum mengirim
                  pendaftaran.
                </div>
              )}
          </div>
        )}
      </div>

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
