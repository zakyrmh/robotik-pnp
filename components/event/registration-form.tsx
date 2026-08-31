"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { uploadMemberPhotoAction, registerEventAction } from "@/lib/actions/event-registration";
import type { EventCategory, EventRulesVersion } from "@/types/event-registration";
import { Loader2, Plus, Trash2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface RegisterFormProps {
  category: EventCategory;
  rulesVersion?: EventRulesVersion | null;
}

interface MemberFormState {
  full_name: string;
  photo_url: string;
  role_in_team: string;
  isUploading: boolean;
  uploadError?: string;
}

export function RegistrationForm({ category, rulesVersion }: RegisterFormProps) {
  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamWhatsapp, setTeamWhatsapp] = useState("");
  const [acceptRules, setAcceptRules] = useState(false);

  const [members, setMembers] = useState<MemberFormState[]>([
    { full_name: "", photo_url: "", role_in_team: "Ketua Tim", isUploading: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successData, setSuccessData] = useState<{ registrationCode: string; redirectUrl?: string } | null>(null);

  const addMember = () => {
    if (members.length >= category.max_team_members) return;
    setMembers([
      ...members,
      { full_name: "", photo_url: "", role_in_team: "Anggota", isUploading: false },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, key: keyof MemberFormState, value: string) => {
    const next = [...members];
    next[index] = { ...next[index], [key]: value };
    setMembers(next);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    const next = [...members];
    next[index].isUploading = true;
    next[index].uploadError = undefined;
    setMembers([...next]);

    try {
      // Compress image on client
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 480,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await uploadMemberPhotoAction(formData);
      if (res.success) {
        next[index].photo_url = res.data;
      } else {
        next[index].uploadError = res.error || "Gagal mengunggah foto.";
      }
    } catch (err: unknown) {
      next[index].uploadError = (err as Error).message || "Gagal mengompres foto.";
    } finally {
      next[index].isUploading = false;
      setMembers([...next]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Validate photos
    for (let i = 0; i < members.length; i++) {
      if (!members[i].photo_url) {
        setErrorMessage(`Foto untuk anggota #${i + 1} (${members[i].full_name || "Anggota"}) wajib diunggah.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await registerEventAction({
        category_id: category.id,
        team_name: teamName,
        institution,
        origin_city: originCity,
        advisor_name: advisorName || undefined,
        team_email: teamEmail,
        team_whatsapp: teamWhatsapp,
        rules_version_id: rulesVersion?.id,
        accept_rules: acceptRules as true,
        members: members.map((m) => ({
          full_name: m.full_name,
          photo_url: m.photo_url,
          role_in_team: m.role_in_team,
        })),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Pendaftaran gagal.");
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setIsSubmitting(false);
        return;
      }

      setSuccessData({
        registrationCode: res.data.registrationCode,
        redirectUrl: res.data.redirectUrl,
      });

      // Trigger Midtrans Snap Popup if token present
      if (res.data.snapToken && window.snap) {
        window.snap.pay(res.data.snapToken, {
          onSuccess: () => {
            window.location.reload();
          },
          onPending: () => {
            window.location.reload();
          },
          onError: () => {
            alert("Pembayaran gagal atau dibatalkan.");
          },
        });
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Pendaftaran Berhasil!</h2>
        <p className="text-slate-600 mt-2">
          Kode Pendaftaran Tim Anda: <strong className="text-slate-900 font-mono text-lg">{successData.registrationCode}</strong>
        </p>
        <p className="text-sm text-slate-5-00 mt-4">
          Instruksi pembayaran dan link E-Tiket telah dikirimkan ke email <strong>{teamEmail}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Informasi Tim */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Informasi Tim & Pembimbing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tim *</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="Contoh: Robosoccer PNP A"
            />
            {fieldErrors.team_name && <p className="text-xs text-rose-600 mt-1">{fieldErrors.team_name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instansi / Sekolah / Kampus *</label>
            <input
              type="text"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="Contoh: Politeknik Negeri Padang"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kota / Kabupaten Asal *</label>
            <input
              type="text"
              required
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="Contoh: Kota Padang"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pembimbing (Opsional)</label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="Contoh: Dr. Eng. Pembimbing, S.T., M.T."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Tim *</label>
            <input
              type="email"
              required
              value={teamEmail}
              onChange={(e) => setTeamEmail(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="email.tim@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Official Tim *</label>
            <input
              type="tel"
              required
              value={teamWhatsapp}
              onChange={(e) => setTeamWhatsapp(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
              placeholder="08123456789"
            />
          </div>
        </div>
      </div>

      {/* Anggota Tim & Upload Foto */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold text-slate-800">
            Anggota Tim (Maks {category.max_team_members} Orang)
          </h3>
          {members.length < category.max_team_members && (
            <button
              type="button"
              onClick={addMember}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b5b84] hover:underline"
            >
              <Plus className="w-4 h-4" /> Tambah Anggota
            </button>
          )}
        </div>

        {members.map((member, idx) => (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anggota #{idx + 1}
              </span>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={member.full_name}
                  onChange={(e) => updateMember(idx, "full_name", e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
                  placeholder="Nama sesuai kartu identitas"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Peran dalam Tim</label>
                <select
                  value={member.role_in_team}
                  onChange={(e) => updateMember(idx, "role_in_team", e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
                >
                  <option value="Ketua Tim">Ketua Tim</option>
                  <option value="Anggota">Anggota</option>
                  <option value="Programmer">Programmer</option>
                  <option value="Mechanic">Mechanic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pas Foto (Verifikasi Wajah) *</label>
                {member.photo_url ? (
                  <div className="flex items-center gap-2 min-h-[44px]">
                    <img
                      src={member.photo_url}
                      alt="Foto anggota"
                      className="w-10 h-10 object-cover rounded-md border"
                    />
                    <span className="text-xs text-emerald-600 font-medium">Tersimpan</span>
                    <button
                      type="button"
                      onClick={() => updateMember(idx, "photo_url", "")}
                      className="text-xs text-slate-400 hover:underline ml-auto"
                    >
                      Ubah
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={member.isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(idx, file);
                      }}
                      className="hidden"
                      id={`photo-upload-${idx}`}
                    />
                    <label
                      htmlFor={`photo-upload-${idx}`}
                      className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      {member.isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#3b5b84]" /> Mengompres & Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-400" /> Upload Foto Wajah
                        </>
                      )}
                    </label>
                  </div>
                )}
                {member.uploadError && <p className="text-xs text-rose-600 mt-1">{member.uploadError}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Persetujuan Aturan Lomba */}
      <div className="space-y-3 pt-2">
        {rulesVersion && (
          <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-600 max-h-32 overflow-y-auto">
            <span className="font-semibold block mb-1">Aturan Perlombaan Versi {rulesVersion.version}:</span>
            {rulesVersion.content}
          </div>
        )}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={acceptRules}
            onChange={(e) => setAcceptRules(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-[#3b5b84] focus:ring-[#3b5b84]"
          />
          <span className="text-xs text-slate-700">
            Saya menyatakan data yang diisi adalah benar, foto anggota asli, dan menyetujui seluruh aturan perlombaan.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[48px] px-4 py-3 bg-[#f0975a] hover:bg-[#9a5b30] text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Memproses Pendaftaran...
          </>
        ) : (
          `Daftar & Lanjut Pembayaran (${category.registration_fee > 0 ? `Rp ${Number(category.registration_fee).toLocaleString("id-ID")}` : "GRATIS"})`
        )}
      </button>
    </form>
  );
}
