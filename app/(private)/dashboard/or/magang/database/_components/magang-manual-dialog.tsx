"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, BookOpen, MapPin, Briefcase, Loader2 } from "lucide-react";
import { createManualInternshipApplication, type ManualApplicationPayload } from "@/app/actions/magang-admin.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MagangManualDialogProps {
  userId: string | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Allowed Departments as defined in forms
const PILIHAN_DIVISI = ["KRAI", "KRSBI-B", "KRSBI-H", "KRTI", "KRSRI"];
const PILIHAN_DEPARTEMEN = ["Kestari", "Maintanance", "Produksi", "Humas", "Pubdok", "Kpsdm", "Ristek"];

export function MagangManualDialog({ userId, userName, open, onOpenChange }: MagangManualDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // States
  const [minat, setMinat] = useState("");
  const [alasanMinat, setAlasanMinat] = useState("");
  const [skill, setSkill] = useState("");
  
  const [divisi1, setDivisi1] = useState("");
  const [yakinDivisi1, setYakinDivisi1] = useState("Yakin");
  const [alasanDivisi1, setAlasanDivisi1] = useState("");
  const [divisi2, setDivisi2] = useState("");
  const [yakinDivisi2, setYakinDivisi2] = useState("Yakin");
  const [alasanDivisi2, setAlasanDivisi2] = useState("");

  const [dept1, setDept1] = useState("");
  const [yakinDept1, setYakinDept1] = useState("Yakin");
  const [alasanDept1, setAlasanDept1] = useState("");
  const [dept2, setDept2] = useState("");
  const [yakinDept2, setYakinDept2] = useState("Yakin");
  const [alasanDept2, setAlasanDept2] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!open) {
      setTimeout(() => {
        if (!isMounted) return;
        setMinat(""); setAlasanMinat(""); setSkill("");
        setDivisi1(""); setYakinDivisi1("Yakin"); setAlasanDivisi1("");
        setDivisi2(""); setYakinDivisi2("Yakin"); setAlasanDivisi2("");
        setDept1(""); setYakinDept1("Yakin"); setAlasanDept1("");
        setDept2(""); setYakinDept2("Yakin"); setAlasanDept2("");
      }, 0);
    }
    return () => { isMounted = false; };
  }, [open]);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!minat || !divisi1 || !dept1) {
      toast.error("Mohon lengkapi Bidang, Pilihan Divisi Utama 1, dan Pilihan Departemen Utama 1.");
      return;
    }

    setIsPending(true);
    const payload: ManualApplicationPayload = {
      user_id: userId,
      minat,
      alasan_minat: alasanMinat,
      skill,
      divisi_1: divisi1,
      yakin_divisi_1: yakinDivisi1,
      alasan_divisi_1: alasanDivisi1,
      divisi_2: divisi2 && divisi2 !== "none" ? divisi2 : null,
      yakin_divisi_2: divisi2 && divisi2 !== "none" ? yakinDivisi2 : null,
      alasan_divisi_2: divisi2 && divisi2 !== "none" ? alasanDivisi2 : null,
      dept_1: dept1,
      yakin_dept_1: yakinDept1,
      alasan_dept_1: alasanDept1,
      dept_2: dept2 && dept2 !== "none" ? dept2 : null,
      yakin_dept_2: dept2 && dept2 !== "none" ? yakinDept2 : null,
      alasan_dept_2: dept2 && dept2 !== "none" ? alasanDept2 : null,
    };

    const result = await createManualInternshipApplication(payload);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Caang berhasil didaftarkan secara manual!");
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-dvh sm:h-auto max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-blue-50/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <UserPlus className="h-5 w-5" />
            Daftarkan Magang Manual
          </DialogTitle>
          <DialogDescription>
            Menambahkan data magang secara administratif untuk <span className="font-semibold text-foreground">{userName}</span>. Sistem akan menyimpannya sebagai jalur admin override.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 min-h-0">
          <div className="p-6 space-y-8 max-w-full overflow-hidden">
            
            {/* STEP 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                <BookOpen className="h-5 w-5" />
                <span>Tahap 1: Minat & Kemampuan</span>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Bidang yang Diminati</Label>
                  <Select value={minat} onValueChange={setMinat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Bidang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programmer">Programmer</SelectItem>
                      <SelectItem value="Mekanik">Mekanik</SelectItem>
                      <SelectItem value="Elektronika">Elektronika</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alasan Minat</Label>
                  <Textarea value={alasanMinat} onChange={(e) => setAlasanMinat(e.target.value)} placeholder="Alasan ketertarikan pada bidang tersebut..." className="resize-none" />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Skill & Pengalaman</Label>
                  <Textarea value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Uraikan pengalaman atau keahlian dasar terkait..." className="resize-none" />
                </div>
              </div>
            </section>

            {/* STEP 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 font-semibold border-b pb-2">
                <MapPin className="h-5 w-5" />
                <span>Tahap 2: Ploting Divisi</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* DIVISI 1 */}
                <div className="space-y-4 bg-white p-4 border rounded-xl shadow-sm">
                  <Label className="text-orange-600 font-bold">Pilihan 1 (Utama)</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">Pilih Divisi</Label>
                    <Select value={divisi1} onValueChange={setDivisi1}>
                      <SelectTrigger><SelectValue placeholder="Pilih Divisi" /></SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DIVISI.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tingkat Keyakinan</Label>
                    <Select value={yakinDivisi1} onValueChange={setYakinDivisi1}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yakin">Yakin</SelectItem>
                        <SelectItem value="Tidak Yakin">Tidak Yakin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alasan Memilih</Label>
                    <Textarea value={alasanDivisi1} onChange={(e) => setAlasanDivisi1(e.target.value)} placeholder="Alasan..." className="resize-none h-20" />
                  </div>
                </div>

                {/* DIVISI 2 */}
                <div className="space-y-4 bg-muted/20 p-4 border rounded-xl shadow-sm">
                  <Label className="text-muted-foreground font-bold">Pilihan 2 (Alternatif)</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">Pilih Divisi (Opsional)</Label>
                    <Select value={divisi2} onValueChange={setDivisi2}>
                      <SelectTrigger><SelectValue placeholder="Pilih Divisi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Kosongkan --</SelectItem>
                        {PILIHAN_DIVISI.map(opt => <SelectItem key={opt} value={opt} disabled={opt === divisi1}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tingkat Keyakinan</Label>
                    <Select value={yakinDivisi2} onValueChange={setYakinDivisi2}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yakin">Yakin</SelectItem>
                        <SelectItem value="Tidak Yakin">Tidak Yakin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alasan Memilih</Label>
                    <Textarea value={alasanDivisi2} onChange={(e) => setAlasanDivisi2(e.target.value)} placeholder="Alasan..." className="resize-none h-20" />
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                <Briefcase className="h-5 w-5" />
                <span>Tahap 3: Ploting Departemen</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* DEPT 1 */}
                <div className="space-y-4 bg-white p-4 border rounded-xl shadow-sm">
                  <Label className="text-blue-600 font-bold">Pilihan Utama</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">Pilih Departemen</Label>
                    <Select value={dept1} onValueChange={setDept1}>
                      <SelectTrigger><SelectValue placeholder="Pilih Departemen" /></SelectTrigger>
                      <SelectContent>
                        {PILIHAN_DEPARTEMEN.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tingkat Keyakinan</Label>
                    <Select value={yakinDept1} onValueChange={setYakinDept1}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yakin">Yakin</SelectItem>
                        <SelectItem value="Tidak Yakin">Tidak Yakin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alasan Memilih</Label>
                    <Textarea value={alasanDept1} onChange={(e) => setAlasanDept1(e.target.value)} placeholder="Alasan..." className="resize-none h-20" />
                  </div>
                </div>

                {/* DEPT 2 */}
                <div className="space-y-4 bg-muted/20 p-4 border rounded-xl shadow-sm">
                  <Label className="text-muted-foreground font-bold">Pilihan Tambahan</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">Pilih Departemen (Opsional)</Label>
                    <Select value={dept2} onValueChange={setDept2}>
                      <SelectTrigger><SelectValue placeholder="Pilih Departemen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Kosongkan --</SelectItem>
                        {PILIHAN_DEPARTEMEN.map(opt => <SelectItem key={opt} value={opt} disabled={opt === dept1}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tingkat Keyakinan</Label>
                    <Select value={yakinDept2} onValueChange={setYakinDept2}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yakin">Yakin</SelectItem>
                        <SelectItem value="Tidak Yakin">Tidak Yakin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alasan Memilih</Label>
                    <Textarea value={alasanDept2} onChange={(e) => setAlasanDept2(e.target.value)} placeholder="Alasan..." className="resize-none h-20" />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0 z-10">
          <Button variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Batal</Button>
          <Button disabled={isPending} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Formulir Manual
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
