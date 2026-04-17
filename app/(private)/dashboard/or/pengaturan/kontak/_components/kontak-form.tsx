"use client";

import { useState, useTransition } from "react";
import {
  Megaphone,
  UserPlus,
  Trash2,
  Save,
  Loader2,
  Phone,
  User,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  saveAnnouncementSettings,
  type AnnouncementSettings,
  type ContactPerson,
} from "@/app/actions/or-settings.action";

interface Props {
  initialData: AnnouncementSettings | null;
}

export function KontakForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(initialData?.message ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [contacts, setContacts] = useState<ContactPerson[]>(
    initialData?.contacts ?? [],
  );

  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        name: "",
        role: "",
        phone: "628",
      },
    ]);
  };

  const handleRemove = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  const handleUpdate = (id: string, updates: Partial<ContactPerson>) =>
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAnnouncementSettings({
        message,
        is_active: isActive,
        contacts,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pengumuman dan kontak berhasil disimpan.");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-4 lg:max-w-full">
      {/* Pesan Pengumuman */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Megaphone className="size-5" /> Pesan Pengumuman
              </CardTitle>
              <CardDescription>
                Pesan ini muncul di bagian atas dashboard setiap calon anggota.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="announcement-active"
                className="text-xs font-medium"
              >
                Aktifkan
              </Label>
              <Switch
                id="announcement-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Isi Pesan</Label>
            <Textarea
              placeholder="Tulis pengumuman di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Gunakan kalimat yang jelas dan informatif untuk memudahkan
              pendaftar.
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
                <UserPlus className="size-5" /> Kontak Panitia
              </CardTitle>
              <CardDescription>
                Daftar panitia yang dapat dihubungi melalui WhatsApp.
              </CardDescription>
            </div>
            <Button onClick={handleAddContact} variant="outline" size="sm">
              <Plus className="mr-2 size-4" /> Tambah Kontak
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {contacts.length === 0 ? (
            <div className="py-8 text-center border border-dashed rounded-lg">
              <User className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Belum ada kontak yang ditambahkan.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col sm:flex-row items-stretch gap-4 rounded-xl border p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="grid flex-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nama Lengkap</Label>
                      <Input
                        value={contact.name}
                        onChange={(e) =>
                          handleUpdate(contact.id, { name: e.target.value })
                        }
                        placeholder="Budi Santoso"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Role / Jabatan</Label>
                      <Input
                        value={contact.role}
                        onChange={(e) =>
                          handleUpdate(contact.id, { role: e.target.value })
                        }
                        placeholder="Kesekretariatan"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nomor WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                          value={contact.phone}
                          onChange={(e) =>
                            handleUpdate(contact.id, { phone: e.target.value })
                          }
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
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(contact.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
              <Save className="mr-2 size-4" /> Simpan Semua
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
