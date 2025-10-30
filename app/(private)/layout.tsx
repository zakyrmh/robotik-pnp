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

function SidebarConsumer({ role }: { role: string }) {
  const { isOpen, isMobile, closeSidebar } = useSidebarContext();
  return (
    <Sidebar
      isOpen={isOpen}
      isMobile={isMobile}
      onClose={closeSidebar}
      role={role}
    />
  );
}

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        
        try {
          const userRef = doc(db, "users_new", user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            setRole((data.role as "user" | "admin") ?? "user");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
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
    return (
      <Loading />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarConsumer role={role} />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 w-screen lg:w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}