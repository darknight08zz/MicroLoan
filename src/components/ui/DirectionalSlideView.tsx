"use client";

import React, { useState, useEffect, useRef } from "react";

export type SlideDirection = "forward" | "backward";

export interface DirectionalSlideViewProps {
  currentKey: string;
  direction: SlideDirection;
  children: React.ReactNode;
  durationMs?: number;
  className?: string;
}

interface ExitingState {
  key: string;
  element: React.ReactNode;
  direction: SlideDirection;
}

export function DirectionalSlideView({
  currentKey,
  direction,
  children,
  durationMs = 240,
  className = "",
}: DirectionalSlideViewProps) {
  const [exiting, setExiting] = useState<ExitingState | null>(null);

  // Keep references to previous children and key
  const prevChildrenRef = useRef<React.ReactNode>(children);
  const prevKeyRef = useRef<string>(currentKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefers reduced motion detection (lazy state initialization to prevent setState in effect)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // When currentKey changes, trigger directional slide transition
  useEffect(() => {
    if (currentKey !== prevKeyRef.current) {
      const oldKey = prevKeyRef.current;
      const oldChildren = prevChildrenRef.current;

      prevKeyRef.current = currentKey;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!prefersReducedMotion) {
        setExiting({
          key: oldKey,
          element: oldChildren,
          direction,
        });

        timerRef.current = setTimeout(() => {
          setExiting(null);
          timerRef.current = null;
        }, durationMs);
      } else {
        setExiting(null);
      }
    }
  }, [currentKey, direction, durationMs, prefersReducedMotion]);

  // Keep prevChildrenRef updated with current children after each render
  useEffect(() => {
    prevChildrenRef.current = children;
  }, [children]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* 1. Outgoing View (Overlays absolutely and slides out) */}
      {exiting && (
        <div
          key={`exit-${exiting.key}`}
          aria-hidden="true"
          className={`w-full pointer-events-none absolute top-0 left-0 z-0 ${
            exiting.direction === "forward"
              ? "animate-slide-out-left"
              : "animate-slide-out-right"
          }`}
        >
          {exiting.element}
        </div>
      )}

      {/* 2. Incoming / Active View (Maintains normal flow & height and slides in) */}
      <div
        key={`active-${currentKey}`}
        className={`w-full relative z-10 ${
          exiting
            ? exiting.direction === "forward"
              ? "animate-slide-in-right"
              : "animate-slide-in-left"
            : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
