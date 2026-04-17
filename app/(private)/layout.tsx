/**
 * Layout untuk halaman private (dashboard dan lainnya)
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InitialLoader } from "@/components/ui/initial-loader";
import { Toaster } from "sonner";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRolesData } = await supabase
    .from("user_roles")
    .select("roles ( name )")
    .eq("user_id", user.id);

  const userRoles: string[] = (userRolesData ?? [])
    .map((row) => {
      const role = row.roles;
      if (Array.isArray(role)) return role[0]?.name ?? null;
      if (role && typeof role === "object" && "name" in role)
        return (role as { name: string }).name;
      return null;
    })
    .filter((name): name is string => name !== null);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  let caangStatus: string | null = null;
  if (userRoles.includes("caang")) {
    const { data: registration } = await supabase
      .from("or_registrations")
      .select("status")
      .eq("user_id", user.id)
      .single();
    caangStatus = registration?.status ?? null;
  }

  const sidebarUser = {
    email: user.email ?? "",
    fullName: profile?.full_name ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          userRoles={userRoles}
          caangStatus={caangStatus}
          user={sidebarUser}
        />

        <SidebarInset>
          <DashboardHeader />

          {/* InitialLoader hanya muncul sekali saat pertama buka dashboard */}
          <InitialLoader>
            {" "}
            {/* ← wrap children */}
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </InitialLoader>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="top-right" richColors />
    </>
  );
}
