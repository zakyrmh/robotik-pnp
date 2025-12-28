"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";

export function UserInfo() {
  const { user, logout, loading } = useAuth();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid) return;
    const fetchUserData = async () => {
      try {
        const ref = doc(db, "users_new", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPhotoURL(snap.data().profile.photoUrl ?? null);
        }
      } catch (error) {
        console.error("Gagal mengambil foto user:", error);
      }
    };
    fetchUserData();
  }, [user?.uid]);

  const userName = user?.displayName || "User";
  const userEmail = user?.email || "unknown@email.com";
  // We utilize the helper component for logic-handling of storage paths vs URLs
  const imgPath = photoURL || "/images/avatar.jpg";

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true));
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-gray-100 p-1 pl-2 bg-gray-50/50 animate-pulse">
        <div className="w-20 h-4 bg-gray-200 rounded hidden md:block"></div>
        <div className="h-9 w-9 rounded-full bg-gray-200"></div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-transparent p-1 pl-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all group">
        {/* Text Info - Visible on Desktop */}
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-700 leading-tight group-hover:text-blue-700 transition-colors">
            {userName}
          </p>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Online
          </p>
        </div>

        {/* Avatar */}
        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all">
          <FirebaseImage
            path={imgPath}
            width={36}
            height={36}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        </div>

        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors hidden md:block sm:pr-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-2 shadow-xl border-gray-100 rounded-xl"
        sideOffset={8}
      >
        <div className="bg-gray-50/50 p-3 rounded-lg mb-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white shadow-sm shrink-0">
            <FirebaseImage
              path={imgPath}
              alt="User Avatar"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          onClick={() => router.push("/account/settings")}
          className="cursor-pointer rounded-lg focus:bg-blue-50 focus:text-blue-700 py-2.5"
        >
          <Settings className="mr-2 h-4 w-4 text-gray-500" />
          <span className="font-medium">Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          className="cursor-not-allowed opacity-50 rounded-lg py-2.5"
        >
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <span className="font-medium">Profile Public</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 py-2.5 group/logout"
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
