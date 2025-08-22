"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      }
    }
  });

  return (
    <>
      <p>Welcome, {user?.displayName}</p>
    </>
  );
}
