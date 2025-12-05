"use client";

import { useState } from "react";
import { User } from "@/types/users";

interface AdminDashboardProps {
  user: User | null;
}

type TabType = 
  | "overview" 
  | "kestari" 
  | "komdis" 
  | "recruitment" 
  | "official" 
  | "kri" 
  | "superadmin";

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Safety check jika user data belum masuk
  if (!user) {
    return <div className="p-8 text-center">Memuat data user...</div>;
  }

  const { roles, profile } = user;

  // Helper untuk mengecek akses (Super Admin biasanya bisa akses semua menu)
  const canAccess = (roleCheck: boolean) => roles.isSuperAdmin || roleCheck;

  // --- RENDER CONTENT HANDLER ---
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Halo, {profile.fullName}</h2>
            <p className="text-gray-600">Selamat datang di Dashboard Internal.</p>
            {/* Widget atau Info umum disini */}
            <div className="p-4 border border-dashed border-gray-300 rounded-lg">
              <span className="text-gray-400">Area Widget Overview (Kosong)</span>
            </div>
          </div>
        );

      case "superadmin":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Control Panel Super Admin</h2>
            {/* Manajemen User, Global Config, dll */}
            <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
              Super Admin Content
            </div>
          </div>
        );

      case "kestari":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Menu Kestari</h2>
            {/* Absensi, Manajemen Piket, Surat */}
            <div className="h-64 bg-blue-50 border-2 border-dashed border-blue-200 rounded flex items-center justify-center">
              Manajemen Kestari & Piket
            </div>
          </div>
        );

      case "komdis":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Menu Komisi Disiplin</h2>
            {/* Input Pelanggaran, List Sanksi */}
            <div className="h-64 bg-red-50 border-2 border-dashed border-red-200 rounded flex items-center justify-center">
              Manajemen Sanksi & Pelanggaran
            </div>
          </div>
        );

      case "recruitment":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Panitia Oprec (Recruiter)</h2>
            {/* Data Caang, Nilai Wawancara */}
            <div className="h-64 bg-green-50 border-2 border-dashed border-green-200 rounded flex items-center justify-center">
              Data Peserta & Penilaian
            </div>
          </div>
        );

      case "official":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Official Department</h2>
            {/* Jobdesk Departemen */}
            <div className="h-64 bg-purple-50 border-2 border-dashed border-purple-200 rounded flex items-center justify-center">
              Workspace Department (Infokom/Litbang/dll)
            </div>
          </div>
        );

      case "kri":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Tim Robot (KRI)</h2>
            {/* Logbook, Progress Robot */}
            <div className="h-64 bg-orange-50 border-2 border-dashed border-orange-200 rounded flex items-center justify-center">
              Logbook & Progress Tim Robot
            </div>
          </div>
        );

      default:
        return <div>Menu tidak ditemukan</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
        </div>
        <nav className="p-4 space-y-2">
          {/* Menu Umum */}
          <SidebarButton 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
            label="Overview" 
          />

          {/* Menu Role Based - Hanya muncul jika role = true */}
          
          {roles.isSuperAdmin && (
            <>
              <div className="pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Core</div>
              <SidebarButton 
                active={activeTab === "superadmin"} 
                onClick={() => setActiveTab("superadmin")} 
                label="Super Admin" 
              />
            </>
          )}

          {(canAccess(roles.isKestari) || canAccess(roles.isKomdis) || canAccess(roles.isRecruiter)) && (
            <div className="pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</div>
          )}

          {canAccess(roles.isKestari) && (
            <SidebarButton 
              active={activeTab === "kestari"} 
              onClick={() => setActiveTab("kestari")} 
              label="Kestari" 
            />
          )}

          {canAccess(roles.isKomdis) && (
            <SidebarButton 
              active={activeTab === "komdis"} 
              onClick={() => setActiveTab("komdis")} 
              label="Komdis" 
            />
          )}

          {canAccess(roles.isRecruiter) && (
            <SidebarButton 
              active={activeTab === "recruitment"} 
              onClick={() => setActiveTab("recruitment")} 
              label="Recruitment (Oprec)" 
            />
          )}

          {(canAccess(roles.isOfficialMember) || canAccess(roles.isKRIMember)) && (
            <div className="pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Division</div>
          )}

          {canAccess(roles.isOfficialMember) && (
            <SidebarButton 
              active={activeTab === "official"} 
              onClick={() => setActiveTab("official")} 
              label="Official Dept" 
            />
          )}

          {canAccess(roles.isKRIMember) && (
            <SidebarButton 
              active={activeTab === "kri"} 
              onClick={() => setActiveTab("kri")} 
              label="Tim Robot (KRI)" 
            />
          )}
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow p-6 min-h-[500px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Komponen Kecil untuk Tombol Sidebar
function SidebarButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded transition-colors duration-200 ${
        active 
          ? "bg-blue-600 text-white font-medium" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}