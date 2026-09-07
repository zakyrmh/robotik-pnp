"use client";

import { useState } from "react";
import { getMemberByQrTokenAction, submitFaceVerificationAction, logEventViolationAction } from "@/lib/actions/event-admin";
import type { EventTeamMember, EventRegistration } from "@/types/event-registration";
import { QrCode, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, UserCheck, UserX } from "lucide-react";

export function FaceVerificationScanner() {
  const [qrTokenInput, setQrTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<(EventTeamMember & { registration: EventRegistration }) | null>(null);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Violation modal state
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationType, setViolationType] = useState("joki");
  const [warningNumber, setWarningNumber] = useState(1);
  const [violationDesc, setViolationDesc] = useState("");

  const handleScanLookup = async (token: string) => {
    if (!token.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setMemberData(null);

    const res = await getMemberByQrTokenAction(token.trim());
    setIsLoading(false);

    if (res.success) {
      setMemberData(res.data);
    } else {
      setErrorMsg(res.error || "Anggota tidak ditemukan.");
    }
  };

  const handleVerifyResult = async (result: "verified" | "mismatch") => {
    if (!memberData) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await submitFaceVerificationAction(memberData.id, result, notes);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Verifikasi wajah berhasil dicatat sebagai: ${result.toUpperCase()}`);
      setMemberData({ ...memberData, verification_status: result });
    } else {
      setErrorMsg(res.error || "Gagal mencatat verifikasi.");
    }
  };

  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData) return;

    setIsSubmitting(true);
    const res = await logEventViolationAction(
      memberData.registration.id,
      violationType,
      warningNumber,
      violationDesc
    );
    setIsSubmitting(false);

    if (res.success) {
      setShowViolationModal(false);
      setSuccessMsg(`Pelanggaran "${violationType}" berhasil dicatat untuk tim ${memberData.registration.team_name}.`);
    } else {
      setErrorMsg(res.error || "Gagal mencatat pelanggaran.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search/Scan QR Input */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#3b5b84]" /> Scan / Input Token QR Kokarde Anggota
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste member_qr_token (UUID)..."
            value={qrTokenInput}
            onChange={(e) => setQrTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleScanLookup(qrTokenInput);
            }}
            className="flex-1 min-h-[44px] px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3b5b84]"
          />
          <button
            onClick={() => handleScanLookup(qrTokenInput)}
            disabled={isLoading}
            className="px-4 py-2 bg-[#3b5b84] hover:bg-[#2f4a6d] text-white rounded-lg text-xs font-semibold"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cek QR"}
          </button>
        </div>

        {errorMsg && <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>}
        {successMsg && <p className="text-xs text-emerald-600 font-medium">{successMsg}</p>}
      </div>

      {/* Member Display & Face Matching Card */}
      {memberData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs text-slate-500 block">Kategori Lomba:</span>
              <h3 className="font-bold text-slate-900 text-lg">{memberData.registration.category?.name || "Minangkabau Robot Contest"}</h3>
              <p className="text-xs text-[#3b5b84] font-semibold">Tim: {memberData.registration.team_name} ({memberData.registration.institution})</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                memberData.verification_status === "verified"
                  ? "bg-emerald-100 text-emerald-800"
                  : memberData.verification_status === "mismatch"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {memberData.verification_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-center space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase block">Pas Foto Terdaftar</span>
              <img
                src={memberData.photo_url}
                alt={memberData.full_name}
                className="w-48 h-48 object-cover rounded-xl border-2 border-slate-300 mx-auto shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 block">Nama Anggota:</span>
                <p className="text-base font-bold text-slate-900">{memberData.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Peran dalam Tim:</span>
                <p className="text-sm font-semibold text-slate-700">{memberData.role_in_team}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Kode Pendaftaran Tim:</span>
                <p className="text-xs font-mono font-bold text-slate-800">{memberData.registration.registration_code}</p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Catatan Panitia (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan hasil pencocokan fisik..."
                  className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVerifyResult("verified")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <UserCheck className="w-4 h-4" /> Wajah Cocok (Verified)
              </button>
              <button
                onClick={() => handleVerifyResult("mismatch")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <UserX className="w-4 h-4" /> Wajah Beda (Mismatch)
              </button>
            </div>

            <button
              onClick={() => setShowViolationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-semibold"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Catat Pelanggaran Tim
            </button>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      {showViolationModal && memberData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Catat Pelanggaran Tim ({memberData.registration.team_name})
            </h3>

            <form onSubmit={handleLogViolation} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Jenis Pelanggaran *</label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="joki">Indikasi Joki / Wajah Tidak Cocok</option>
                  <option value="terlambat">Keterlambatan Ulang / Briefing</option>
                  <option value="pelanggaran_teknis">Pelanggaran Spesifikasi Robot / Teknis</option>
                  <option value="perilaku">Pelanggaran Etika & Perilaku</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Tingkat Peringatan (SP) *</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={warningNumber}
                  onChange={(e) => setWarningNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Keterangan / Deskripsi Kronologi</label>
                <textarea
                  value={violationDesc}
                  onChange={(e) => setViolationDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Tuliskan alasan / bukti singkat..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowViolationModal(false)}
                  className="px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pelanggaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
