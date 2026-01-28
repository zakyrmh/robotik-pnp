"use client";

import { useState } from "react";
import { X, Lock, Loader2, AlertCircle } from "lucide-react";

interface ReAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

/**
 * Re-Authentication Dialog
 *
 * Dialog modal untuk meminta user memasukkan password kembali
 * sebelum melakukan aksi sensitif atau setelah session expired.
 */
export default function ReAuthDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  error: externalError,
  title = "Konfirmasi Identitas",
  description = "Untuk keamanan, masukkan password Anda untuk melanjutkan.",
}: ReAuthDialogProps) {
  const [password, setPassword] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const error = externalError || internalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setInternalError("Password wajib diisi.");
      return;
    }

    setInternalError(null);
    setIsSubmitting(true);

    try {
      const result = await onConfirm(password);

      if (result.success) {
        setPassword("");
        onClose();
      } else {
        setInternalError(result.error || "Re-autentikasi gagal.");
      }
    } catch {
      setInternalError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setPassword("");
      setInternalError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label
              htmlFor="reauth-password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              disabled={isSubmitting || isLoading}
              autoFocus
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !password.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Konfirmasi"
              )}
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Kami memerlukan konfirmasi untuk melindungi akun Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
