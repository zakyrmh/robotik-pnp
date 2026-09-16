"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Loading02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState, useTransition } from "react";
import { getMajors, getStudyPrograms } from "@/lib/actions/academic";
import { saveAcademicData } from "@/lib/actions/registration";
import type { OnboardingInitialAcademic } from "@/lib/actions/onboarding";
import { toast } from "sonner";

interface StepAcademicProps {
  onNext: () => void;
  onPrev: () => void;
  initialData?: OnboardingInitialAcademic | null;
}

export function StepAcademic({
  onNext,
  onPrev,
  initialData,
}: StepAcademicProps) {
  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [prodis, setProdis] = useState<
    { id: string; name: string; degree: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State untuk data akademik — diinisialisasi dari initialData jika ada
  const [highSchool, setHighSchool] = useState(initialData?.highSchool ?? "");
  const [selectedMajor, setSelectedMajor] = useState(
    initialData?.majorId ?? "",
  );
  const [selectedProdi, setSelectedProdi] = useState("");
  const [currentClass, setCurrentClass] = useState(
    initialData?.currentClass ?? "",
  );
  const [orgExperience, setOrgExperience] = useState(
    initialData?.orgExperience ?? "",
  );
  const [achievements, setAchievements] = useState(
    initialData?.achievements ?? "",
  );

  const userChangedMajor = useRef(false);
  const initialStudyProgramId = useRef(initialData?.studyProgramId ?? "");

  // Load Jurusan saat komponen muncul
  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await getMajors();
        setMajors(data);
      } catch (err) {
        console.error("Gagal memuat jurusan", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Update Prodi saat Jurusan berubah
  useEffect(() => {
    async function loadProdis() {
      if (!selectedMajor) {
        setProdis([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getStudyPrograms(selectedMajor);
        setProdis(data);
        if (userChangedMajor.current) {
          setSelectedProdi("");
        } else {
          setSelectedProdi(initialStudyProgramId.current);
        }
      } catch (err) {
        console.error("Gagal memuat prodi", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProdis();
  }, [selectedMajor]);

  const handleNext = () => {
    // Validasi field wajib (sebelum masuk transition)
    if (!highSchool.trim()) {
      toast.error("Asal sekolah wajib diisi.");
      return;
    }
    if (!selectedMajor) {
      toast.error("Jurusan wajib dipilih.");
      return;
    }
    if (!selectedProdi) {
      toast.error("Program studi wajib dipilih.");
      return;
    }
    if (!currentClass.trim()) {
      toast.error("Kelas saat ini wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveAcademicData({
          highSchool: highSchool.trim(),
          studyProgramId: selectedProdi,
          currentClass: currentClass.trim(),
          orgExperience: orgExperience.trim() || undefined,
          achievements: achievements.trim() || undefined,
        });

        if (!result.success) {
          toast.error(result.error || "Gagal menyimpan data akademik.");
          return;
        }

        toast.success("Data akademik berhasil disimpan.");
        onNext();
      } catch (err) {
        console.error("Error saving academic data:", err);
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="p-6 sm:p-8 md:p-10 overflow-y-auto"
    >
      <div className="mb-6 space-y-1">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground tracking-tight">
          Akademik &amp; Rekam Jejak
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Lengkapi data institusi pendidikan di PNP serta riwayat pengalaman
          organisasi atau prestasi.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm">
        {/* Sub-section: Data Akademik */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono block">
            Data Akademik PNP &amp; Asal Sekolah
          </span>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Asal Sekolah (SMA/SMK/MA){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: SMKN 1 Padang"
              className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={highSchool}
              onChange={(e) => setHighSchool(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Jurusan <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(val) => {
                  userChangedMajor.current = true;
                  setSelectedMajor(val);
                }}
                value={selectedMajor}
                disabled={isPending}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus:ring-2 focus:ring-primary/20">
                  <SelectValue
                    placeholder={
                      isLoading ? "Memuat jurusan..." : "Pilih Jurusan"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                  {majors.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="text-xs sm:text-sm cursor-pointer"
                    >
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Program Studi <span className="text-destructive">*</span>
              </Label>
              <Select
                disabled={!selectedMajor || isLoading || isPending}
                onValueChange={(val) => setSelectedProdi(val)}
                value={selectedProdi}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus:ring-2 focus:ring-primary/20">
                  <SelectValue
                    placeholder={
                      !selectedMajor
                        ? "Pilih Jurusan Terlebih Dahulu"
                        : "Pilih Program Studi"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover shadow-lg">
                  {prodis.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="text-xs sm:text-sm cursor-pointer"
                    >
                      {p.degree} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Kelas Saat Ini <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Contoh: 1A / 2B / 1-TRPL"
              className="h-11 rounded-xl bg-background border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Sub-section: Rekam Jejak */}
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono block">
            Pengalaman &amp; Prestasi (Opsional)
          </span>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Pengalaman Organisasi
            </Label>
            <Textarea
              placeholder="Tuliskan organisasi atau kepanitiaan yang pernah Anda ikuti di sekolah/kampus..."
              className="rounded-xl bg-background border-border min-h-[90px] text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
              value={orgExperience}
              onChange={(e) => setOrgExperience(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Prestasi / Penghargaan
            </Label>
            <Textarea
              placeholder="Tuliskan prestasi akademik atau non-akademik yang pernah Anda raih..."
              className="rounded-xl bg-background border-border min-h-[80px] text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isPending}
          className="flex-1 h-11 min-h-[44px] rounded-xl border-border text-xs sm:text-sm font-medium gap-2 cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isPending || isLoading}
          className="flex-2 h-11 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-semibold gap-2 shadow-xs cursor-pointer"
        >
          {isPending ? (
            <>
              <HugeiconsIcon
                icon={Loading02Icon}
                size={16}
                className="animate-spin"
              />
              Menyimpan...
            </>
          ) : (
            <>
              Lanjut ke Visi &amp; Komitmen
              <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
