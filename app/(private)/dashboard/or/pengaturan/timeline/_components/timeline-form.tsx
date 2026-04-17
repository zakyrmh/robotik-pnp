"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Clock,
  LayoutList,
  Target,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  savePipelineSteps,
  type PipelineStep,
} from "@/app/actions/or-settings.action";
import { OR_PIPELINE_STATUS_LABELS } from "@/lib/db/schema/or";

interface Props {
  initialSteps: PipelineStep[];
}

export function TimelineForm({ initialSteps }: Props) {
  const [isPending, startTransition] = useTransition();
  const [steps, setSteps] = useState<PipelineStep[]>(
    [...initialSteps].sort((a, b) => a.order - b.order),
  );
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const handleAdd = () => {
    const nextOrder =
      steps.length > 0 ? Math.max(...steps.map((s) => s.order)) + 1 : 1;
    const newId = Math.random().toString(36).slice(2, 9);
    setSteps((prev) => [
      ...prev,
      {
        id: newId,
        label: "",
        description: "",
        mappedStatus: "accepted",
        order: nextOrder,
      },
    ]);
    setLastAddedId(newId);
  };

  const handleRemove = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  const handleUpdate = (id: string, updates: Partial<PipelineStep>) =>
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );

  const moveStep = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePipelineSteps(steps);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Timeline seleksi berhasil disimpan.");
      }
    });
  };

  return (
    <div className="max-w-5xl space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <LayoutList className="size-5" /> Daftar Tahapan
              </CardTitle>
              <CardDescription>
                Urutan tahapan ditentukan oleh nomor di sisi kiri.
              </CardDescription>
            </div>
            <Button onClick={handleAdd} variant="outline" size="sm">
              <Plus className="mr-2 size-4" /> Tambah Tahapan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {steps.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl">
              <Clock className="size-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Belum ada tahapan seleksi.
              </p>
              <Button
                onClick={handleAdd}
                variant="ghost"
                size="sm"
                className="mt-2 text-primary"
              >
                Klik untuk mulai membuat
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="group flex items-stretch gap-4 rounded-xl border bg-card p-4 shadow-sm hover:border-primary/30 transition-colors"
                >
                  {/* Urutan & sortir */}
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

                  {/* Form */}
                  <div className="grid flex-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Label Tahapan
                        </Label>
                        <Input
                          value={step.label}
                          onChange={(e) =>
                            handleUpdate(step.id, { label: e.target.value })
                          }
                          placeholder="Pelatihan Robotik"
                          className="h-9"
                          autoFocus={step.id === lastAddedId}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <Target className="size-3" /> Status Terkait
                        </Label>
                        <Select
                          value={step.mappedStatus}
                          onValueChange={(val) =>
                            handleUpdate(step.id, { mappedStatus: val })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(OR_PIPELINE_STATUS_LABELS).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Deskripsi Aktivitas
                      </Label>
                      <Textarea
                        value={step.description}
                        onChange={(e) =>
                          handleUpdate(step.id, { description: e.target.value })
                        }
                        placeholder="Jelaskan apa yang harus dilakukan caang di tahap ini..."
                        className="min-h-[95px] resize-none"
                      />
                    </div>

                    <div className="lg:col-span-1 flex items-start justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemove(step.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" /> Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
