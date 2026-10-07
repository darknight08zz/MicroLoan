"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { ThemeToggle } from "./ThemeToggle";

export type Role = "borrower" | "lender";

export interface NavbarProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  activeNav?: "home" | "marketplace" | "borrow" | "lender" | "dashboard";
  onNavClick?: (nav: "home" | "marketplace" | "borrow" | "lender" | "dashboard") => void;
}

export function MetaMaskIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M28.46 3.52a.7.7 0 00-.73-.08L18.9 8.25l-2.9-7.9a.7.7 0 00-1.31 0l-2.9 7.9L3.06 3.44a.7.7 0 00-.73.08.7.7 0 00-.28.66l2.12 15.6a14.7 14.7 0 005.15 9.77l6.2 5.02a.7.7 0 00.88 0l6.2-5.02a14.7 14.7 0 005.15-9.77l2.12-15.6a.7.7 0 00-.28-.66z"
        fill="#E17726"
      />
      <path
        d="M10.2 12.5l5.8-2.6 5.8 2.6-1.5 5.5h-8.6l-1.5-5.5z"
        fill="#E27625"
      />
      <path
        d="M8.5 18l7.5 5.5 7.5-5.5-2.2 4.8-5.3 3.2-5.3-3.2L8.5 18z"
        fill="#E27625"
      />
      <path
        d="M12.5 17h7v4h-7v-4z"
        fill="#161616"
      />
      <path
        d="M16 23.5l-4-2.5.8-1.5h6.4l.8 1.5-4 2.5z"
        fill="#F6851B"
      />
    </svg>
  );
}

export function MicroLoanBrandMark({ className = "w-5 h-5 text-[#111111]" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2" />
      <path d="M7 15L12 9L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar({
  activeRole,
  onRoleChange,
  activeNav,
  onNavClick,
}: NavbarProps) {
  const {
    account,
    shortAddress,
    isConnecting,
    isSwitchingNetwork,
    isSepolia,
    accountChangeNotice,
    connectWallet,
    switchToSepolia,
    disconnectWallet,
    clearAccountChangeNotice,
    networkName,
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="w-full bg-[#ffffff]/95 backdrop-blur-md border-b border-[#e5e5e5] sticky top-0 z-40 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LEFT: Monochromatic Minimal Brand */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => onNavClick ? onNavClick("home") : onRoleChange("borrower")}
            className="flex items-center gap-2.5 focus:outline-none cursor-pointer group text-left"
          >
            <Image
              src="/logo.png"
              alt="MicroLoan Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-[8px] object-contain transition-transform group-hover:scale-105"
              priority
            />
            <span className="text-base font-bold tracking-tight text-[#111111]">
              MicroLoan
            </span>
          </button>

          {/* Optional top-level navigation triggers */}
          {onNavClick && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#666666]">
              <button
                type="button"
                onClick={() => onNavClick("home")}
                className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
                  activeNav === "home" ? "text-[#111111] bg-[#f5f5f5] font-semibold" : "hover:text-[#111111] hover:bg-[#fafafa]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => onNavClick("marketplace")}
                className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
                  activeNav === "marketplace" ? "text-[#111111] bg-[#f5f5f5] font-semibold" : "hover:text-[#111111] hover:bg-[#fafafa]"
                }`}
              >
                Marketplace
              </button>
            </nav>
          )}
        </div>

        {/* CENTER: Clean Role Selector (Borrower | Lender) */}
        <nav
          className="flex items-center gap-1 sm:gap-2 h-full relative"
          aria-label="User Role Selection"
        >
          <button
            type="button"
            onClick={() => {
              if (onNavClick) onNavClick("borrow");
              onRoleChange("borrower");
            }}
            className={`relative h-full flex items-center px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeRole === "borrower"
                ? "text-[#111111]"
                : "text-[#666666] hover:text-[#111111]"
            }`}
          >
            <span>Borrow</span>
            {activeRole === "borrower" && (
              <span
                className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-[2px] bg-[#111111] transition-all"
                aria-hidden="true"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavClick) onNavClick("lender");
              onRoleChange("lender");
            }}
            className={`relative h-full flex items-center px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeRole === "lender"
                ? "text-[#111111]"
                : "text-[#666666] hover:text-[#111111]"
            }`}
          >
            <span>Lend</span>
            {activeRole === "lender" && (
              <span
                className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-[2px] bg-[#111111] transition-all"
                aria-hidden="true"
              />
            )}
          </button>
        </nav>

        {/* RIGHT: Minimal Sepolia Status Pill + Monochromatic Wallet Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative" ref={dropdownRef}>
          {/* Sepolia Status Indicator */}
          {!account || isSepolia ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-xs text-[#4b5563] font-medium"
              title={account ? "Connected Network: Ethereum Sepolia" : "Network: Ethereum Sepolia"}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#16803c] shrink-0"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Sepolia</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fefce8] border border-[#fef08a] text-xs text-[#a16207] font-medium"
              title={`Connected to ${networkName}. Please switch to Sepolia.`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#a16207] shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium hidden sm:inline">Wrong Net</span>
              <button
                type="button"
                onClick={() => switchToSepolia()}
                disabled={isSwitchingNetwork}
                className="bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                {isSwitchingNetwork ? "..." : "Switch"}
              </button>
            </div>
          )}

          <ThemeToggle />

          {!account ? (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-[#111111] hover:bg-[#2a2a2a] active:bg-[#000000] text-[#ffffff] font-medium text-xs sm:text-sm rounded-[8px] px-3.5 sm:px-4 py-1.5 sm:py-2 transition-all btn-interactive cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <MetaMaskIcon className="w-4 h-4 shrink-0" />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          ) : (
            /* Connected: [ Fox 0x82...91A ] with hairline border */
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#f5f5f5] border border-[#d9d9d9] text-[#111111] rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                title={account}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <MetaMaskIcon className="w-4 h-4 shrink-0" />
                <span className="font-mono">{shortAddress}</span>
                <svg
                  className={`w-3 h-3 text-[#666666] transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Connected Wallet Minimal Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#ffffff] border border-[#e5e5e5] rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.08)] p-3 z-50 text-[#111111] view-transition">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1.5">
                    Account
                  </div>
                  <div className="p-2 bg-[#fafafa] rounded-[8px] border border-[#e5e5e5] flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[#111111] truncate max-w-[160px]">
                      {account}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="text-xs text-[#111111] hover:underline font-medium px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Copy full address"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e5e5e5] mb-2.5">
                    <span className="text-[#666666]">Network</span>
                    <span className="text-[#111111] font-medium flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSepolia ? "bg-[#16803c]" : "bg-[#a16207]"
                        }`}
                      />
                      {networkName}
                    </span>
                  </div>

                  {!isSepolia && (
                    <button
                      type="button"
                      onClick={() => switchToSepolia()}
                      disabled={isSwitchingNetwork}
                      className="w-full mb-2 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-[#ffffff] bg-[#111111] hover:bg-[#2a2a2a] rounded-[8px] transition-colors cursor-pointer"
                    >
                      <span>Switch to Sepolia</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setDropdownOpen(false);
                    }}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-[#b42318] hover:bg-[#fef2f2] border border-[#fecaca] rounded-[8px] transition-colors cursor-pointer"
                  >
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Changed Notice */}
      {accountChangeNotice && (
        <div className="max-w-[1400px] mx-auto px-4 py-2 bg-[#fafafa] border-b border-[#e5e5e5] text-[#111111] text-xs flex items-center justify-between">
          <span className="text-[#666666]">{accountChangeNotice}</span>
          <button
            type="button"
            onClick={clearAccountChangeNotice}
            className="text-xs text-[#111111] font-semibold hover:underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
}
