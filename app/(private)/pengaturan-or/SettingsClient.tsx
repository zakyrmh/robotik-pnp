"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings02Icon,
  Calendar03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { saveOrSettings, OrSettingsData, BankAccount, PanitiaContact, TimelineEvent } from "@/lib/actions/or-settings";

// Inline helper for Plus Icon SVG
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// Inline helper for Trash Icon SVG
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-rose-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

interface SettingsClientProps {
  initialSettings: OrSettingsData;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("utama");
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [periodeRecruitment, setPeriodeRecruitment] = useState(initialSettings.periode_recruitment);
  const [statusPendaftaran, setStatusPendaftaran] = useState(initialSettings.status_pendaftaran);
  
  // Datetime-local inputs need YYYY-MM-DDTHH:MM format
  const toDatetimeLocal = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [tanggalMulai, setTanggalMulai] = useState(toDatetimeLocal(initialSettings.tanggal_mulai));
  const [tanggalSelesai, setTanggalSelesai] = useState(toDatetimeLocal(initialSettings.tanggal_selesai));
  const [biayaPendaftaran, setBiayaPendaftaran] = useState(initialSettings.biaya_pendaftaran);
  
  // Dynamic Arrays State
  const [rekeningPenerima, setRekeningPenerima] = useState<BankAccount[]>(initialSettings.rekening_penerima);
  const [kontakPanitia, setKontakPanitia] = useState<PanitiaContact[]>(initialSettings.kontak_panitia);
  const [linkKomunitas, setLinkKomunitas] = useState(initialSettings.link_komunitas);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialSettings.timeline);

  // Add Item Temporary Forms State
  const [newBank, setNewBank] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [newContact, setNewContact] = useState({ name: "", phone_number: "" });
  const [newTimeline, setNewTimeline] = useState({ title: "", start_date: "", end_date: "", description: "" });

  // Bank handlers
  const handleAddBank = () => {
    if (!newBank.bank_name.trim() || !newBank.account_number.trim() || !newBank.account_holder.trim()) {
      toast.error("Mohon isi semua data rekening baru.");
      return;
    }
    setRekeningPenerima([...rekeningPenerima, { ...newBank }]);
    setNewBank({ bank_name: "", account_number: "", account_holder: "" });
    toast.success("Rekening berhasil ditambahkan ke daftar sementara.");
  };

  const handleRemoveBank = (index: number) => {
    setRekeningPenerima(rekeningPenerima.filter((_, i) => i !== index));
  };

  // Contact handlers
  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone_number.trim()) {
      toast.error("Mohon isi nama dan nomor kontak baru.");
      return;
    }
    setKontakPanitia([...kontakPanitia, { ...newContact }]);
    setNewContact({ name: "", phone_number: "" });
    toast.success("Kontak berhasil ditambahkan ke daftar sementara.");
  };

  const handleRemoveContact = (index: number) => {
    setKontakPanitia(kontakPanitia.filter((_, i) => i !== index));
  };

  // Timeline handlers
  const handleAddTimeline = () => {
    if (!newTimeline.title.trim() || !newTimeline.start_date || !newTimeline.end_date) {
      toast.error("Mohon isi judul dan batas waktu kegiatan.");
      return;
    }
    setTimeline([...timeline, {
      title: newTimeline.title,
      start_date: new Date(newTimeline.start_date).toISOString(),
      end_date: new Date(newTimeline.end_date).toISOString(),
      description: newTimeline.description
    }]);
    setNewTimeline({ title: "", start_date: "", end_date: "", description: "" });
    toast.success("Kegiatan timeline berhasil ditambahkan ke daftar sementara.");
  };

  const handleRemoveTimeline = (index: number) => {
    setTimeline(timeline.filter((_, i) => i !== index));
  };

  // Save Settings Submit
  const handleSaveSettings = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan Open Recruitment...");

    const payload: Partial<OrSettingsData> = {
      periode_recruitment: periodeRecruitment,
      status_pendaftaran: statusPendaftaran,
      tanggal_mulai: tanggalMulai ? new Date(tanggalMulai).toISOString() : null,
      tanggal_selesai: tanggalSelesai ? new Date(tanggalSelesai).toISOString() : null,
      biaya_pendaftaran: biayaPendaftaran,
      rekening_penerima: rekeningPenerima,
      kontak_panitia: kontakPanitia,
      link_komunitas: linkKomunitas,
      timeline: timeline
    };

    try {
      const res = await saveOrSettings(payload);
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menyimpan pengaturan.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-1 lg:px-4">
      {/* Header Banner - Dual Canvas dark base with Tech stripe */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor Tech Stripe at Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon icon={Settings02Icon} size={22} className="text-[#1c69d4] dark:text-[#0066b1]" />
              Pengaturan Open Recruitment
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Konfigurasi Sistem Penerimaan Calon Anggota Baru UKM Robotik PNP
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 bg-zinc-50/50 dark:bg-zinc-900/30">
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">STATUS:</span>
              {statusPendaftaran ? (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[8px] rounded-none px-1 py-0 uppercase">DIBUKA</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e22718]"></span>
                  </span>
                  <Badge className="bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/20 font-mono text-[8px] rounded-none px-1 py-0 uppercase">DITUTUP</Badge>
                </div>
              )}
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border border-zinc-900 dark:border-zinc-50 hover:bg-transparent dark:hover:bg-transparent hover:text-zinc-900 dark:hover:text-zinc-50 transition-all font-mono text-xs uppercase tracking-widest px-6 py-4 rounded-none cursor-pointer"
            >
              Simpan Semua
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-1 rounded-none w-full grid grid-cols-3">
          <TabsTrigger value="utama" className="font-mono text-xs uppercase tracking-wider rounded-none data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-50 data-[state=active]:text-white dark:data-[state=active]:text-zinc-950">
            <HugeiconsIcon icon={Settings02Icon} className="mr-1.5 size-3.5" />
            Utama & Biaya
          </TabsTrigger>
          <TabsTrigger value="rekening" className="font-mono text-xs uppercase tracking-wider rounded-none data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-50 data-[state=active]:text-white dark:data-[state=active]:text-zinc-950">
            <HugeiconsIcon icon={UserGroupIcon} className="mr-1.5 size-3.5" />
            Rekening & Panitia
          </TabsTrigger>
          <TabsTrigger value="timeline" className="font-mono text-xs uppercase tracking-wider rounded-none data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-50 data-[state=active]:text-white dark:data-[state=active]:text-zinc-950">
            <HugeiconsIcon icon={Calendar03Icon} className="mr-1.5 size-3.5" />
            Timeline Seleksi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pendaftaran & Biaya */}
        <TabsContent value="utama" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* General Configurations */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1c69d4] dark:text-[#0066b1] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                KONFIGURASI UTAMA
              </h3>

              <div className="space-y-2">
                <Label htmlFor="periode" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">PERIODE RECRUITMENT</Label>
                <Input
                  id="periode"
                  value={periodeRecruitment}
                  onChange={(e) => setPeriodeRecruitment(e.target.value)}
                  placeholder="Contoh: OR-21"
                  className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">STATUS PENDAFTARAN</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusPendaftaran(true)}
                    className={`py-2 text-center rounded-none font-mono text-xs uppercase tracking-wider border cursor-pointer transition-all ${
                      statusPendaftaran
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/50"
                        : "bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    BUKA PENDAFTARAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusPendaftaran(false)}
                    className={`py-2 text-center rounded-none font-mono text-xs uppercase tracking-wider border cursor-pointer transition-all ${
                      !statusPendaftaran
                        ? "bg-[#e22718]/10 text-[#e22718] border-[#e22718]/50 shadow-[0_0_8px_rgba(226,39,24,0.05)]"
                        : "bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    TUTUP PENDAFTARAN
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">TANGGAL PEMBUKAAN</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">TANGGAL PENUTUPAN</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Registration Fee & Links */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1c69d4] dark:text-[#0066b1] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                BIAYA & TAUTAN KOMUNITAS
              </h3>

              <div className="space-y-2">
                <Label htmlFor="biaya" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">BIAYA PENDAFTARAN (RP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">Rp</span>
                  <Input
                    id="biaya"
                    type="number"
                    min={0}
                    value={biayaPendaftaran}
                    onChange={(e) => setBiayaPendaftaran(parseInt(e.target.value) || 0)}
                    className="rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">LINK GROUP WHATSAPP</Label>
                <Input
                  id="wa"
                  type="url"
                  value={linkKomunitas.whatsapp_url}
                  onChange={(e) => setLinkKomunitas({ ...linkKomunitas, whatsapp_url: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">LINK SERVER DISCORD</Label>
                <Input
                  id="discord"
                  type="url"
                  value={linkKomunitas.discord_url}
                  onChange={(e) => setLinkKomunitas({ ...linkKomunitas, discord_url: e.target.value })}
                  placeholder="https://discord.gg/..."
                  className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

          </div>
        </TabsContent>

        {/* Tab 2: Rekening & Kontak */}
        <TabsContent value="rekening" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bank Accounts Section */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1c69d4] dark:text-[#0066b1] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                REKENING PENERIMA BIAYA
              </h3>

              {/* Dynamic Add Bank Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-100 dark:border-zinc-900">
                <div className="space-y-1">
                  <Label htmlFor="bankName" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">BANK / E-WALLET</Label>
                  <Input
                    id="bankName"
                    value={newBank.bank_name}
                    onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                    placeholder="E.g. Bank Mandiri"
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accNum" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">NO. REKENING</Label>
                  <Input
                    id="accNum"
                    value={newBank.account_number}
                    onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                    placeholder="E.g. 111222333"
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accHolder" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">NAMA PEMILIK</Label>
                  <div className="flex gap-1.5 items-end">
                    <Input
                      id="accHolder"
                      value={newBank.account_holder}
                      onChange={(e) => setNewBank({ ...newBank, account_holder: e.target.value })}
                      placeholder="E.g. Bendahara OR"
                      className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider px-2 flex-1"
                    />
                    <Button
                      onClick={handleAddBank}
                      type="button"
                      className="h-8 w-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none p-0 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </div>
              </div>

              {/* List of Accounts */}
              <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
                {rekeningPenerima.length === 0 ? (
                  <p className="text-[10px] font-mono text-zinc-400 uppercase py-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                    Tidak ada rekening terdaftar.
                  </p>
                ) : (
                  rekeningPenerima.map((account, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center border border-zinc-100 dark:border-zinc-900 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 py-0.5 rounded-none font-bold">
                            {account.bank_name}
                          </span>
                          <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-semibold">
                            {account.account_number}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                          A.N. {account.account_holder}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveBank(index)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-[#e22718] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-none cursor-pointer"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Committee Contacts Section */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1c69d4] dark:text-[#0066b1] border-b border-zinc-100 dark:border-zinc-900 pb-2">
                KONTAK PANITIA
              </h3>

              {/* Dynamic Add Contact Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-100 dark:border-zinc-900">
                <div className="space-y-1">
                  <Label htmlFor="contactName" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">NAMA PANITIA</Label>
                  <Input
                    id="contactName"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="E.g. Naufal Khalil"
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">NOMOR TELEPON</Label>
                  <div className="flex gap-1.5 items-end">
                    <Input
                      id="contactPhone"
                      value={newContact.phone_number}
                      onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                      placeholder="E.g. 0812345678"
                      className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] px-2 flex-1"
                    />
                    <Button
                      onClick={handleAddContact}
                      type="button"
                      className="h-8 w-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none p-0 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </div>
              </div>

              {/* List of Contacts */}
              <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
                {kontakPanitia.length === 0 ? (
                  <p className="text-[10px] font-mono text-zinc-400 uppercase py-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                    Tidak ada kontak panitia terdaftar.
                  </p>
                ) : (
                  kontakPanitia.map((contact, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center border border-zinc-100 dark:border-zinc-900 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      <div>
                        <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-semibold uppercase tracking-wider">
                          {contact.name}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 mt-1">
                          {contact.phone_number}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveContact(index)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-[#e22718] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-none cursor-pointer"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </TabsContent>

        {/* Tab 3: Timeline Seleksi */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none space-y-6">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1c69d4] dark:text-[#0066b1] border-b border-zinc-100 dark:border-zinc-900 pb-2">
              TIMELINE KEGIATAN SELEKSI
            </h3>

            {/* Dynamic Add Event Form */}
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-100 dark:border-zinc-900 space-y-4">
              <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500">Tambah Kegiatan Baru</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="eventTitle" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">JUDUL KEGIATAN</Label>
                  <Input
                    id="eventTitle"
                    value={newTimeline.title}
                    onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })}
                    placeholder="E.g. Tes Wawancara"
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="eventStart" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">TANGGAL MULAI</Label>
                  <Input
                    id="eventStart"
                    type="datetime-local"
                    value={newTimeline.start_date}
                    onChange={(e) => setNewTimeline({ ...newTimeline, start_date: e.target.value })}
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 text-[10px] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="eventEnd" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">TANGGAL SELESAI</Label>
                  <Input
                    id="eventEnd"
                    type="datetime-local"
                    value={newTimeline.end_date}
                    onChange={(e) => setNewTimeline({ ...newTimeline, end_date: e.target.value })}
                    className="h-8 rounded-none border-zinc-200 dark:border-zinc-800 text-[10px] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="eventDesc" className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">DESKRIPSI KEGIATAN</Label>
                <div className="flex gap-2 items-end">
                  <Textarea
                    id="eventDesc"
                    value={newTimeline.description}
                    onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })}
                    placeholder="E.g. Seleksi lisan meliputi motivasi dan komitmen organisasi."
                    className="h-14 rounded-none border-zinc-200 dark:border-zinc-800 text-xs placeholder-zinc-400 py-1 flex-1 min-h-[56px]"
                  />
                  <Button
                    onClick={handleAddTimeline}
                    type="button"
                    className="h-10 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none px-4 flex items-center justify-center gap-1.5 cursor-pointer font-mono text-[10px] uppercase tracking-widest shrink-0"
                  >
                    <PlusIcon />
                    TAMBAH
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Timeline Events */}
            <div className="space-y-4 relative pl-4 border-l border-zinc-200 dark:border-zinc-800 py-2">
              {timeline.length === 0 ? (
                <div className="pl-2">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase py-4">
                    Belum ada kegiatan dalam timeline.
                  </p>
                </div>
              ) : (
                timeline.map((event, index) => (
                  <div key={index} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[20.5px] top-1.5 h-3 w-3 rounded-full bg-[#1c69d4] dark:bg-[#0066b1] border-2 border-white dark:border-zinc-950" />
                    
                    <div className="border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 p-4 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30 transition-colors flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-bold uppercase tracking-wider">
                          {event.title}
                        </div>
                        <div className="font-mono text-[9px] text-[#1c69d4] dark:text-[#0066b1] font-semibold">
                          {new Date(event.start_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} 
                          <span className="text-zinc-400 mx-1">➜</span> 
                          {new Date(event.end_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                        {event.description && (
                          <p className="text-xs text-zinc-500 leading-relaxed pt-1.5">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemoveTimeline(index)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-[#e22718] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-none cursor-pointer shrink-0"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
