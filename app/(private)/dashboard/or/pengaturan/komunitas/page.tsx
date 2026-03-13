"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getCommunityLinks,
  saveCommunityLinks,
  CommunityLinkItem,
  CommunityPlatform,
} from "@/app/actions/or-settings.action";

export default function CommunityLinksPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<CommunityLinkItem[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    getCommunityLinks().then(({ data }) => {
      if (data) {
        setLinks(data.links || []);
      }
      setIsLoading(false);
    });
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddLink = () => {
    const newLink: CommunityLinkItem = {
      id: Math.random().toString(36).substring(2, 9),
      platform: "whatsapp",
      label: "",
      url: "",
      is_active: true,
    };
    setLinks([...links, newLink]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleUpdateLink = (id: string, updates: Partial<CommunityLinkItem>) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleSave = () => {
    startTransition(async () => {
      const { success, error } = await saveCommunityLinks({ links });

      if (success) {
        showFeedback("success", "Link komunitas berhasil disimpan.");
      } else {
        showFeedback("error", error || "Gagal menyimpan link.");
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
        <h1 className="text-2xl font-bold tracking-tight">Link Komunitas</h1>
        <p className="text-sm text-muted-foreground">
          Kelola link grup WhatsApp, server Discord, dan platform komunitas lainnya untuk calon anggota.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <LinkIcon className="size-5" />
                Daftar Link Komunitas
              </CardTitle>
              <CardDescription>
                Link yang aktif akan muncul di dashboard calon anggota.
              </CardDescription>
            </div>
            <Button onClick={handleAddLink} variant="outline" size="sm" className="h-8">
              <Plus className="mr-2 size-4" />
              Tambah Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {links.length === 0 ? (
              <div className="py-12 text-center border border-dashed rounded-lg">
                <Globe className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Belum ada link komunitas.</p>
                <p className="text-xs text-muted-foreground mt-1 text-balance max-w-xs mx-auto">
                  Tambahkan link grup WhatsApp atau server Discord agar pendaftar bisa bergabung ke komunitas.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`group relative flex flex-col gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
                      !link.is_active ? "opacity-60 bg-muted/20" : "bg-card"
                    }`}
                  >
                    <div className="grid flex-1 gap-4 sm:grid-cols-12 items-end">
                      {/* Platform */}
                      <div className="sm:col-span-3 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Platform</Label>
                        <Select
                          value={link.platform}
                          onValueChange={(val: CommunityPlatform) => handleUpdateLink(link.id, { platform: val })}
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

                      {/* Label */}
                      <div className="sm:col-span-3 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Label / Nama Grup</Label>
                        <Input
                          value={link.label}
                          onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
                          placeholder="Contoh: Grup WA Angkatan 2024"
                          className="h-9"
                        />
                      </div>

                      {/* URL */}
                      <div className="sm:col-span-4 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">URL Link</Label>
                        <div className="relative">
                          <Input
                            value={link.url}
                            onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                            placeholder="https://chat.whatsapp.com/..."
                            className="h-9 pr-8"
                          />
                          {link.url && (
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary">
                              <ExternalLink className="size-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Status & Delete */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="flex flex-col items-center gap-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Aktif</Label>
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={(val) => handleUpdateLink(link.id, { is_active: val })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive mt-auto"
                          onClick={() => handleRemoveLink(link.id)}
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

      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MessageSquare className="size-5 text-emerald-500" />
          <span>Simpan perubahan untuk memperbarui link komunitas yang dapat diakses oleh caang.</span>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="min-w-[140px]">
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      {feedback && (
        <div
          className={`animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-lg border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
