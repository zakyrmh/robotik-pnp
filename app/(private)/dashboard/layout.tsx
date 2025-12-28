import { ReactNode } from "react";
import { User } from "@/schemas/users";
import { Timestamp } from "firebase/firestore"; // Dummy import for mock
import { SidebarProvider } from "@/components/sidebar-context";
import { Sidebar } from "@/components/layouts/Sidebar";
import { Header } from "@/components/layouts/Header";

// --- MOCK DATA FETCHING (PRESERVED) ---
// Dalam production, Anda akan mengganti ini dengan Real Data Fetching (Server Access)
// ke Firestore atau Session.
const mockUser: User = {
  id: "mock-user-123",
  email: "mock@robotik.pnp.ac.id",
  roles: {
    isSuperAdmin: true,
    isKestari: false,
    isKomdis: true,
    isRecruiter: false,
    isKRIMember: true,
    isOfficialMember: true,
    isCaang: false,
    isAlumni: false,
  },
  profile: {
    fullName: "Mock User Architect",
    entryYear: 2023,
    major: "Teknik Komputer",
  },
  isActive: true,
  createdAt: new Date() as unknown as Timestamp,
  updatedAt: new Date() as unknown as Timestamp,
};

async function getUser(): Promise<User> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockUser;
}

interface DashboardLayoutProps {
  children: ReactNode;
  kri: ReactNode;
  official: ReactNode;
  komdis: ReactNode;
  recruitment: ReactNode;
  management: ReactNode;
  overview: ReactNode;
}

export default async function DashboardLayout({
  children,
  kri,
  official,
  komdis,
  recruitment,
  management,
  overview,
}: DashboardLayoutProps) {
  // 1. Fetch User Data (Server-Side)
  const user = await getUser();
  const { roles } = user;

  // 2. Role-Based Logic for Slots
  const showKri = roles.isKRIMember;
  const showOfficial = roles.isOfficialMember;
  const showKomdis = roles.isKomdis;
  const showRecruitment = roles.isRecruiter;
  const showManagement = roles.isSuperAdmin || roles.isKestari;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50/50">
        {/* SIDEBAR: Static on Desktop, Drawer on Mobile. Passed server-side roles */}
        <Sidebar userRoles={user.roles} />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex flex-1 flex-col h-full overflow-hidden relative">
          {/* HEADER (Sticky) */}
          <Header />

          {/* SCROLLABLE MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-3 duration-500">
              {/* --- DASHBOARD COMPOSABLE UI/SLOTS --- */}

              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-gray-500 mt-1">
                  Welcome back, {user.profile.fullName}
                </p>
              </div>

              {/* OVERVIEW SECTION (Always Top) */}
              <div className="mb-6 w-full">{overview}</div>

              {/* DYNAMIC GRID SLOTS Based on Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* MANAGEMENT */}
                {showManagement && (
                  <div className="col-span-1 md:col-span-2 xl:col-span-3">
                    {management}
                  </div>
                )}

                {/* KRI TIM */}
                {showKri ? kri : null}

                {/* OFFICIAL */}
                {showOfficial ? official : null}

                {/* KOMDIS */}
                {showKomdis ? komdis : null}

                {/* RECRUITMENT */}
                {showRecruitment ? recruitment : null}
              </div>

              {/* DEFAULT CHILDREN */}
              <div className="mt-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
