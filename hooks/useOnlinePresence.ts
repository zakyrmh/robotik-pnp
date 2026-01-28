"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  setUserOnline,
  setUserIdle,
  IDLE_TIMEOUT_MS,
} from "@/lib/firebase/services/user-status";

// ============================================
// CONFIGURATION
// ============================================

// Events yang dianggap sebagai aktivitas user
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

// Debounce untuk activity detection (tidak perlu update setiap gerakan mouse)
const ACTIVITY_DEBOUNCE_MS = 30 * 1000; // 30 detik

// ============================================
// HOOK
// ============================================

interface UseOnlinePresenceOptions {
  sessionId?: string;
}

/**
 * Hook untuk mengelola online presence dan idle detection
 *
 * Fitur:
 * - Set user online saat mount
 * - Detect idle setelah 5 menit tidak ada aktivitas
 * - Auto-offline saat browser disconnect (via onDisconnect)
 *
 * @param options - Opsi tambahan (sessionId)
 */
export function useOnlinePresence(options?: UseOnlinePresenceOptions) {
  const { user } = useAuth();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set user as active if was idle
    if (isIdleRef.current && user?.uid && mountedRef.current) {
      isIdleRef.current = false;
      setUserIdle(user.uid, false);
    }

    // Start new idle timer
    idleTimerRef.current = setTimeout(() => {
      if (user?.uid && mountedRef.current) {
        isIdleRef.current = true;
        setUserIdle(user.uid, true);
      }
    }, IDLE_TIMEOUT_MS);
  }, [user?.uid]);

  // Handle activity event (debounced)
  const handleActivity = useCallback(() => {
    const now = Date.now();

    // Debounce: only process if enough time has passed
    if (now - lastActivityRef.current < ACTIVITY_DEBOUNCE_MS) {
      // Still reset the idle timer even if debounced
      resetIdleTimer();
      return;
    }

    lastActivityRef.current = now;
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Initialize presence on mount
  useEffect(() => {
    if (!user?.uid) return;

    mountedRef.current = true;

    const initPresence = async () => {
      // Lazy load UAParser to reduce initial bundle size
      const { UAParser } = await import("ua-parser-js");
      if (!mountedRef.current) return;

      const parser = new UAParser();
      const { browser, os, device } = parser.getResult();

      const browserName = browser.name || "Unknown Browser";
      const osName = os.name || "Unknown OS";
      const osVersion = os.version || "";

      let deviceName = `${browserName} on ${osName} ${osVersion}`;

      if (device.model) {
        deviceName += ` (${device.vendor ? device.vendor + " " : ""}${device.model})`;
      }

      // Set user online with session ID
      await setUserOnline(user.uid, deviceName.trim(), options?.sessionId);

      // Start idle timer
      resetIdleTimer();
    };

    initPresence();

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      mountedRef.current = false;

      // Remove activity listeners
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      // Clear idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [user?.uid, options?.sessionId, handleActivity, resetIdleTimer]);

  return null;
}

/**
 * Simpler version without idle detection
 * Untuk digunakan jika tidak perlu idle tracking
 */
export function useSimpleOnlinePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    let mounted = true;

    const initPresence = async () => {
      const { UAParser } = await import("ua-parser-js");
      if (!mounted) return;

      const parser = new UAParser();
      const { browser, os, device } = parser.getResult();

      const browserName = browser.name || "Unknown Browser";
      const osName = os.name || "Unknown OS";
      const osVersion = os.version || "";

      let deviceName = `${browserName} on ${osName} ${osVersion}`;

      if (device.model) {
        deviceName += ` (${device.vendor ? device.vendor + " " : ""}${device.model})`;
      }

      await setUserOnline(user.uid, deviceName.trim());
    };

    initPresence();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  return null;
}
