import ThemeTogglerTwo from "@/components/Theme/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";

import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <div className="relative flex items-center p-6 bg-white h-screen z-1 dark:bg-gray-900 sm:p-0">
          <div className="relative flex lg:flex-row w-full justify-center flex-col  dark:bg-gray-900 sm:p-0">
            <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
              {children}
            </div>
            <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
              <ThemeTogglerTwo />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </>
  );
}
