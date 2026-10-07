import React from "react";

export function BenefitsSection() {
  const benefits = [
    {
      number: "01",
      title: "Direct Smart Contract Escrow",
      description:
        "Funds are locked securely in EVM smart contract escrow. Neither platform operators nor centralized parties have custody over lender or borrower funds.",
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
    <section className="w-full bg-[#fafafa] border-y border-[#e5e5e5] py-20 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-2">
            Protocol Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Built for financial transparency.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] p-8 transition-all hover:border-[#d4d4d4]"
            >
              <div className="font-mono text-xs font-bold text-[#666666] mb-6">
                {b.number}
              </div>
              <h3 className="text-xl font-bold text-[#111111] tracking-tight mb-3">
                {b.title}
              </h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
