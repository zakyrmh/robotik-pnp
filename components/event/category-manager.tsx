"use client";

import { useState } from "react";
import { saveEventCategoryAction } from "@/lib/actions/event-admin";
import type { EventCategory } from "@/types/event-registration";
import { Plus, Edit2, Loader2, Trophy, Users, DollarSign } from "lucide-react";

interface CategoryManagerProps {
  initialCategories: EventCategory[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<EventCategory[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [maxMembers, setMaxMembers] = useState<number>(3);
  const [quota, setQuota] = useState<number>(32);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setSlug("");
    setName("");
    setDescription("");
    setFee(0);
    setMaxMembers(3);
    setQuota(32);
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: EventCategory) => {
    setEditingId(cat.id);
    setSlug(cat.slug);
    setName(cat.name);
    setDescription(cat.description || "");
    setFee(cat.registration_fee);
    setMaxMembers(cat.max_team_members);
    setQuota(cat.quota);
    setIsActive(cat.is_active);
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
      max_team_members: maxMembers,
      quota,
      is_active: isActive,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (editingId) {
        setCategories(categories.map((c) => (c.id === editingId ? res.data : c)));
      } else {
        setCategories([...categories, res.data]);
      }
      setIsModalOpen(false);
    } else {
      setErrorMsg(res.error || "Gagal menyimpan kategori.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#3b5b84]" /> Kategori Lomba Lomba
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b5b84] text-white rounded-lg text-xs font-semibold hover:bg-[#2f4a6d] transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${cat.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {cat.is_active ? "Aktif" : "Non-Aktif"}
                </span>
                <h3 className="font-bold text-slate-900 mt-1">{cat.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{cat.slug}</p>
              </div>
              <button
                onClick={() => openEditModal(cat)}
                className="p-1.5 text-slate-400 hover:text-[#3b5b84] hover:bg-slate-50 rounded-md"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{cat.description || "Tidak ada deskripsi."}</p>

            <div className="pt-2 border-t flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                {cat.registration_fee > 0 ? `Rp ${Number(cat.registration_fee).toLocaleString("id-ID")}` : "Gratis"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Quota: {cat.quota} tim (Maks {cat.max_team_members} org/tim)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {editingId ? "Edit Kategori Lomba" : "Tambah Kategori Lomba Baru"}
            </h3>

            {errorMsg && <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Robot Soccer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                    placeholder="robot-soccer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi Lomba</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Biaya (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kuota Tim *</label>
                  <input
                    type="number"
                    required
                    value={quota}
                    onChange={(e) => setQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Maks Anggota *</label>
                  <input
                    type="number"
                    required
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#3b5b84]"
                />
                <span className="text-xs text-slate-700 font-medium">Status Kategori Aktif</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#3b5b84] text-white text-xs font-semibold rounded-lg hover:bg-[#2f4a6d]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
