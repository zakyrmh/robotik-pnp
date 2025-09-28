"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import {
  SidebarProvider,
  useSidebarContext,
} from "@/components/sidebar-context";
import { app } from "@/lib/firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
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
  const [role, setRole] = useState<"user" | "admin">("user"); // default user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ambil role dari Firestore
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setRole((data.role as "user" | "admin") ?? "user");
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
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
