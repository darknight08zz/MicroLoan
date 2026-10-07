import React from "react";
import { Button } from "@/components/ui/Button";

export interface CtaSectionProps {
  onBorrowClick: () => void;
  onLendClick: () => void;
}

export function CtaSection({ onBorrowClick, onLendClick }: CtaSectionProps) {
  return (
    <section className="w-full bg-[#fafafa] border-t border-[#e5e5e5] py-20 md:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-[20px] p-8 sm:p-12 md:p-16 text-center max-w-4xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-3">
            Get Started on Sepolia
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111111] tracking-tight mb-4">
            Participate in peer-to-peer micro finance.
          </h2>
          <p className="text-sm sm:text-base text-[#666666] max-w-xl mx-auto leading-relaxed mb-8">
            Deploy your Ethereum wallet to either request capital with transparent terms or lend directly to peer borrowers on-chain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button variant="primary" size="lg" onClick={onBorrowClick}>
              Request a Loan
            </Button>
            <Button variant="secondary" size="lg" onClick={onLendClick}>
              Explore Marketplace
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
