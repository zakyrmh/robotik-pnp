"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { setUserOnline } from "@/lib/firebase/services/user-status";
import { UAParser } from "ua-parser-js";

export function useOnlinePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

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
    // This also sets up the onDisconnect handler
    setUserOnline(user.uid, deviceName.trim());

    // No cleanup here because onDisconnect handles the disconnect event.
    // Explicit offline on logout is handled in the logout function or manually.

    // However, if we want to be safe, we could set offline on unmount?
    // But as discussed, looking at SPA behavior, we might not want to flicker on refresh.
    // relying on onDisconnect is standard for this.
  }, [user]);

  return null;
}
