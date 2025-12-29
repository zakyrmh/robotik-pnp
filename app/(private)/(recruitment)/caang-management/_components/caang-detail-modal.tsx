"use client";

import { useState } from "react";
import { X, User, FileText, Heart, History, AlertTriangle } from "lucide-react";
import { CaangData } from "@/lib/firebase/services/caang-service";
import { blacklistCaang } from "@/lib/firebase/services/caang-service";
import { useCaangManagement } from "../_context/caang-management-context";
import { BiodataTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/biodata-tab";
import { DocumentsTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/documents-tab";
import { EssayTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/essay-tab";
import { HistoryTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/history-tab";

interface CaangDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caang: CaangData;
}

type TabType = "biodata" | "documents" | "essay" | "history";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "biodata", label: "Biodata", icon: User },
  { id: "documents", label: "Berkas & Pembayaran", icon: FileText },
  { id: "essay", label: "Essay & Motivasi", icon: Heart },
  { id: "history", label: "Riwayat & Nilai", icon: History },
];

export function CaangDetailModal({
  isOpen,
  onClose,
  caang,
}: CaangDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("biodata");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const { refreshData } = useCaangManagement();

  if (!isOpen) return null;

  const isBlacklisted = caang.user.blacklistInfo?.isBlacklisted;

  const handleBlacklist = async () => {
    if (!blacklistReason.trim()) return;

    try {
      setIsBlacklisting(true);
      await blacklistCaang(caang.user.id, blacklistReason, "admin"); // TODO: Get actual admin ID
      await refreshData();
      setShowBlacklistConfirm(false);
      setBlacklistReason("");
      onClose();
    } catch (error) {
      console.error("Error blacklisting:", error);
    } finally {
      setIsBlacklisting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "biodata":
        return <BiodataTab caang={caang} />;
      case "documents":
        return <DocumentsTab caang={caang} />;
      case "essay":
        return <EssayTab caang={caang} />;
      case "history":
        return <HistoryTab caang={caang} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm h-screen"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Detail Calon Anggota
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {caang.user.profile?.fullName || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 overflow-x-auto min-h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {/* Blacklist Section */}
          {showBlacklistConfirm ? (
            <div className="flex items-center gap-3 flex-1 mr-4">
              <input
                type="text"
                placeholder="Alasan blacklist..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleBlacklist}
                disabled={!blacklistReason.trim() || isBlacklisting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isBlacklisting ? "Processing..." : "Konfirmasi"}
              </button>
              <button
                onClick={() => {
                  setShowBlacklistConfirm(false);
                  setBlacklistReason("");
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowBlacklistConfirm(true)}
              disabled={isBlacklisted}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isBlacklisted
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {isBlacklisted ? "Sudah di-blacklist" : "Blacklist Peserta"}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
