import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getUsersAction,
  getStudyProgramsOptionsAction,
} from "@/lib/actions/admin-users";
import { UserTableShell } from "@/components/admin/users/user-table-shell";

interface ManajemenAkunPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: "all" | "active" | "archived";
    page?: string;
    perPage?: string;
  }>;
}

export default async function ManajemenAkunPage(props: ManajemenAkunPageProps) {
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
    : 10;
  const search = searchParams.search || "";
  const role = searchParams.role || "";
  const status = searchParams.status || "all";

  // Fetch paginated user data & study program filter options in parallel
  const [usersResult, studyPrograms] = await Promise.all([
    getUsersAction({
      search,
      role,
      status,
      page,
      perPage,
    }),
    getStudyProgramsOptionsAction(),
  ]);

  return (
    <div className="space-y-6">
      <UserTableShell
        initialData={usersResult}
        studyPrograms={studyPrograms}
        currentUserId={user.id}
      />
    </div>
  );
}
