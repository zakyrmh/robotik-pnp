"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { setUserOnline } from "@/lib/firebase/services/user-status";

export function useOnlinePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    let mounted = true;

    const initPresence = async () => {
      // Lazy load UAParser to reduce initial bundle size
      const { UAParser } = await import("ua-parser-js");
      if (!mounted) return;

      const parser = new UAParser();
      const { browser, os, device } = parser.getResult();

      const browserName = browser.name || "Unknown Browser";
      const osName = os.name || "Unknown OS";
      const osVersion = os.version || "";

      let deviceName = `${browserName} on ${osName} ${osVersion}`;

      if (device.model) {
        deviceName += ` (${device.vendor ? device.vendor + " " : ""}${
          device.model
        })`;
      }

      // Set user online when user is detected
      setUserOnline(user.uid, deviceName.trim());
    };

    initPresence();

    return () => {
      mounted = false;
    };
  }, [user]);

  return null;
}
