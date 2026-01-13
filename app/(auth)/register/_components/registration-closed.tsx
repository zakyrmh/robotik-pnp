"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { RecruitmentSettings } from "@/schemas/recruitment-settings";
import { AlertCircle, Calendar, MessageCircle, ArrowLeft } from "lucide-react";

interface RegistrationClosedProps {
  settings: RecruitmentSettings | null;
}

export default function RegistrationClosed({
  settings,
}: RegistrationClosedProps) {
  if (!settings) {
    return (
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Informasi Pendaftaran
        </h2>
        <p className="text-gray-400 mb-6">
          Belum ada informasi periode pendaftaran yang aktif.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Login
        </Link>
      </div>
    );
  }

  const { schedule, contactPerson, announcementMessage } = settings;
  const openDate = schedule.openDate
    ? format(schedule.openDate, "dd MMMM yyyy", { locale: localeId })
    : "-";
  const closeDate = schedule.closeDate
    ? format(schedule.closeDate, "dd MMMM yyyy", { locale: localeId })
    : "-";

  return (
    <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Pendaftaran Ditutup
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Mohon maaf, pendaftaran calon anggota baru saat ini sedang tidak
          tersedia.
        </p>
      </div>

      {/* Announcement Message if any */}
      {announcementMessage && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-200">
          {announcementMessage}
        </div>
      )}

      {/* Schedule Info */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" /> Jadwal Pendaftaran
        </h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Dibuka:</span>
          <span className="text-white font-medium">{openDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ditutup:</span>
          <span className="text-white font-medium">{closeDate}</span>
        </div>
      </div>

      {/* Contact Info */}
      {contactPerson && contactPerson.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Narahubung
          </p>
          <div className="space-y-2">
            {contactPerson.map((cp, idx) => (
              <a
                key={idx}
                href={`https://wa.me/${cp.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors p-2 rounded hover:bg-green-500/5"
              >
                <MessageCircle className="w-4 h-4" />
                {cp.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-700">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Halaman Login
        </Link>
      </div>
    </div>
  );
}
