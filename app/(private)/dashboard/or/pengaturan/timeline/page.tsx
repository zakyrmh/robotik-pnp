"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Clock,
  LayoutList,
  Target,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getPipelineSteps,
  savePipelineSteps,
  PipelineStep,
} from "@/app/actions/or-settings.action";
import { OR_REGISTRATION_STATUS_LABELS } from "@/lib/db/schema/or";

export default function TimelineSetupPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    getPipelineSteps().then(({ data }) => {
      if (data) {
        setSteps(data.sort((a, b) => a.order - b.order));
      }
      setIsLoading(false);
    });
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddStep = () => {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.order)) + 1 : 1;
    const newStep: PipelineStep = {
      id: Math.random().toString(36).substring(2, 9),
      label: "",
      description: "",
      mappedStatus: "accepted",
      order: nextOrder,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleUpdateStep = (id: string, updates: Partial<PipelineStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    // Swap positions
    [newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ];

    // Re-assign order based on new index
    const updatedSteps = newSteps.map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(updatedSteps);
  };

  const handleSave = () => {
    startTransition(async () => {
      const { success, error } = await savePipelineSteps(steps);
      if (success) {
        showFeedback("success", "Timeline seleksi berhasil disimpan.");
      } else {
        showFeedback("error", error || "Gagal menyimpan timeline.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Notifikasi Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right-5 flex items-center gap-3 rounded-xl border p-4 shadow-lg min-w-[300px] max-w-md ${
            feedback.type === "success"
              ? "border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-destructive/50 bg-destructive-foreground text-destructive-foreground dark:bg-destructive/10 dark:text-destructive"
          }`}
        >
          <div className={`p-1 rounded-full ${feedback.type === "success" ? "bg-emerald-500/20" : "bg-destructive/20"}`}>
            {feedback.type === "success" ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertCircle className="size-5 text-destructive" />}
          </div>
          <p className="text-sm font-semibold">{feedback.msg}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Timeline Seleksi</h1>
        <p className="text-sm text-muted-foreground">
          Atur tahapan perjalanan yang akan dilalui dan dilihat oleh calon anggota di dashboard mereka.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <LayoutList className="size-5" />
                Daftar Tahapan
              </CardTitle>
              <CardDescription>
                Urutan tahapan ditentukan oleh nomor di sisi kiri.
              </CardDescription>
            </div>
            <Button onClick={handleAddStep} variant="outline" size="sm" className="h-8">
              <Plus className="mr-2 size-4" />
              Tambah Tahapan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {steps.length === 0 ? (
              <div className="py-20 text-center border border-dashed rounded-xl">
                <Clock className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Belum ada tahapan seleksi.</p>
                <Button onClick={handleAddStep} variant="ghost" size="sm" className="mt-2 text-primary hover:bg-primary/5">
                  Klik untuk mulai membuat
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="group relative flex items-stretch gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30"
                  >
                    {/* Urutan & Sortir */}
                    <div className="flex flex-col items-center justify-center gap-1 border-r pr-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 hover:bg-primary/10"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 hover:bg-primary/10"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>

                    {/* Form Input */}
                    <div className="grid flex-1 gap-4 lg:grid-cols-12">
                      {/* Label & Type */}
                      <div className="lg:col-span-4 space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Label Tahapan</Label>
                          <Input
                            value={step.label}
                            onChange={(e) => handleUpdateStep(step.id, { label: e.target.value })}
                            placeholder="Contoh: Pelatihan Robotik"
                            className="h-9 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Target className="size-3" />
                            Status Pendaftaran Terkait
                          </Label>
                          <Select
                            value={step.mappedStatus}
                            onValueChange={(val) => handleUpdateStep(step.id, { mappedStatus: val })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(OR_REGISTRATION_STATUS_LABELS).map(([key, label]) => (
                                <SelectItem 
                                  key={key} 
                                  value={key} 
                                  disabled={['draft', 'submitted', 'revision', 'rejected'].includes(key)}
                                >
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[9px] text-muted-foreground italic">
                            Tahap ini aktif jika status caang sudah mencapai status ini.
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-7 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Deskripsi Aktivitas
                        </Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                          placeholder="Jelaskan apa yang harus dilakukan caang di tahap ini..."
                          className="min-h-[95px] resize-none focus-visible:ring-primary py-2"
                        />
                      </div>

                      {/* Hapus */}
                      <div className="lg:col-span-1 flex items-start justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveStep(step.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Simpan */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-xl bg-card shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Info className="size-5 text-blue-500" />
          <span>Jangan lupa klik simpan untuk memperbarui timeline di dashboard pendaftar.</span>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="min-w-[160px]">
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>


    </div>
  );
}
