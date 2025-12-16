import { User } from "@/types/users";
import React from "react";

interface AccessDeniedProps {
  user: User;
}

export default function AccessDenied({ user }: AccessDeniedProps) {
  if (user.deletedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Akun Dinonaktifkan
          </h2>
          <p className="text-red-600 dark:text-red-300">
            Maaf, akun Anda tidak dapat mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  if (user.blacklistInfo?.isBlacklisted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Akun Diblokir
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">
            Akun Anda telah di-blacklist dan tidak dapat mengakses sistem.
          </p>
          {user.blacklistInfo.reason && (
            <div className="bg-white p-4 rounded-xl border border-red-100 dark:bg-red-950/50 dark:border-red-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                Alasan:
              </p>
              <p className="text-red-600 dark:text-red-300">
                {user.blacklistInfo.reason}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">
            Akun Tidak Aktif
          </h2>
          <p className="text-yellow-600 dark:text-yellow-300">
            Silakan hubungi admin untuk mengaktifkan akun Anda.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
