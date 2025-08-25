"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ComingSoon() {
  const targetDate = new Date("2025-09-01T07:00:00").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(timer);
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) =>
    num.toString().padStart(2, "0").split("");

  const timerItems = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="relative z-10 overflow-hidden bg-white px-4 dark:bg-gray-dark sm:px-8">
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden">
        <div className="no-scrollbar overflow-y-auto py-20">
          <div className="mx-auto w-full max-w-[600px]">
            {/* Logo */}
            <div className="text-center">
              <Link
                href="/"
                className="flex justify-center items-center gap-2 mx-auto mb-10"
              >
                <Image
                  alt="Logo"
                  width={45}
                  height={45}
                  src="/images/logo/logo.webp"
                />
                <span className="font-semibold text-dark dark:text-white">
                  Robotik PNP
                </span>
              </Link>
              <h1 className="mb-2.5 text-3xl font-black text-dark dark:text-white lg:text-4xl xl:text-[50px] xl:leading-[60px]">
                {!isExpired ? "Coming Soon" : "Open Recruitment"}
              </h1>
              <p className="font-medium text-dark-4 dark:text-dark-6">
                Pendaftaran calon anggota UKM Robotik Politeknik Negeri Padang
                ke 21.
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="mt-10 flex justify-center">
            {!isExpired ? (
              <div className="flex flex-wrap justify-center gap-6">
                {timerItems.map((item, i) => (
                  <div key={i}>
                    <div className="mb-3 flex items-center gap-2">
                      {formatNumber(item.value).map((digit, idx) => (
                        <div
                          key={idx}
                          className="timer-box relative z-1 overflow-hidden rounded-lg"
                        >
                          <span className="flex h-17.5 min-w-[56px] items-center justify-center rounded-lg bg-dark px-3 text-xl font-black leading-[1.35] text-white dark:bg-dark-2 lg:text-3xl xl:text-[40px]">
                            {digit}
                          </span>
                          <span
                            className="absolute bottom-0 left-0 -z-1 block w-full bg-[#000]/20"
                            style={{ height: "100.48%" }}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="block text-center font-medium text-dark-4 dark:text-dark-6">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Link
                  href="/caang/register"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Social Media */}
          <div className="mt-10 text-center">
            <p className="mb-5 font-medium text-dark dark:text-white">
              Follow Us On
            </p>
            <div className="flex items-center justify-center gap-4">
              {/* Instagram */}
              <a
                className="flex size-10 items-center justify-center rounded-full border border-[#DFE4EA] text-dark-4 hover:border-primary hover:bg-primary hover:text-white dark:border-dark-3 dark:text-dark-6 dark:hover:border-primary dark:hover:text-white"
                href="https://www.instagram.com/robotikpnp/"
                target="_blank"
              >
                {/* SVG Instagram */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  className="fill-dark dark:fill-white"
                >
                  <path d="M20.445 5h-8.891A6.559 6.559 0 0 0 5 11.554v8.891A6.559 6.559 0 0 0 11.554 27h8.891a6.56 6.56 0 0 0 6.554-6.555v-8.891A6.557 6.557 0 0 0 20.445 5zm4.342 15.445a4.343 4.343 0 0 1-4.342 4.342h-8.891a4.341 4.341 0 0 1-4.341-4.342v-8.891a4.34 4.34 0 0 1 4.341-4.341h8.891a4.342 4.342 0 0 1 4.341 4.341l.001 8.891z" />
                  <path d="M16 10.312c-3.138 0-5.688 2.551-5.688 5.688s2.551 5.688 5.688 5.688 5.688-2.551 5.688-5.688-2.55-5.688-5.688-5.688zm0 9.163a3.475 3.475 0 1 1-.001-6.95 3.475 3.475 0 0 1 .001 6.95zM21.7 8.991a1.363 1.363 0 1 1-1.364 1.364c0-.752.51-1.364 1.364-1.364z" />
                </svg>
              </a>
              {/* Tambahkan ikon lainnya sesuai kebutuhan */}
            </div>
          </div>
        </div>
      </div>

      {/* Background lines */}
      <div className="absolute left-0 top-0 -z-10 flex h-screen w-full items-center justify-around">
        <div className="flex h-full gap-20">
          {["line1", "line2", "line3"].map((line, idx) => (
            <span key={idx} className={`block h-full w-0.5 animate-${line}`}>
              <span className="block h-55 w-0.5 bg-[#DEE4EE] dark:bg-dark-3"></span>
            </span>
          ))}
        </div>
        <div className="flex h-full gap-20">
          {["line1", "line2", "line3"].map((line, idx) => (
            <span key={idx} className={`block h-full w-0.5 animate-${line}`}>
              <span className="block h-55 w-0.5 bg-[#DEE4EE] dark:bg-dark-3"></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
