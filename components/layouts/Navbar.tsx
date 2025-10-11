"use client";

import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { animate } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Ketua Umum", href: "#ketua" },
  { label: "Video", href: "#video" },
  { label: "Open Recruitment", href: "#recruitment" },
  { label: "Tim KRI", href: "#kri" },
  { label: "Lokasi", href: "#lokasi" },
];

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (section) {
    const y = section.getBoundingClientRect().top + window.scrollY - 80; // offset header
    animate(window.scrollY, y, {
      duration: 0.8,
      onUpdate: (latest) => window.scrollTo(0, latest),
    });
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-md z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            href="#home"
            className="text-xl font-bold text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            UKM Robotik PNP
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="link"
                onClick={() => scrollToSection(item.href.replace("#", ""))}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-500 dark:hover:text-slate-100 transition-colors"
              >
                {item.label}
              </Button>
            ))}

            {/* Auth Button/Dropdown */}
            {loading ? (
              <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md">
                <span className="sr-only">Memuat status login...</span>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <DropdownMenuItem
                    onClick={handleDashboard}
                    className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-600 dark:hover:bg-slate-700"
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isOpen}
            className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
          >
            {isOpen ? (
              <X size={24} className="text-slate-800 dark:text-slate-200" />
            ) : (
              <Menu size={24} className="text-slate-800 dark:text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2 px-4 py-3">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={"link"}
                onClick={() => {
                  scrollToSection(item.href.replace("#", ""));
                  setIsOpen(false);
                }}
                className="block text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
              >
                {item.label}
              </Button>
            ))}

            {/* Mobile Auth Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              {loading ? (
              <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md">
                <span className="sr-only">Memuat status login...</span>
              </div>
              ) : user ? (
                <>
                  <button
                    onClick={() => {
                      handleDashboard();
                      setIsOpen(false);
                    }}
                    className="w-full text-left text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-md transition-colors flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md transition-colors flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleLogin();
                    setIsOpen(false);
                  }}
                  className="w-full text-left bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-md transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
