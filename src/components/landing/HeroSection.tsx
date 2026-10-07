import React from "react";
import { Button } from "@/components/ui/Button";

export interface HeroSectionProps {
  onBorrowClick: () => void;
  onLendClick: () => void;
  totalLoansCount: number;
  openLoansCount: number;
}

export function HeroSection({
  onBorrowClick,
  onLendClick,
  totalLoansCount,
  openLoansCount,
}: HeroSectionProps) {
  return (
    <section className="w-full bg-[#ffffff] pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Hero Heading: 48-72px desktop, 36-48px tablet, 32-40px mobile, 700-800 weight */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#111111] tracking-tight leading-[1.08] mb-6">
            Peer-to-peer capital.<br />
            Zero intermediaries.<br />
            Fixed transparent terms.
          </h1>

          {/* Body Text: 15-18px, 400-500 weight, #333333 */}
          <p className="text-base sm:text-lg text-[#333333] max-w-2xl leading-relaxed mb-10">
            A minimal, non-custodial lending protocol on Ethereum Sepolia. Borrowers request micro-capital with fixed repayment due dates, and lenders supply funds directly via smart contracts.
          </p>

          {/* Primary Action Group: High contrast, clean buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-16">
            <Button
              variant="primary"
              size="lg"
              onClick={onBorrowClick}
            >
              Borrow Now
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onLendClick}
            >
              Start Lending
            </Button>
          </div>

          {/* Live Micro Ticker */}
          <div className="pt-8 border-t border-[#e5e5e5] grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1">
                Protocol
              </span>
              <span className="text-sm font-semibold text-[#111111]">
                Ethereum Sepolia
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1">
                Total Loans
              </span>
              <span className="text-sm font-bold text-[#111111]">
                {totalLoansCount} Created
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1">
                Open Requests
              </span>
              <span className="text-sm font-bold text-[#111111]">
                {openLoansCount} Active
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#666666] mb-1">
                Settlement
              </span>
              <span className="text-sm font-semibold text-[#111111]">
                Non-Custodial Escrow
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
