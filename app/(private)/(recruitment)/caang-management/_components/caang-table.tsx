"use client";

import { useState } from "react";
import { Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";
import { CaangData } from "@/lib/firebase/services/caang-service";
import { CaangDetailModal } from "@/app/(private)/(recruitment)/caang-management/_components/caang-detail-modal";

interface CaangTableProps {
  data: CaangData[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
}

// Status badge component
function StatusBadge({
  status,
  isBlacklisted,
}: {
  status?: string;
  isBlacklisted?: boolean;
}) {
  if (isBlacklisted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
        <XCircle className="w-3 h-3" />
        Blacklist
      </span>
    );
  }

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
  > = {
    draft: {
      label: "Draft",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      icon: Clock,
    },
    form_submitted: {
      label: "Form Submitted",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      icon: Clock,
    },
    form_verified: {
      label: "Form OK",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      icon: CheckCircle,
    },
    documents_uploaded: {
      label: "Dokumen OK",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
      icon: Clock,
    },
    payment_pending: {
      label: "Menunggu Bayar",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
      icon: Clock,
    },
    submitted: {
      label: "Submitted",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
      icon: Clock,
    },
    verified: {
      label: "Terverifikasi",
      color:
        "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
      icon: CheckCircle,
    },
    rejected: {
      label: "Ditolak",
      color: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
      icon: XCircle,
    },
  };

  const config = statusConfig[status || "draft"] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Account status badge
function AccountBadge({ isActive }: { isActive?: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <AlertTriangle className="w-3 h-3" />
      Nonaktif
    </span>
  );
}

export function CaangTable({
  data,
  selectedIds,
  onSelectChange,
}: CaangTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCaang, setSelectedCaang] = useState<CaangData | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectChange(data.map((c) => c.user.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, id]);
    } else {
      onSelectChange(selectedIds.filter((i) => i !== id));
    }
  };

  const openModal = (caang: CaangData) => {
    setSelectedCaang(caang);
    setModalOpen(true);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Profil Peserta
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Prodi / Jurusan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Status & Verifikasi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    Tidak ada data caang ditemukan
                  </td>
                </tr>
              ) : (
                data.map((caang) => (
                  <tr
                    key={caang.user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(caang.user.id)}
                        onChange={(e) =>
                          handleSelectOne(caang.user.id, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          <FirebaseImage
                            path={
                              caang.user.profile?.photoUrl ||
                              caang.registration?.documents?.photoUrl
                            }
                            width={40}
                            height={40}
                            alt={caang.user.profile?.fullName || "Avatar"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {caang.user.profile?.fullName || "N/A"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {caang.user.profile?.nim || "NIM belum diisi"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Prodi */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {caang.user.profile?.major || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {caang.user.profile?.department || "-"}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {caang.user.profile?.phone || "-"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {caang.user.email}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge
                          status={caang.registration?.status}
                          isBlacklisted={
                            caang.user.blacklistInfo?.isBlacklisted
                          }
                        />
                        <AccountBadge isActive={caang.user.isActive} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(caang)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedCaang && (
        <CaangDetailModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCaang(null);
          }}
          caang={selectedCaang}
        />
      )}
    </>
  );
}
