// components/attendance/EditStatusModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import { AttendanceStatus, getStatusLabel } from "@/types/attendance";
import { AttendanceWithUser } from "./AttendanceTable";

interface EditStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceWithUser;
  onSuccess: () => void;
}

export default function EditStatusModal({
  isOpen,
  onClose,
  attendance,
  onSuccess
}: EditStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("present");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const statusOptions: AttendanceStatus[] = ["present", "late", "permission", "sick"];

  useEffect(() => {
    if (isOpen && attendance.status !== "alpha") {
      setSelectedStatus(attendance.status as AttendanceStatus);
      setNotes(attendance.notes || "");
    } else {
      setSelectedStatus("present");
      setNotes("");
    }
    setShowConfirm(false);
  }, [isOpen, attendance]);

  const handleSave = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Anda harus login sebagai admin");
      return;
    }

    try {
      setLoading(true);

      // Document ID format: userId_activityId
      const attendanceId = `${attendance.userId}_${attendance.activityId}`;
      const attendanceRef = doc(db, "attendance", attendanceId);

      // Check if document exists
      const existingDoc = await getDoc(attendanceRef);
      const isUpdate = existingDoc.exists();

      const attendanceData = {
        activityId: attendance.activityId,
        userId: attendance.userId,
        status: selectedStatus,
        checkInTime: new Date(),
        checkInBy: currentUser.uid,
        notes: notes.trim() || `Diubah oleh admin: ${selectedStatus}`,
        createdAt: isUpdate ? existingDoc.data()?.createdAt : new Date(),
        updatedAt: new Date()
      };

      await setDoc(attendanceRef, attendanceData, { merge: true });

      toast.success(
        isUpdate ? "Status berhasil diperbarui" : "Status berhasil ditambahkan",
        {
          description: `${attendance.userData?.namaLengkap} - ${getStatusLabel(selectedStatus)}`
        }
      );

      onSuccess();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Edit Status Kehadiran
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {attendance.userData?.namaLengkap || "—"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              NIM: {attendance.userData?.nim || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status Kehadiran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setShowConfirm(false);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedStatus === status
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setShowConfirm(false);
              }}
              rows={3}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Confirmation Warning */}
          {showConfirm && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Konfirmasi Perubahan
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                    Anda akan mengubah status menjadi <strong>{getStatusLabel(selectedStatus)}</strong>. 
                    Klik &quot;Simpan&quot; lagi untuk konfirmasi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                showConfirm
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading ? "Menyimpan..." : showConfirm ? "Konfirmasi Simpan" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}