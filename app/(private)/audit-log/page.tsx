import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuditLogsAction } from "@/lib/actions/admin-users";
import { AuditLogViewerClient } from "./AuditLogViewerClient";

interface AuditLogPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
  }>;
}

export default async function AuditLogPage(props: AuditLogPageProps) {
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super-admin") {
    redirect("/dashboard");
  }

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const perPage = searchParams.perPage
    ? parseInt(searchParams.perPage, 10)
    : 15;

  const auditLogsResult = await getAuditLogsAction(page, perPage);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <AuditLogViewerClient initialData={auditLogsResult} />
    </div>
  );
}
