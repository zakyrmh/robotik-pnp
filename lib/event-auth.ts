import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RoleEvent } from "@/types/event-registration";

export interface EventAuthResult {
  isAuthorized: boolean;
  isSuperAdmin: boolean;
  roleEvent: RoleEvent | undefined;
  user: { id: string; email?: string } | null;
}

export async function checkEventAdmin(
  allowedEventRoles?: RoleEvent[],
): Promise<EventAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthorized: false,
      isSuperAdmin: false,
      roleEvent: undefined,
      user: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_event")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super-admin";
  const roleEvent = profile?.role_event as RoleEvent | undefined;

  let isAuthorized = false;
  if (isSuperAdmin) {
    isAuthorized = true;
  } else if (roleEvent) {
    if (!allowedEventRoles || allowedEventRoles.length === 0) {
      isAuthorized = true;
    } else {
      isAuthorized = allowedEventRoles.includes(roleEvent);
    }
  }

  return {
    isAuthorized,
    isSuperAdmin,
    roleEvent,
    user,
  };
}

export async function requireEventAdminOrRedirect(
  allowedEventRoles?: RoleEvent[],
): Promise<EventAuthResult> {
  const result = await checkEventAdmin(allowedEventRoles);
  if (!result.user) {
    redirect("/login");
  }
  return result;
}
