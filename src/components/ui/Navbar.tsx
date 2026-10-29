"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { ThemeToggle } from "./ThemeToggle";

export type Role = "borrower" | "lender";

export interface NavbarProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  activeNav?: "home" | "borrow" | "lender" | "dashboard";
  onNavClick?: (nav: "home" | "borrow" | "lender" | "dashboard") => void;
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
  onRoleChange,
  activeNav = "home",
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
    balance,
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const navItems = [
    { id: "home", label: "Home", action: () => onNavClick && onNavClick("home") },
    {
      id: "borrow",
      label: "Borrow",
      action: () => {
        onRoleChange("borrower");
        if (onNavClick) onNavClick("borrow");
      },
    },
    {
      id: "lender",
      label: "Lend",
      action: () => {
        onRoleChange("lender");
        if (onNavClick) onNavClick("lender");
      },
    },
    { id: "dashboard", label: "Dashboard", action: () => onNavClick && onNavClick("dashboard") },
  ];

  return (
    <header
      className={`sticky top-0 left-0 w-full z-40 transition-all duration-300 ${
        isScrolled
          ? "h-[68px] backdrop-blur-xl border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 shadow-xs"
          : "h-[76px] sm:h-[80px] backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border-subtle)]/70"
      }`}
    >
      <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => (onNavClick ? onNavClick("home") : onRoleChange("borrower"))}
          className="group flex items-center gap-2.5 focus:outline-none cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-center p-1 shadow-xs transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="MicroLoan Logo"
              width={22}
              height={22}
              className="w-5 h-5 rounded-full object-contain"
              priority
            />
          </div>
          <span className="font-mono text-sm sm:text-base font-bold tracking-[0.16em] text-[var(--text-highlight)] uppercase whitespace-nowrap transition-colors group-hover:text-[var(--text-secondary)]">
            MicroLoan
          </span>
        </button>

        {onNavClick && (
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--bg-secondary)]/90 backdrop-blur-md px-2 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-xs">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`relative px-4 py-1.5 rounded-full text-[11px] font-mono tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[var(--bg-card)] border border-[var(--grayscale-accent-border)] shadow-xs font-semibold text-[var(--text-highlight)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50 font-normal border border-transparent"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">

          <ThemeToggle className="rounded-full w-8 h-8 p-1.5 shadow-xs" />

          {!account ? (
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="rounded-full bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] font-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer btn-interactive"
            >
              <MetaMaskIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isConnecting ? "Connecting..." : "Connect"}</span>
            </button>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-highlight)] rounded-full px-3.5 py-1.5 text-xs font-mono shadow-xs transition-colors cursor-pointer"
                title={account}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {balance && (
                  <>
                    <span className="font-mono hidden sm:inline text-[var(--text-muted)] font-normal">
                      {balance}
                    </span>
                    <span className="hidden sm:inline w-[1px] h-3 bg-[var(--border-subtle)]" />
                  </>
                )}
                <MetaMaskIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono font-medium">{shortAddress}</span>
                <svg
                  className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-3.5 z-50 text-[var(--text-highlight)] view-transition">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Account Details
                  </div>
                  <div className="p-2.5 bg-[var(--bg-secondary)] rounded-[10px] border border-[var(--border-subtle)] flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs text-[var(--text-primary)] truncate max-w-[150px]">
                      {account}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="text-xs font-mono text-[var(--text-highlight)] hover:underline font-medium px-1.5 py-0.5 rounded cursor-pointer"
                      title="Copy full address"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-[var(--border-subtle)] mb-2">
                    <span className="text-[var(--text-muted)]">Balance</span>
                    <span className="font-medium text-[var(--text-highlight)]">
                      {balance || "0.0000 ETH"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-[var(--border-subtle)] mb-3">
                    <span className="text-[var(--text-muted)]">Network</span>
                    <span className="font-medium text-[var(--text-highlight)] flex items-center gap-1.5">
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
                      className="w-full mb-2 flex items-center justify-center py-1.5 px-3 text-xs font-mono font-medium text-[#ffffff] bg-[#111111] hover:bg-[#2a2a2a] rounded-full transition-colors cursor-pointer"
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
                    className="w-full mt-1 flex items-center justify-center py-1.5 px-3 text-xs font-mono font-medium text-[#b42318] hover:bg-[#fef2f2] border border-[#fecaca] rounded-full transition-colors cursor-pointer"
                  >
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="flex flex-col gap-1 w-4 items-center justify-center">
              <span
                className={`w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-transform duration-200 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-[5.5px]" : ""
                }`}
              />
              <span
                className={`w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-opacity duration-200 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-4 h-[1.5px] bg-[var(--text-primary)] rounded-full transition-transform duration-200 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-[5.5px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 space-y-4 view-transition">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left px-3.5 py-2.5 rounded-[10px] text-xs font-mono uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--bg-secondary)] text-[var(--text-highlight)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {accountChangeNotice && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] text-[var(--text-highlight)] text-xs flex items-center justify-between">
          <span className="text-[var(--text-muted)] font-mono">{accountChangeNotice}</span>
          <button
            type="button"
            onClick={clearAccountChangeNotice}
            className="text-xs font-mono text-[var(--text-highlight)] font-semibold hover:underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
}
