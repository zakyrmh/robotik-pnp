"use client";

import { useState } from "react";
import { saveEventCategoryAction } from "@/lib/actions/event-admin";
import type { EventCategory } from "@/types/event-registration";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Loader2,
  Trophy,
  Users,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryManagerProps {
  initialCategories: EventCategory[];
}

const inputClass =
  "w-full min-h-[44px] px-3 py-2 border border-border rounded-md bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

const labelClass = "block text-sm font-medium text-foreground mb-1";

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] =
    useState<EventCategory[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [feeBatch1, setFeeBatch1] = useState<number>(0);
  const [feeBatch2, setFeeBatch2] = useState<number>(0);
  const [maxMembers, setMaxMembers] = useState<number>(3);
  const [quota, setQuota] = useState<number>(32);
  const [isActive, setIsActive] = useState(true);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setSlug("");
    setName("");
    setDescription("");
    setFee(0);
    setFeeBatch1(0);
    setFeeBatch2(0);
    setMaxMembers(3);
    setQuota(32);
    setIsActive(true);
    setWhatsappGroupUrl("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: EventCategory) => {
    setEditingId(cat.id);
    setSlug(cat.slug);
    setName(cat.name);
    setDescription(cat.description || "");
    setFee(cat.registration_fee);
    setFeeBatch1(cat.registration_fee_batch1 ?? cat.registration_fee);
    setFeeBatch2(cat.registration_fee_batch2 ?? cat.registration_fee);
    setMaxMembers(cat.max_team_members);
    setQuota(cat.quota);
    setIsActive(cat.is_active);
    setWhatsappGroupUrl(cat.whatsapp_group_url || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await saveEventCategoryAction(editingId, {
      slug,
      name,
      description,
      registration_fee: fee,
      registration_fee_batch1: feeBatch1,
      registration_fee_batch2: feeBatch2,
      max_team_members: maxMembers,
      quota,
      is_active: isActive,
      whatsapp_group_url: whatsappGroupUrl,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (editingId) {
        setCategories(
          categories.map((c) => (c.id === editingId ? res.data : c)),
        );
      } else {
        setCategories([...categories, res.data]);
      }
      setIsModalOpen(false);
    } else {
      setErrorMsg(res.error || "Gagal menyimpan kategori.");
    }
  };

  const formatFee = (v: number) =>
    v > 0 ? `Rp ${Number(v).toLocaleString("id-ID")}` : "Gratis";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-md font-semibold text-foreground">
          <Trophy className="size-5 shrink-0 text-primary" aria-hidden="true" />
          Kategori Lomba
          <Badge variant="secondary" className="font-mono tabular-nums">
            {categories.length}
          </Badge>
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-4" aria-hidden="true" /> Tambah Kategori
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Trophy
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="mt-2 font-display text-md font-semibold text-foreground">
            Belum ada kategori lomba
          </h3>
          <p className="mx-auto mt-1 max-w-prose text-sm text-muted-foreground">
            Tambahkan kategori pertama agar pendaftaran dapat dibuka.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <article
              key={cat.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "uppercase",
                      cat.is_active
                        ? "border-success/30 bg-success-soft text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {cat.is_active ? "Aktif" : "Non-Aktif"}
                  </Badge>
                  <h3 className="mt-1.5 truncate font-display text-md font-semibold text-foreground">
                    {cat.name}
                  </h3>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {cat.slug}
                  </p>
                </div>
                <button
                  onClick={() => openEditModal(cat)}
                  aria-label={`Edit kategori ${cat.name}`}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                >
                  <Edit2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                {cat.description || "Tidak ada deskripsi."}
              </p>

              <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Batch 1</dt>
                  <dd className="font-mono font-semibold text-success">
                    {formatFee(
                      cat.registration_fee_batch1 ?? cat.registration_fee,
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Batch 2</dt>
                  <dd className="font-mono font-semibold text-warning">
                    {formatFee(
                      cat.registration_fee_batch2 ?? cat.registration_fee,
                    )}
                  </dd>
                </div>
                {cat.whatsapp_group_url && (
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 text-xs">
                    <span className="flex shrink-0 items-center gap-1 font-medium text-success">
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                      Grup WA
                    </span>
                    <a
                      href={cat.whatsapp_group_url}
                      target="_blank"
                      rel="noreferrer"
                      className="max-w-[160px] truncate text-muted-foreground hover:text-primary hover:underline"
                    >
                      {cat.whatsapp_group_url}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-dashed border-border pt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden="true" />
                    Kuota {cat.quota} tim · maks {cat.max_team_members} org/tim
                  </span>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Edit kategori" : "Tambah kategori"}
        >
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-md font-semibold text-foreground">
                {editingId
                  ? "Edit Kategori Lomba"
                  : "Tambah Kategori Lomba Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
              >
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId)
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-"),
                        );
                    }}
                    className={inputClass}
                    placeholder="Robot Soccer"
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={cn(inputClass, "font-mono text-xs")}
                    placeholder="robot-soccer"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Deskripsi Lomba</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(inputClass, "min-h-[80px]")}
                  rows={2}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Link Grup WhatsApp Official Kategori
                </label>
                <input
                  type="url"
                  value={whatsappGroupUrl}
                  onChange={(e) => setWhatsappGroupUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className={cn(inputClass, "text-xs")}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Link ini dikirim via email & ditampilkan saat pendaftaran
                  lunas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Biaya Batch 1 (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={feeBatch1}
                    onChange={(e) => setFeeBatch1(Number(e.target.value))}
                    className={cn(inputClass, "font-mono")}
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className={labelClass}>Biaya Batch 2 (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={feeBatch2}
                    onChange={(e) => setFeeBatch2(Number(e.target.value))}
                    className={cn(inputClass, "font-mono")}
                    placeholder="200000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Biaya Default (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className={cn(inputClass, "font-mono")}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fallback bila batch belum diatur.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Kuota Tim *</label>
                  <input
                    type="number"
                    required
                    value={quota}
                    onChange={(e) => setQuota(Number(e.target.value))}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Maks Anggota *</label>
                  <input
                    type="number"
                    required
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>

              <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Status Kategori Aktif
                </span>
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isSubmitting ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
