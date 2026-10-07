import React from "react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full bg-[#fafafa] border-t border-[#e5e5e5] mt-auto py-12 text-xs text-[#666666]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="MicroLoan Logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-[6px] object-contain"
            />
            <span className="font-bold text-sm text-[#111111] tracking-tight">
              MicroLoan DApp
            </span>
          </div>
          <p className="text-xs text-[#666666] max-w-md leading-relaxed">
            Decentralized peer-to-peer micro-lending. Non-custodial smart contracts with fixed repayment terms.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#666666]">
          <p>© {new Date().getFullYear()} MicroLoan DApp. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Peer-to-Peer Lending</span>
            <span>•</span>
            <span>Non-Custodial Escrow</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
