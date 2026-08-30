"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Search01Icon,
  Menu01Icon,
  Sun01Icon,
  Moon01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  checkActivityExists,
  type InAppNotification,
} from "@/lib/actions/notifications";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Fetch unread notification count on mount & periodically
  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const res = await getUnreadNotificationCount();
        if (isMounted && res.success && res.data) {
          setUnreadCount(res.data.count);
        }
      } catch {
        // Silently fail — badge will show 0
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll setiap 60 detik
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Load notifications when dropdown opens
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await getNotifications(15);
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {
      // Silently fail
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  const handleNotifToggle = (open: boolean) => {
    setIsNotifOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id);
    }

    if (notif.type === "activity" || notif.reference_type === "activity") {
      if (!notif.reference_id) {
        toast.error("Kegiatan ini telah dibatalkan atau dihapus oleh Admin");
        return;
      }
      const checkRes = await checkActivityExists(notif.reference_id);
      if (checkRes.success && checkRes.data?.exists) {
        setIsNotifOpen(false);
        router.push(`/kegiatan/${notif.reference_id}`);
      } else {
        toast.error("Kegiatan ini telah dibatalkan atau dihapus oleh Admin");
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:h-16 sm:px-4 lg:px-6">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
        className="lg:hidden"
        aria-label="Buka menu navigasi"
      >
        <HugeiconsIcon icon={Menu01Icon} />
      </Button>

      {/* Quick Search */}
      <InputGroup className="hidden h-9 w-full max-w-xs lg:flex xl:max-w-sm">
        <InputGroupAddon align="inline-start">
          <HugeiconsIcon icon={Search01Icon} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Cari sesuatu..." />
      </InputGroup>

      {/* Right Side Controls */}
      <div className="ml-auto flex items-center gap-1.5 lg:gap-2">
        {/* Tombol Ganti Tema */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleTheme}
          aria-label="Ganti tema"
        >
          {mounted ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <HugeiconsIcon
                  icon={theme === "light" ? Moon01Icon : Sun01Icon}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="size-5" />
          )}
        </Button>

        {/* Notifikasi */}
        <Popover open={isNotifOpen} onOpenChange={handleNotifToggle}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Notifikasi"
              className="relative"
            >
              <HugeiconsIcon icon={Notification01Icon} />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-80 max-w-[calc(100vw-2rem)] gap-0 rounded-lg p-0 sm:w-96"
          >
            <PopoverHeader className="flex-row items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <PopoverTitle className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                Notifikasi
              </PopoverTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="rounded-md px-2 text-xs font-medium text-primary hover:bg-primary-soft"
                >
                  Tandai dibaca
                </Button>
              )}
            </PopoverHeader>

            <div className="max-h-80 overflow-y-auto">
              {notifLoading ? (
                <div className="flex flex-col gap-3 p-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <Empty className="gap-2 border-0 py-6">
                  <EmptyHeader className="gap-1">
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon icon={Notification01Icon} />
                    </EmptyMedia>
                    <EmptyTitle className="text-xs font-medium text-foreground">
                      Tidak ada notifikasi
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={
                      "w-full border-b border-border text-left transition-colors last:border-b-0 " +
                      (notif.is_read
                        ? "bg-background hover:bg-muted"
                        : "bg-accent hover:bg-accent/70")
                    }
                  >
                    <span className="flex items-start gap-2.5 px-3 py-3">
                      {!notif.is_read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <span
                        className={
                          "min-w-0 flex-1 " + (notif.is_read ? "pl-3.5" : "")
                        }
                      >
                        <span className="block truncate text-xs font-semibold text-foreground">
                          {notif.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                          {notif.message}
                        </span>
                        <span className="mt-1 block font-mono text-micro tracking-wide text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-6 lg:block"
        />

        {/* User Profile Info */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-9 rounded-full p-0.5 lg:size-10"
              aria-label="Menu akun"
            >
              <Avatar className="size-full">
                {user?.avatar_url ? (
                  <AvatarImage
                    src={user.avatar_url}
                    alt={user.name || "Avatar pengguna"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary-soft font-mono text-xs font-bold text-primary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={10} className="w-52">
            <DropdownMenuLabel className="flex flex-col gap-0.5 lg:hidden">
              <span className="truncate text-sm font-semibold text-foreground">
                {user?.name || "GUEST USER"}
              </span>
              <span className="text-micro font-medium uppercase tracking-wide text-muted-foreground">
                {user?.role || "USER"}
              </span>
            </DropdownMenuLabel>

            <div className="hidden flex-col items-end gap-0.5 px-2 py-1.5 lg:flex">
              <span className="truncate text-sm font-semibold text-foreground">
                {user?.name || "GUEST USER"}
              </span>
              <span className="text-micro font-medium uppercase tracking-wide text-primary">
                {user?.role || "USER"}
              </span>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleLogout}
                className="cursor-pointer"
              >
                <HugeiconsIcon icon={Logout01Icon} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
