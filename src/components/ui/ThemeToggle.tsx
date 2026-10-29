"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        title="Toggle theme"
        suppressHydrationWarning
        className={`relative inline-flex items-center justify-center p-2 rounded-[8px] bg-transparent border border-transparent ${className}`}
      >
        <div className="w-4 h-4 opacity-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      suppressHydrationWarning
      className={`relative inline-flex items-center justify-center p-2 rounded-[8px] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] ${
        isDark
          ? "bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] border border-[rgba(255,255,255,0.08)]"
          : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B] border border-[rgba(0,0,0,0.08)]"
      } ${className}`}
    >
      <span className="sr-only" suppressHydrationWarning>
        {isDark ? "Current theme: Dark. Click to switch to Light." : "Current theme: Light. Click to switch to Dark."}
      </span>

      {/* Sun Icon (shown when dark, click switches to light) */}
      <svg
        className={`w-4 h-4 transition-all duration-300 transform ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-[#FAFAFA]"
            : "rotate-90 scale-0 opacity-0 absolute text-[#18181B]"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Moon Icon (shown when light, click switches to dark) */}
      <svg
        className={`w-4 h-4 transition-all duration-300 transform ${
          !isDark
            ? "rotate-0 scale-100 opacity-100 text-[#52525B]"
            : "-rotate-90 scale-0 opacity-0 absolute text-[#71717A]"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
