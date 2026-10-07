"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`relative inline-flex items-center justify-center p-2 rounded-[8px] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f5f5f5] ${
        isDark
          ? "bg-[#1e1e1e] hover:bg-[#282828] text-[#f5f5f5] border border-[#2a2a2a]"
          : "bg-[#ffffff] hover:bg-[#f5f5f5] text-[#111111] border border-[#e5e5e5]"
      } ${className}`}
    >
      <span className="sr-only">
        {isDark ? "Current theme: Dark. Click to switch to Light." : "Current theme: Light. Click to switch to Dark."}
      </span>

      {/* Sun Icon (shown when dark, click switches to light) */}
      <svg
        className={`w-4 h-4 transition-all duration-300 transform ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-[#f5f5f5]"
            : "rotate-90 scale-0 opacity-0 absolute text-[#111111]"
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
            ? "rotate-0 scale-100 opacity-100 text-[#333333]"
            : "-rotate-90 scale-0 opacity-0 absolute text-[#858A82]"
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
