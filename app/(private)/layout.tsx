"use client";

import { Header } from "@/components/layouts/Header";
import { Sidebar } from "@/components/layouts/Sidebar";
import Loading from "@/components/Loading";
import {
  SidebarProvider,
  useSidebarContext,
} from "@/components/sidebar-context";
import { app } from "@/lib/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, UserSystemRoles } from "@/types/users";

// Default roles jika data belum ada (Safety fallback)
const DEFAULT_ROLES: UserSystemRoles = {
  isSuperAdmin: false,
  isKestari: false,
  isKomdis: false,
  isRecruiter: false,
  isKRIMember: false,
  isOfficialMember: false,
  isCaang: true, // Default dianggap Caang agar aman
  isAlumni: false,
};

function SidebarConsumer({ userRoles }: { userRoles: UserSystemRoles }) {
  const { isOpen, isMobile, closeSidebar } = useSidebarContext();
  return (
    <Sidebar
      isOpen={isOpen}
      isMobile={isMobile}
      onClose={closeSidebar}
      userRoles={userRoles}
    />
  );
}

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userRoles, setUserRoles] = useState<UserSystemRoles>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Session Refresh Logic (Keep existing)
        try {
          const idToken = await firebaseUser.getIdToken(true);
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              idToken, 
              rememberMe: localStorage.getItem("rememberMe") === "true" 
            }),
          });
        } catch (refreshError) {
          console.error("Error refreshing session:", refreshError);
        }
        
        setIsAuthenticated(true);
        
        // 2. Fetch User Data & Roles
        try {
          const userRef = doc(db, "users_new", firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const userData = snap.data() as User;
            
            // Mengambil roles dari database, atau pakai default jika belum migrasi
            // Pastikan field di firestore bernama 'roles' sesuai types/users.ts
            setUserRoles(userData.roles || DEFAULT_ROLES);
          } else {
            console.warn("User document not found via layout check");
            // Opsional: Redirect ke halaman setup profil jika dokumen belum ada
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
        }
      } else {
        setIsAuthenticated(false);
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Pass userRoles ke Sidebar */}
        <SidebarConsumer userRoles={userRoles} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto w-screen lg:w-full p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}