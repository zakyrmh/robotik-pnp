import { logout } from "@/app/actions/auth.action";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <p>Halo, {user.email}</p>
      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
    </div>
  );
}
