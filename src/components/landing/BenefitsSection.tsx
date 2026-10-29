"use client";

import React, { useState } from "react";

export interface BenefitsSectionProps {
  onBorrowClick?: () => void;
  onLendClick?: () => void;
}

export function BenefitsSection() {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const steps = [
    {
      number: "01",
      tag: "Borrower",
      title: "Set terms upfront",
      description:
        "Borrowers specify the exact principal needed in ETH, a fixed repayment percentage fee, and their preferred due date. No hidden interest curves or surprises.",
      preview: {
        label: "Example Request",
        amount: "0.50 ETH",
        details: "30-day term · 5% fixed fee (0.025 ETH)",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
          <line x1="2" y1="10" x2="22" y2="10" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      number: "02",
      tag: "Lender",
      title: "Fund into secure escrow",
      description:
        "Lenders review open requests in the marketplace. When funded, capital deposits directly into non-custodial smart contract escrow — never held by platform operators.",
      preview: {
        label: "Escrow Status",
        amount: "0.50 ETH Locked",
        details: "Non-custodial smart contract custody",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.5" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      number: "03",
      tag: "Borrower",
      title: "Receive & utilize capital",
      description:
        "The borrower withdraws the liquid principal directly into their personal wallet. The immutable on-chain due date countdown begins automatically.",
      preview: {
        label: "Capital Drawdown",
        amount: "0.50 ETH Disbursed",
        details: "Transferred to borrower wallet address",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      number: "04",
      tag: "Settlement",
      title: "Repay & earn fixed yield",
      description:
        "The borrower submits repayment before the deadline. The smart contract atomically routes the principal plus agreed fee back to the lender, closing the loan.",
      preview: {
        label: "Final Settlement",
        amount: "0.525 ETH Settled",
        details: "0.50 ETH principal + 0.025 ETH fee to lender",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[var(--bg-primary)] border-y border-[var(--border-subtle)] py-16 sm:py-24 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Natural & Clean */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-2.5">
            Protocol Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-highlight)] tracking-tight">
            How micro lending works.
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            A simple, transparent four-step journey between borrowers and lenders, secured directly by smart contracts.
          </p>
        </div>

        {/* 4 Interactive Lifecycle Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((st, idx) => {
            const isCurrent = selectedStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedStep(idx)}
                className={`group relative p-6 rounded-[16px] border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? "bg-[var(--bg-card)] border-[var(--grayscale-accent-border)] shadow-xs"
                    : "bg-[var(--bg-card)]/50 border-[var(--border-subtle)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                      {st.number}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[6px] border ${
                        isCurrent
                          ? "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                          : "bg-transparent border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {st.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-highlight)] tracking-tight mb-2">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    {st.description}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-[12px] border transition-colors ${
                    isCurrent
                      ? "bg-[var(--bg-secondary)] border-[var(--border-subtle)]"
                      : "bg-transparent border-[var(--border-subtle)]/60"
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    {st.preview.label}
                  </div>
                  <div className="text-sm font-bold text-[var(--text-highlight)] mt-1">
                    {st.preview.amount}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {st.preview.details}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ArchitectureSection({ onBorrowClick, onLendClick }: BenefitsSectionProps) {
  const pillars = [
    {
      number: "01",
      title: "Direct Smart Contract Escrow",
      description:
        "Funds are locked securely in EVM smart contract escrow. Neither platform operators nor centralized parties ever have custody over lender or borrower funds.",
    },
    {
      number: "02",
      title: "Fixed Repayments, Zero Surprises",
      description:
        "Every loan defines an exact principal and total repayment amount upfront. No dynamic interest rate swings, no compounding balances, and no hidden spreads.",
    },
    {
      number: "03",
      title: "Verifiable Due Dates & Enforcement",
      description:
        "Due dates are recorded immutably on-chain. Loans past their deadline can be flagged by lenders, ensuring transparent credit tracking across all transactions.",
    },
  ];

  return (
    <section className="w-full bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] py-16 sm:py-24 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-2">
            Architecture & Trust
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-highlight)] tracking-tight">
            Built for financial transparency.
          </h3>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Every loan is governed by verifiable code on Ethereum, guaranteeing equal clarity for both parties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-[16px] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="font-mono text-xs font-bold text-[var(--text-muted)] mb-4">
                {p.number}
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-[var(--text-highlight)] tracking-tight mb-3">
                {p.title}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Clean, Subtle Action Triggers */}
        {(onBorrowClick || onLendClick) && (
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Ready to participate in the micro lending market? Connect with MetaMask on Sepolia testnet.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {onBorrowClick && (
                <button
                  type="button"
                  onClick={onBorrowClick}
                  className="px-4 py-2 rounded-[8px] bg-[var(--accent-primary)] text-[var(--theme-page-bg)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer btn-interactive"
                >
                  Request a Loan →
                </button>
              )}
              {onLendClick && (
                <button
                  type="button"
                  onClick={onLendClick}
                  className="px-4 py-2 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Explore Marketplace
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
