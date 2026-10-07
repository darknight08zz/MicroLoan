"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UsePollingOptions {
  /**
   * Interval in milliseconds between poll executions.
   * Defaults to 10,000 ms (10 seconds).
   * Set to 0 or null to disable polling.
   */
  intervalMs?: number;

  /**
   * Whether auto-refresh polling is currently enabled.
   * Defaults to true.
   */
  enabled?: boolean;

  /**
   * Whether to pause polling when the browser tab is hidden / in background.
   * Defaults to true.
   */
  pauseOnHidden?: boolean;

  /**
   * Whether to execute an immediate fetch when the browser tab transitions
   * from hidden to visible.
   * Defaults to true.
   */
  refreshOnVisible?: boolean;
}

export interface UsePollingResult {
  /** True when a poll execution is currently in-flight */
  isPolling: boolean;
  /** Timestamp of the last successful execution */
  lastSuccessAt: Date | null;
  /** Timestamp of the last execution attempt (success or failure) */
  lastAttemptAt: Date | null;
  /** Manually trigger an immediate execution and restart the interval timer */
  triggerNow: () => Promise<void>;
  /** Pause the polling timer */
  pause: () => void;
  /** Resume the polling timer */
  resume: () => void;
  /** Whether the polling timer is currently active */
  isActive: boolean;
}

/**
 * Clean, reusable hook to run an asynchronous polling task on a controlled interval.
 *
 * Requirements satisfied:
 * - Controlled interval (default 10s) with clean unmount cleanup
 * - Prevents overlapping requests (in-flight guard)
 * - Prevents duplicate intervals
 * - Pauses on browser tab hidden (`document.visibilityState === 'hidden'`)
 * - Resumes and refreshes on tab visible (`document.visibilityState === 'visible'`)
 * - Read-only safe execution with error boundary
 */
export function usePolling(
  callback: () => Promise<void> | void,
  options: UsePollingOptions = {}
): UsePollingResult {
  const {
    intervalMs = 10_000,
    enabled = true,
    pauseOnHidden = true,
    refreshOnVisible = true,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastSuccessAt, setLastSuccessAt] = useState<Date | null>(null);
  const [lastAttemptAt, setLastAttemptAt] = useState<Date | null>(null);
  const [isPausedManually, setIsPausedManually] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Keep latest callback in a ref to avoid resetting interval when callback identity changes
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Track if a task is currently executing to prevent overlapping requests
  const isInFlightRef = useRef(false);
  // Track interval timer ID
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track component mounted status
  const isMountedRef = useRef(true);
  // Track tab visibility status
  const isTabVisibleRef = useRef(true);

  const executeTick = useCallback(async () => {
    // 1. Guard: Check if component is still mounted
    if (!isMountedRef.current) return;

    // 2. Guard: Prevent overlapping requests if previous execution is still running
    if (isInFlightRef.current) {
      console.debug("[usePolling] Previous poll still in-flight. Skipping overlapping tick.");
      return;
    }

    // 3. Guard: Check tab visibility if pauseOnHidden is active
    if (pauseOnHidden && !isTabVisibleRef.current) {
      return;
    }

    isInFlightRef.current = true;
    if (isMountedRef.current) {
      setIsPolling(true);
      setLastAttemptAt(new Date());
    }

    try {
      await callbackRef.current();
      if (isMountedRef.current) {
        setLastSuccessAt(new Date());
      }
    } catch (err) {
      console.warn("[usePolling] Tick execution encountered an error:", err);
    } finally {
      isInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [pauseOnHidden]);

  // Manual trigger that executes immediately and resets the interval timer
  const triggerNow = useCallback(async () => {
    // Clear and restart timer to prevent double-firing immediately after manual trigger
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsActive(false);
    }

    await executeTick();

    if (enabled && !isPausedManually && intervalMs && intervalMs > 0 && isMountedRef.current) {
      if (!pauseOnHidden || isTabVisibleRef.current) {
        timerRef.current = setInterval(executeTick, intervalMs);
        setIsActive(true);
      }
    }
  }, [executeTick, enabled, isPausedManually, intervalMs, pauseOnHidden]);

  const pause = useCallback(() => {
    setIsPausedManually(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsActive(false);
    }
  }, []);

  const resume = useCallback(() => {
    setIsPausedManually(false);
  }, []);

  // Main polling lifecycle effect
  useEffect(() => {
    isMountedRef.current = true;

    // Check initial tab visibility
    if (typeof document !== "undefined") {
      isTabVisibleRef.current = !document.hidden;
    }

    // Handle tab visibility transitions
    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      const isVisible = !document.hidden;
      isTabVisibleRef.current = isVisible;

      if (pauseOnHidden) {
        if (!isVisible) {
          // Tab hidden: pause the interval timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsActive(false);
          }
        } else {
          // Tab became visible: resume interval timer and trigger fresh update if configured
          if (enabled && !isPausedManually && intervalMs && intervalMs > 0) {
            if (refreshOnVisible) {
              executeTick();
            }
            if (!timerRef.current) {
              timerRef.current = setInterval(executeTick, intervalMs);
              setIsActive(true);
            }
          }
        }
      }
    };

    if (typeof document !== "undefined" && pauseOnHidden) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Setup active interval if enabled and tab is visible
    if (enabled && !isPausedManually && intervalMs && intervalMs > 0) {
      if (!pauseOnHidden || isTabVisibleRef.current) {
        timerRef.current = setInterval(executeTick, intervalMs);
        setIsActive(true);
      }
    }

    // Cleanup: guarantee interval cancellation and event listener removal on unmount
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsActive(false);
      }
      if (typeof document !== "undefined" && pauseOnHidden) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [enabled, isPausedManually, intervalMs, pauseOnHidden, refreshOnVisible, executeTick]);

  return {
    isPolling,
    lastSuccessAt,
    lastAttemptAt,
    triggerNow,
    pause,
    resume,
    isActive,
  };
}
