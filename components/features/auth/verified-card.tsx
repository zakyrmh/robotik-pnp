"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, RocketIcon } from "@hugeicons/core-free-icons";

const LOGIN_URL = "/login?message=Email+berhasil+diverifikasi.+Silakan+login.";

export function VerifiedCard() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect setelah 3 detik ke halaman login
    const timeout = setTimeout(() => {
      router.push(LOGIN_URL);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <Card className="rounded-lg text-center">
      <CardHeader className="gap-3">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="font-display text-lg sm:text-xl font-semibold tracking-tight">
            Email Terverifikasi
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Selamat, akun UKM Robotik PNP Anda telah aktif. Sistem sedang
            mengalihkan sesi Anda ke halaman login.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="rounded-lg bg-muted/40 p-3.5 sm:p-4 text-sm text-muted-foreground leading-relaxed">
          <HugeiconsIcon
            icon={RocketIcon}
            size={16}
            className="mr-2 inline-block shrink-0 align-middle animate-pulse text-primary"
          />
          Otomatis redirect dalam {countdown} detik...
        </p>
      </CardContent>

      <CardFooter className="justify-center px-5 sm:px-6">
        <Button
          variant="ghost"
          className="text-sm font-medium text-primary hover:bg-transparent hover:text-primary/80 hover:underline"
          onClick={() => router.push(LOGIN_URL)}
        >
          Lewati Redirect dan Login
        </Button>
      </CardFooter>
    </Card>
  );
}
