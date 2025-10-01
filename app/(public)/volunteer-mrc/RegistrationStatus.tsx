'use client';

import { motion } from 'framer-motion';
import {Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface RegistrationStatusProps {
  status: 'not-started' | 'closed';
}

export default function RegistrationStatus({ status }: RegistrationStatusProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 dark:bg-slate-900 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700"
        >
          {/* Header Gradient */}
          <div className={`h-2 bg-gradient-to-r ${
            status === 'not-started' 
              ? 'from-blue-500 via-cyan-400 to-teal-500' 
              : 'from-gray-500 via-gray-400 to-gray-600'
          }`} />

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${
                status === 'not-started' 
                  ? 'bg-blue-100 dark:bg-blue-950' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {status === 'not-started' ? (
                  <Clock className={`w-12 h-12 ${
                    status === 'not-started' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                ) : (
                  <AlertCircle className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {status === 'not-started' ? 'Pendaftaran Belum Dibuka' : 'Pendaftaran Ditutup'}
            </h1>

            <h2 className="text-xl font-medium text-center text-purple-600 dark:text-purple-400 mb-6">
              Volunteer Minangkabau Robot Contest
            </h2>

            {/* Message */}
            <div className={`p-4 rounded-lg border ${
              status === 'not-started'
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start gap-3">
                {status === 'not-started' ? (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium mb-2 ${
                    status === 'not-started'
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {status === 'not-started' 
                      ? 'Persiapkan Diri Anda!' 
                      : 'Terima Kasih atas Antusiasme Anda'}
                  </p>
                  <p className={`text-sm ${
                    status === 'not-started'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {status === 'not-started'
                      ? 'Pastikan Anda sudah menyiapkan data pribadi seperti NIM, Jurusan, Program Studi, dan nomor WhatsApp aktif untuk mempercepat proses pendaftaran.'
                      : 'Pendaftaran volunteer untuk Minangkabau Robot Contest telah ditutup. Terima kasih kepada semua yang telah mendaftar. Sampai jumpa di acara!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <p className="text-center text-sm text-gray-600 dark:text-slate-400">
                UKM Robotik Politeknik Negeri Padang
              </p>
              <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-1">
                {status === 'not-started' 
                  ? 'Halaman ini akan otomatis memuat formulir pendaftaran saat waktu pendaftaran dimulai.'
                  : 'Untuk informasi lebih lanjut, silakan hubungi panitia.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}