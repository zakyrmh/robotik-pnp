"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Search01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:px-8">
      {/* Mobile Menu Toggle */}
      <Button variant="ghost" size="icon" className="mr-2 lg:hidden">
        <HugeiconsIcon icon={Menu01Icon} size={20} />
      </Button>

      {/* Quick Search */}
      <div className="relative hidden w-full max-w-sm lg:flex">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Cari sesuatu..."
          className="h-9 w-full bg-muted/50 pl-10 focus:bg-background transition-all"
        />
      </div>

      {/* Right Side Controls */}
      <div className="ml-auto flex items-center gap-2 lg:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={Notification01Icon} size={20} />
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center border-2 border-background p-0 text-[10px] bg-red-500">
            2
          </Badge>
        </Button>

        <div className="h-8 w-px bg-border/50 mx-1 hidden lg:block" />

        {/* User Profile Info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden flex-col items-end lg:flex">
            <span className="text-sm font-semibold leading-none">
              Zaky Ramadhan
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
              Super Admin
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card text-xs font-bold">
              ZR
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
