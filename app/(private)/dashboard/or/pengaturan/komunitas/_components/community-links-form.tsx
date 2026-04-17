"use client";

import { useState, useTransition } from "react";
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveCommunityLinks,
  type CommunityLinkItem,
  type CommunityPlatform,
} from "@/app/actions/or-settings.action";

interface Props {
  initialLinks: CommunityLinkItem[];
}

export function CommunityLinksForm({ initialLinks }: Props) {
  const [isPending, startTransition] = useTransition();
  const [links, setLinks] = useState<CommunityLinkItem[]>(initialLinks);

  const handleAdd = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        platform: "whatsapp",
        label: "",
        url: "",
        is_active: true,
      },
    ]);
  };

  const handleRemove = (id: string) =>
    setLinks((prev) => prev.filter((l) => l.id !== id));

  const handleUpdate = (id: string, updates: Partial<CommunityLinkItem>) =>
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCommunityLinks({ links });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Link komunitas berhasil disimpan.");
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-4 lg:max-w-full">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <LinkIcon className="size-5" /> Daftar Link Komunitas
              </CardTitle>
              <CardDescription>
                Link yang aktif akan muncul di dashboard calon anggota.
              </CardDescription>
            </div>
            <Button onClick={handleAdd} variant="outline" size="sm">
              <Plus className="mr-2 size-4" /> Tambah Link
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {links.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-lg">
              <Globe className="size-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Belum ada link komunitas.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tambahkan link grup WhatsApp atau Discord agar pendaftar bisa
                bergabung.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className={`flex flex-col gap-4 rounded-xl border p-4 transition-all ${
                    !link.is_active ? "opacity-60 bg-muted/20" : "bg-card"
                  }`}
                >
                  <div className="grid flex-1 gap-4 sm:grid-cols-12 items-end">
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Platform
                      </Label>
                      <Select
                        value={link.platform}
                        onValueChange={(val: CommunityPlatform) =>
                          handleUpdate(link.id, { platform: val })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="other">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        value={link.label}
                        onChange={(e) =>
                          handleUpdate(link.id, { label: e.target.value })
                        }
                        placeholder="Grup WA Angkatan 2024"
                        className="h-9"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        URL
                      </Label>
                      <div className="relative">
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            handleUpdate(link.id, { url: e.target.value })
                          }
                          placeholder="https://chat.whatsapp.com/..."
                          className="h-9 pr-8"
                        />
                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="flex flex-col items-center gap-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                          Aktif
                        </Label>
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(val) =>
                            handleUpdate(link.id, { is_active: val })
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 mt-auto"
                        onClick={() => handleRemove(link.id)}
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
