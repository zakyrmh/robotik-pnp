"use client";

import { useState } from "react";
import { submitMagangForm } from "@/app/actions/magang.action";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  PenTool,
  Cpu,
  Code2,
  Navigation,
  Anchor,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const MINAT_OPTIONS = [
  {
    id: "Elektronika",
    label: "Elektronika",
    icon: Cpu,
    desc: "Fokus pada hardware dan sirkuit",
  },
  {
    id: "Mekanik",
    label: "Mekanik",
    icon: PenTool,
    desc: "Desain, struktur, dan manufaktur",
  },
  {
    id: "Programmer",
    label: "Programmer",
    icon: Code2,
    desc: "Algoritma dan perancangan software",
  },
];

const PILIHAN_DIVISI = ["KRAI", "KRSBI-B", "KRSBI-H", "KRTI", "KRSRI"];
const PILIHAN_DEPARTEMEN = [
  "Kestari",
  "Maintanance",
  "Produksi",
  "Humas",
  "Pubdok",
  "Kpsdm",
  "Ristek",
];

export function MagangForm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);

  // States Step 1
  const [minat, setMinat] = useState("");
  const [alasanMinat, setAlasanMinat] = useState("");
  const [skill, setSkill] = useState("");

  // States Step 2 (Divisi)
  const [divisi1, setDivisi1] = useState("");
  const [yakinDivisi1, setYakinDivisi1] = useState("");
  const [alasanDivisi1, setAlasanDivisi1] = useState("");

  const [divisi2, setDivisi2] = useState("");
  const [yakinDivisi2, setYakinDivisi2] = useState("");
  const [alasanDivisi2, setAlasanDivisi2] = useState("");

  // States Step 3 (Departemen)
  const [dept1, setDept1] = useState("");
  const [yakinDept1, setYakinDept1] = useState("");
  const [alasanDept1, setAlasanDept1] = useState("");

  const [dept2, setDept2] = useState("");
  const [yakinDept2, setYakinDept2] = useState("");
  const [alasanDept2, setAlasanDept2] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!minat || !alasanMinat || !skill) {
        toast.error("Harap isi semua field pada langkah ini");
        return;
      }
    }
    if (step === 2) {
      if (
        !divisi1 ||
        !yakinDivisi1 ||
        !alasanDivisi1 ||
        !divisi2 ||
        !yakinDivisi2 ||
        !alasanDivisi2
      ) {
        toast.error("Harap isi semua field pilihan divisi pada langkah ini");
        return;
      }
      if (divisi1 === divisi2) {
        toast.error("Pilihan divisi pertama dan kedua tidak boleh sama");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    if (
      !dept1 ||
      !yakinDept1 ||
      !alasanDept1 ||
      !dept2 ||
      !yakinDept2 ||
      !alasanDept2
    ) {
      toast.error("Harap isi semua field pilihan departemen pada langkah ini");
      return;
    }
    if (dept1 === dept2) {
      toast.error("Pilihan departemen pertama dan kedua tidak boleh sama");
      return;
    }

    setIsPending(true);

    // Call server action
    const result = await submitMagangForm({
      minat,
      alasan_minat: alasanMinat,
      skill,
      divisi_1: divisi1,
      yakin_divisi_1: yakinDivisi1,
      alasan_divisi_1: alasanDivisi1,
      divisi_2: divisi2,
      yakin_divisi_2: yakinDivisi2,
      alasan_divisi_2: alasanDivisi2,
      dept_1: dept1,
      yakin_dept_1: yakinDept1,
      alasan_dept_1: alasanDept1,
      dept_2: dept2,
      yakin_dept_2: yakinDept2,
      alasan_dept_2: alasanDept2,
    });

    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Pendaftaran magang berhasil!");
    onComplete(); // Pindah ke dashboard/logbook
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {["Bidang Minat", "Magang Divisi", "Magang Departemen"].map(
            (label, idx) => (
              <div
                key={idx}
                className={`flex-1 text-center text-xs font-bold uppercase transition-colors ${
                  step > idx ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Langkah {idx + 1}
                <div className="text-[10px] lowercase font-medium opacity-70 border-none mt-0.5">
                  {label}
                </div>
              </div>
            ),
          )}
        </div>
        <div className="flex bg-muted/30 rounded-full h-2 overflow-hidden border">
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-primary">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-xl">Formulir Pendaftaran Magang</CardTitle>
          <CardDescription>
            {step === 1 &&
              "Lengkapi data minat dan skill kamu sebelum memilih divisi."}
            {step === 2 &&
              "Pilih divisi untuk magang paralel pertamamu beserta alasannya."}
            {step === 3 &&
              "Pilih departemen untuk magang paralel keduamu beserta alasannya."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form id="magang-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">
                    Bidang yang Diminati
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MINAT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = minat === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`
                            relative flex flex-col items-center p-4 border rounded-xl cursor-pointer hover:border-primary/50 transition-all
                            ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                          `}
                        >
                          <input
                            type="radio"
                            name="minat"
                            value={opt.id}
                            className="sr-only"
                            checked={isSelected}
                            onChange={(e) => setMinat(e.target.value)}
                          />
                          <Icon
                            className={`size-8 mb-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <span className="font-semibold text-sm mb-1">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            {opt.desc}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="absolute top-2 right-2 size-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    Alasan Memilih Bidang
                  </Label>
                  <Textarea
                    placeholder="Mengapa Anda tertarik dengan bidang ini?"
                    value={alasanMinat}
                    onChange={(e) => setAlasanMinat(e.target.value)}
                    className="resize-none h-24"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    Skill yang Dimiliki
                  </Label>
                  <Textarea
                    placeholder="Jelaskan skill atau pengalaman Anda di bidang ini..."
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="resize-none h-24"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Sebutkan software yang dikuasai, proyek yang pernah dibuat,
                    atau pengetahuan dasar terkait.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2 (Divisi) */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Pilihan 1 Divisi */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                    <Navigation className="size-4" /> Magang Divisi - Pilihan
                    Pertama
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Divisi Pilihan Pertama
                    </Label>
                    <Select value={divisi1} onValueChange={setDivisi1}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Divisi Pertama" />
                      </SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DIVISI.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            disabled={opt === divisi2}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">
                      Tingkat Keyakinan (Pilihan Pertama)
                    </Label>
                    <div className="flex gap-4 items-center">
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDivisi1 === "Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDivisi1"
                          value="Yakin"
                          className="sr-only"
                          checked={yakinDivisi1 === "Yakin"}
                          onChange={(e) => setYakinDivisi1(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Sangat Yakin
                        </span>
                      </label>
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDivisi1 === "Tidak Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDivisi1"
                          value="Tidak Yakin"
                          className="sr-only"
                          checked={yakinDivisi1 === "Tidak Yakin"}
                          onChange={(e) => setYakinDivisi1(e.target.value)}
                        />
                        <span className="font-medium text-sm">Masih Ragu</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Alasan Memilih Divisi Pertama
                    </Label>
                    <Textarea
                      placeholder="Apa yang memotivasimu memilih divisi ini sebagai prioritas?"
                      value={alasanDivisi1}
                      onChange={(e) => setAlasanDivisi1(e.target.value)}
                      className="resize-none h-20"
                    />
                  </div>
                </div>

                {/* Pilihan 2 Divisi */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                    <Anchor className="size-4" /> Magang Divisi - Pilihan Kedua
                    (Alternatif)
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Divisi Pilihan Kedua
                    </Label>
                    <Select value={divisi2} onValueChange={setDivisi2}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Divisi Kedua" />
                      </SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DIVISI.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            disabled={opt === divisi1}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">
                      Tingkat Keyakinan (Pilihan Kedua)
                    </Label>
                    <div className="flex gap-4 items-center">
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDivisi2 === "Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDivisi2"
                          value="Yakin"
                          className="sr-only"
                          checked={yakinDivisi2 === "Yakin"}
                          onChange={(e) => setYakinDivisi2(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Pasti Bersedia
                        </span>
                      </label>
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDivisi2 === "Tidak Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDivisi2"
                          value="Tidak Yakin"
                          className="sr-only"
                          checked={yakinDivisi2 === "Tidak Yakin"}
                          onChange={(e) => setYakinDivisi2(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Hanya Jika Terpaksa
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Alasan Memilih Divisi Kedua
                    </Label>
                    <Textarea
                      placeholder="Mengapa divisi ini menjadi pilihan alternatif?"
                      value={alasanDivisi2}
                      onChange={(e) => setAlasanDivisi2(e.target.value)}
                      className="resize-none h-20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 (Departemen) */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Pilihan 1 Departemen */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                    <Navigation className="size-4" /> Magang Departemen -
                    Pilihan Pertama
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Departemen Pilihan Pertama
                    </Label>
                    <Select value={dept1} onValueChange={setDept1}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Departemen Pertama" />
                      </SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DEPARTEMEN.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            disabled={opt === dept2}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">
                      Tingkat Keyakinan (Pilihan Pertama)
                    </Label>
                    <div className="flex gap-4 items-center">
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDept1 === "Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDept1"
                          value="Yakin"
                          className="sr-only"
                          checked={yakinDept1 === "Yakin"}
                          onChange={(e) => setYakinDept1(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Sangat Yakin
                        </span>
                      </label>
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDept1 === "Tidak Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDept1"
                          value="Tidak Yakin"
                          className="sr-only"
                          checked={yakinDept1 === "Tidak Yakin"}
                          onChange={(e) => setYakinDept1(e.target.value)}
                        />
                        <span className="font-medium text-sm">Masih Ragu</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Alasan Memilih Departemen Pertama
                    </Label>
                    <Textarea
                      placeholder="Apa yang memotivasimu memilih departemen ini sebagai prioritas?"
                      value={alasanDept1}
                      onChange={(e) => setAlasanDept1(e.target.value)}
                      className="resize-none h-20"
                    />
                  </div>
                </div>

                {/* Pilihan 2 Departemen */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                    <Anchor className="size-4" /> Magang Departemen - Pilihan
                    Kedua (Alternatif)
                  </h3>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Departemen Pilihan Kedua
                    </Label>
                    <Select value={dept2} onValueChange={setDept2}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Departemen Kedua" />
                      </SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DEPARTEMEN.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            disabled={opt === dept1}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold">
                      Tingkat Keyakinan (Pilihan Kedua)
                    </Label>
                    <div className="flex gap-4 items-center">
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDept2 === "Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDept2"
                          value="Yakin"
                          className="sr-only"
                          checked={yakinDept2 === "Yakin"}
                          onChange={(e) => setYakinDept2(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Pasti Bersedia
                        </span>
                      </label>
                      <label
                        className={`
                        flex flex-1 items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-all
                        ${yakinDept2 === "Tidak Yakin" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}
                      `}
                      >
                        <input
                          type="radio"
                          name="yakinDept2"
                          value="Tidak Yakin"
                          className="sr-only"
                          checked={yakinDept2 === "Tidak Yakin"}
                          onChange={(e) => setYakinDept2(e.target.value)}
                        />
                        <span className="font-medium text-sm">
                          Hanya Jika Terpaksa
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">
                      Alasan Memilih Departemen Kedua
                    </Label>
                    <Textarea
                      placeholder="Mengapa departemen ini menjadi pilihan alternatif?"
                      value={alasanDept2}
                      onChange={(e) => setAlasanDept2(e.target.value)}
                      className="resize-none h-20"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/10 p-4">
          <Button
            key="back-btn"
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isPending}
          >
            <ChevronLeft className="size-4 mr-1" />
            Kembali
          </Button>

          {step < 3 ? (
            <Button key="next-btn" type="button" onClick={handleNext}>
              Selanjutnya
              <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              key="submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Mengirim..." : "Kirim Pendaftaran"}
              {!isPending && <Send className="size-4 ml-2" />}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
