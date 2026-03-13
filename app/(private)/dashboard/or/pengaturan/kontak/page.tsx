"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Megaphone,
  UserPlus,
  Trash2,
  Save,
  Loader2,
  Phone,
  User,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getAnnouncementSettings,
  saveAnnouncementSettings,
  AnnouncementSettings,
  ContactPerson,
} from "@/app/actions/or-settings.action";

export default function ContactsSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    getAnnouncementSettings().then(({ data }) => {
      if (data) {
        setMessage(data.message || "");
        setIsActive(data.is_active);
        setContacts(data.contacts || []);
      }
      setIsLoading(false);
    });
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddContact = () => {
    const newContact: ContactPerson = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      role: "",
      phone: "628",
    };
    setContacts([...contacts, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleUpdateContact = (id: string, updates: Partial<ContactPerson>) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSave = () => {
    startTransition(async () => {
      const { success, error } = await saveAnnouncementSettings({
        message,
        is_active: isActive,
        contacts,
      });

      if (success) {
        showFeedback("success", "Pengumuman dan kontak berhasil disimpan.");
      } else {
        showFeedback("error", error || "Gagal menyimpan pengaturan.");
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
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Kontak & Pesan Pengumuman</h1>
        <p className="text-sm text-muted-foreground">
          Atur pesan broadcast yang tampil di dashboard pendaftar dan daftar panitia yang bisa dihubungi.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Pesan Pengumuman */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Megaphone className="size-5" />
                  Pesan Pengumuman
                </CardTitle>
                <CardDescription>
                  Pesan ini akan muncul di bagian atas dashboard setiap calom anggota.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="announcement-status" className="text-xs font-medium">Aktifkan</Label>
                <Switch
                  id="announcement-status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Isi Pesan Pengumuman</Label>
              <Textarea
                id="message"
                placeholder="Tulis pengumuman di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Tips: Gunakan kalimat yang jelas dan informatif untuk memudahkan pendaftar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kontak Panitia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="size-5" />
                  Kontak Panitia
                </CardTitle>
                <CardDescription>
                  Daftar personal panitia yang dapat dihubungi melalui WhatsApp.
                </CardDescription>
              </div>
              <Button onClick={handleAddContact} variant="outline" size="sm" className="h-8">
                <Plus className="mr-2 size-4" />
                Tambah Kontak
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <User className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada kontak yang ditambahkan.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="group relative flex flex-col sm:flex-row items-stretch gap-4 rounded-xl border p-4 transition-all hover:bg-accent/5"
                    >
                      <div className="grid flex-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nama Lengkap</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) => handleUpdateContact(contact.id, { name: e.target.value })}
                            placeholder="Contoh: Budi Santoso"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Role / Jabatan</Label>
                          <Input
                            value={contact.role}
                            onChange={(e) => handleUpdateContact(contact.id, { role: e.target.value })}
                            placeholder="Contoh: Kesekretariatan"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nomor WhatsApp (Format: 628...)</Label>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                            <Input
                              value={contact.phone}
                              onChange={(e) => handleUpdateContact(contact.id, { phone: e.target.value })}
                              placeholder="62812..."
                              className="h-9 pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end sm:border-l sm:pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="size-5 text-blue-500" />
          <span>Pengaturan ini berdampak langsung pada tampilan dashboard pendaftar.</span>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="min-w-[140px]">
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Simpan Semua
        </Button>
      </div>

      {feedback && (
        <div
          className={`animate-in fade-in slide-in-from-top-2 rounded-lg border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
