"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
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

  const USER = {
    name: user?.displayName || "User",
    email: user?.email || "unknown@email.com",
    img: photoURL || "/images/avatar.jpg",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <FirebaseImage
          path={USER.img}
          width={40}
          height={40}
          alt="User Avatar"
          className="h-10 w-10 rounded-full object-cover"
        />
        <ChevronDown className="h-4 w-4 text-muted-foreground max-lg:hidden" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 shadow-lg"
        sideOffset={8}
      >
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <FirebaseImage
              path={USER.img}
              alt="User Avatar"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium">{USER.name}</p>
              <p className="text-xs text-muted-foreground">{USER.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/account/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" /> Edit Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />{" "}
          {loading ? "Loading..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
