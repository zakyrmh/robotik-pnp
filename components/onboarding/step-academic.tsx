"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
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

export function StepAcademic({ onNext, onPrev, initialData }: StepAcademicProps) {
  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [prodis, setProdis] = useState<
    { id: string; name: string; degree: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State untuk data akademik — diinisialisasi dari initialData jika ada
  const [highSchool, setHighSchool] = useState(initialData?.highSchool ?? "");
  const [selectedMajor, setSelectedMajor] = useState(initialData?.majorId ?? "");
  const [selectedProdi, setSelectedProdi] = useState(""); // Diisi setelah prodis di-load
  const [currentClass, setCurrentClass] = useState(initialData?.currentClass ?? "");
  const [orgExperience, setOrgExperience] = useState(initialData?.orgExperience ?? "");
  const [achievements, setAchievements] = useState(initialData?.achievements ?? "");

  // userChangedMajor: true hanya jika user SECARA EKSPLISIT memilih jurusan baru.
  // Berbeda dengan isInitialLoad — ref ini di-reset ke false saat StrictMode remount,
  // sehingga kedua run Effect (StrictMode) tetap set pre-fill prodi.
  const userChangedMajor = useRef(false);
  // Simpan studyProgramId awal ke ref agar bisa dipakai di useEffect tanpa jadi dependency
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
          // User ganti jurusan secara manual → reset pilihan prodi
          setSelectedProdi("");
        } else {
          // Pre-fill: set prodi SETELAH options tersedia agar Radix bisa render label
          // Aman di StrictMode karena userChangedMajor.current selalu false saat remount
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
    if (!highSchool.trim()) { toast.error("Asal sekolah wajib diisi."); return; }
    if (!selectedMajor) { toast.error("Jurusan wajib dipilih."); return; }
    if (!selectedProdi) { toast.error("Program studi wajib dipilih."); return; }
    if (!currentClass.trim()) { toast.error("Kelas saat ini wajib diisi."); return; }

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

        toast.success("Data akademik disimpan.");
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
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
      className="px-8 py-10 overflow-y-auto custom-scrollbar"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Akademik &amp; Rekam Jejak
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Informasi pendidikan dan pengalaman Anda.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Data Akademik
          </h3>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Asal Sekolah (SMA/SMK) <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="SMKN 1 Padang"
              className="h-10 rounded-xl"
              value={highSchool}
              onChange={(e) => setHighSchool(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500">
                Jurusan <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(val) => {
                  userChangedMajor.current = true;
                  setSelectedMajor(val);
                }}
                value={selectedMajor}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue
                    placeholder={isLoading ? "Memuat..." : "Pilih Jurusan"}
                  />
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
              <Label className="text-xs font-bold uppercase text-neutral-500">
                Program Studi <span className="text-red-500">*</span>
              </Label>
              <Select
                disabled={!selectedMajor || isLoading}
                onValueChange={(val) => setSelectedProdi(val)}
                value={selectedProdi}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue
                    placeholder={
                      !selectedMajor ? "Pilih Jurusan Dulu" : "Pilih Prodi"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {prodis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.degree} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-neutral-500">
                Kelas Saat Ini <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: 2A / 1B"
                className="h-10 rounded-xl"
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
              />
            </div>
          </div>
        </section>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Rekam Jejak
          </h3>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Pengalaman Organisasi
            </Label>
            <Textarea
              placeholder="Sebutkan organisasi yang pernah diikuti"
              className="rounded-xl min-h-[100px]"
              value={orgExperience}
              onChange={(e) => setOrgExperience(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-neutral-500">
              Prestasi
            </Label>
            <Textarea
              placeholder="Sebutkan prestasi yang pernah diraih"
              className="rounded-xl min-h-[80px]"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
            />
          </div>
        </section>
      </div>

      <div className="mt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 pt-4">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isPending}
          className="flex-1 h-11 rounded-xl gap-2"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> Kembali
        </Button>
        <Button
          onClick={handleNext}
          disabled={isPending || isLoading}
          className="flex-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {isPending ? "Menyimpan..." : "Lanjut"}
          {!isPending && <HugeiconsIcon icon={ArrowRight02Icon} size={16} />}
        </Button>
      </div>
    </motion.div>
  );
}
