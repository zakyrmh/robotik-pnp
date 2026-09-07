"use client";

import { useState } from "react";
import { DisciplinePointLog, Sanction } from "@/lib/types/komdis";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  RecycleIcon,
  Audit01Icon,
} from "@hugeicons/core-free-icons";

export interface AttendanceHistoryItem {
  id: string;
  status: string;
  approval_status: string | null;
  points_awarded: number;
  check_in_at: string | null;
  created_at: string | null;
  activity?: {
    title: string;
    start_date: string;
  } | null;
}

interface DisciplineHistoryTabsProps {
  attendances: AttendanceHistoryItem[];
  pointLogs: DisciplinePointLog[];
  sanctions: Sanction[];
}

export function DisciplineHistoryTabs({
  attendances,
  pointLogs,
  sanctions,
}: DisciplineHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "attendances" | "goro" | "sanctions"
  >("attendances");

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="flex border-b border-hairline-dark bg-surface-card-dark font-mono text-xs uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setActiveTab("attendances")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors cursor-pointer rounded-none ${
            activeTab === "attendances"
              ? "border-cyber-blue text-cyber-blue font-bold bg-canvas-dark/40"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <HugeiconsIcon icon={Calendar01Icon} size={16} />
          <span>PRESENSI & SANKSI PRESENSI ({attendances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("goro")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors cursor-pointer rounded-none ${
            activeTab === "goro"
              ? "border-emerald-500 text-emerald-400 font-bold bg-canvas-dark/40"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <HugeiconsIcon icon={RecycleIcon} size={16} />
          <span>LOG PEMUTIHAN GORO ({pointLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sanctions")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors cursor-pointer rounded-none ${
            activeTab === "sanctions"
              ? "border-crimson-red text-crimson-red font-bold bg-canvas-dark/40"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <HugeiconsIcon icon={Audit01Icon} size={16} />
          <span>RIWAYAT SURAT PERINGATAN ({sanctions.length})</span>
        </button>
      </div>

      {/* Tab 1: Attendance History */}
      {activeTab === "attendances" && (
        <Card className="bg-surface-card-dark border-hairline-dark rounded-none shadow-none overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-dark bg-canvas-dark font-mono text-[10px] uppercase tracking-widest text-cyber-blue">
                  <th className="py-3 px-4">TANGGAL</th>
                  <th className="py-3 px-4">KEGIATAN</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">POIN SANKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-dark font-sans text-xs">
                {attendances.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-gray-500 font-mono"
                    >
                      BELUM ADA RIWAYAT PRESENSI
                    </td>
                  </tr>
                ) : (
                  attendances.map((item) => (
                    <tr key={item.id} className="hover:bg-canvas-dark/50">
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">
                        {item.activity?.title || "Kegiatan Formal"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono uppercase">
                        <span
                          className={`px-2 py-0.5 text-[10px] border rounded-sm ${
                            item.status === "hadir"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : item.status === "telat"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-crimson-red/10 text-crimson-red border-crimson-red/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400 font-bold">
                        +{item.points_awarded || 0} PTS
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Goro Point Reduction History */}
      {activeTab === "goro" && (
        <Card className="bg-surface-card-dark border-hairline-dark rounded-none shadow-none overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-dark bg-canvas-dark font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  <th className="py-3 px-4">TANGGAL</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">DESKRIPSI</th>
                  <th className="py-3 px-4 text-center">PEMUTIHAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-dark font-sans text-xs">
                {pointLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-gray-500 font-mono"
                    >
                      BELUM ADA LOG PEMUTIHAN GORO
                    </td>
                  </tr>
                ) : (
                  pointLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-dark/50">
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 uppercase font-semibold">
                        {log.category}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold text-sm">
                        {log.points} PTS
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Sanctions Issued History */}
      {activeTab === "sanctions" && (
        <Card className="bg-surface-card-dark border-hairline-dark rounded-none shadow-none overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-dark bg-canvas-dark font-mono text-[10px] uppercase tracking-widest text-crimson-red">
                  <th className="py-3 px-4">TANGGAL DITERBITKAN</th>
                  <th className="py-3 px-4">TINGKAT SP</th>
                  <th className="py-3 px-4 text-center">
                    POIN SAAT DITERBITKAN
                  </th>
                  <th className="py-3 px-4">CATATAN KOMDIS</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-dark font-sans text-xs">
                {sanctions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-gray-500 font-mono"
                    >
                      BELUM ADA SURAT PERINGATAN DITERBITKAN
                    </td>
                  </tr>
                ) : (
                  sanctions.map((sp) => (
                    <tr key={sp.id} className="hover:bg-canvas-dark/50">
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {sp.issued_at
                          ? new Date(sp.issued_at).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-crimson-red">
                        SURAT PERINGATAN {sp.sp_level}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {sp.points_at_issuance} PTS
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {sp.notes || "-"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono uppercase">
                        <span className="px-2 py-0.5 text-[10px] bg-crimson-red/10 text-crimson-red border border-crimson-red/30 rounded-sm">
                          {sp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
