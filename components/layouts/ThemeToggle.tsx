"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Mencegah hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-6 right-6 z-60 p-3 rounded-full bg-blue-600 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl hover:scale-110 transition-transform active:scale-95"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? (
            <Sun size={24} strokeWidth={2.5} />
          ) : (
            <Moon size={24} strokeWidth={2.5} />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
