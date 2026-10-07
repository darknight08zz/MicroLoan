"use client";

import React, { useState } from "react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the loan escrow smart contract operate?",
      a: "When a borrower submits a loan request, the terms (principal, total repayment, and due date) are registered directly on Ethereum Sepolia. When a lender funds the loan, the principal is held securely in the contract escrow until the borrower triggers the withdrawal. Upon withdrawal, the borrower can utilize the capital and repay the exact agreed amount to the contract, which routes funds back to the lender.",
    },
    {
      q: "What happens if a borrower does not repay before the due date?",
      a: "The smart contract strictly monitors block timestamps against the loan's registered due date. If the due date elapses without full repayment, the loan status transitions to 'Past Due', and the contract permits default marking. Defaulted loans are recorded immutably on-chain.",
    },
    {
      q: "How is the lender repayment fee calculated?",
      a: "The borrower specifies both the principal requested and the total repayment amount upon creating the request. The difference between the repayment and principal constitutes the lender's fixed return. For instance, requesting 0.10 ETH with a 0.11 ETH repayment establishes an exact 10% lender return.",
    },
    {
      q: "Which networks and wallets are supported?",
      a: "The DApp currently operates on the Ethereum Sepolia Testnet (Chain ID 11155111). Any EVM-compatible browser wallet such as MetaMask, Coinbase Wallet, or Rabby can connect and execute transactions.",
    },
  ];

  return (
    <section className="w-full bg-[#ffffff] py-20 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-2">
            Questions & Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Frequently asked questions.
          </h2>
        </div>

        <div className="max-w-3xl divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-semibold text-base text-[#111111] hover:text-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-lg font-mono text-[#666666] shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-3 text-sm text-[#666666] leading-relaxed pr-8 view-transition">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
