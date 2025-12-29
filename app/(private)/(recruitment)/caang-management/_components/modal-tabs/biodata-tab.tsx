"use client";

import { CaangData } from "@/lib/firebase/services/caang-service";
import FirebaseImage from "@/components/FirebaseImage";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  User,
  Hash,
} from "lucide-react";

interface BiodataTabProps {
  caang: CaangData;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export function BiodataTab({ caang }: BiodataTabProps) {
  const { user, registration } = caang;
  const profile = user.profile;

  // Format date
  const formatDate = (date?: Date | { toDate?: () => Date }) => {
    if (!date) return "-";
    const d =
      typeof (date as { toDate?: () => Date }).toDate === "function"
        ? (date as { toDate: () => Date }).toDate()
        : (date as Date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Photo Section */}
      <div className="lg:col-span-1">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center">
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-700 shadow-lg">
            <FirebaseImage
              path={profile?.photoUrl || registration?.documents?.photoUrl}
              fallbackSrc="/images/avatar.jpg"
              width={128}
              height={128}
              alt={profile?.fullName || "Avatar"}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            {profile?.fullName || "N/A"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {profile?.nickname ? `"${profile.nickname}"` : "-"}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
              }`}
            >
              {user.isActive ? "Aktif" : "Nonaktif"}
            </span>
            {registration?.status && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                {registration.status.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Informasi Pribadi
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoRow icon={Hash} label="NIM" value={profile?.nim} />
            <InfoRow
              icon={User}
              label="Jenis Kelamin"
              value={
                profile?.gender === "male"
                  ? "Laki-laki"
                  : profile?.gender === "female"
                  ? "Perempuan"
                  : "-"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Tanggal Lahir"
              value={formatDate(profile?.birthDate as Date | undefined)}
            />
            <InfoRow
              icon={MapPin}
              label="Tempat Lahir"
              value={profile?.birthPlace}
            />
            <InfoRow icon={MapPin} label="Alamat" value={profile?.address} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-500" />
            Kontak
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="No. HP" value={profile?.phone} />
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            Akademik
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoRow
              icon={GraduationCap}
              label="Program Studi"
              value={profile?.major}
            />
            <InfoRow
              icon={GraduationCap}
              label="Jurusan"
              value={profile?.department}
            />
            <InfoRow
              icon={Calendar}
              label="Tahun Masuk"
              value={profile?.entryYear}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
