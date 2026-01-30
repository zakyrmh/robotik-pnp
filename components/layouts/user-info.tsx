"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function UserInfo() {
  const { logout, loading } = useAuth();
  const { userProfile } = useDashboard();
  const router = useRouter();

  const userName = userProfile?.fullName || "User";
  const userEmail = userProfile?.email || "unknown@email.com";
  const imgPath = userProfile?.photoUrl || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-transparent p-1 pl-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all group">
        {/* Text Info - Visible on Desktop */}
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {userName}
          </p>
          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider">
            Online
          </p>
        </div>

        {/* Avatar */}
        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white dark:ring-slate-950 shadow-sm group-hover:ring-blue-100 dark:group-hover:ring-blue-900/30 transition-all">
          <FirebaseImage
            path={imgPath}
            width={36}
            height={36}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        </div>

        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors hidden md:block sm:pr-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-2 shadow-xl border-gray-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950"
        sideOffset={8}
      >
        <div className="bg-gray-50/50 dark:bg-slate-900/50 p-3 rounded-lg mb-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white dark:border-slate-800 shadow-sm shrink-0">
            <FirebaseImage
              path={imgPath}
              alt="User Avatar"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {userEmail}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="cursor-pointer rounded-lg focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:text-blue-700 dark:focus:text-blue-400 py-2.5"
        >
          <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <span className="font-medium">Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800" />

        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-300 py-2.5 group/logout"
        >
          <LogOut className="mr-2 h-4 w-4 group-hover/logout:translate-x-1 transition-transform" />{" "}
          <span className="font-medium">
            {loading ? "Logging out..." : "Sign Out"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
