import React from "react";
import { Loan } from "@/types/loan";

export interface PlatformStatsSectionProps {
  loans: Loan[];
}

export function PlatformStatsSection({ loans }: PlatformStatsSectionProps) {
  // Aggregate real on-chain metrics without fake data
  let totalRequestedEth = 0;
  let fundedCount = 0;
  let settledCount = 0;
  let openCount = 0;

  for (const loan of loans) {
    const p = parseFloat(loan.principal.replace(/\s*ETH/gi, "")) || 0;
    totalRequestedEth += p;

    if (loan.status === "Requested") {
      openCount++;
    } else if (loan.status === "Funded" || loan.status === "Withdrawn") {
      fundedCount++;
    } else if (loan.status === "Repaid") {
      settledCount++;
    }
  }

  const stats = [
    {
      label: "Total Volume",
      value: `${totalRequestedEth.toFixed(3).replace(/\.?0+$/, "")} ETH`,
      subtext: `Across ${loans.length} loan${loans.length === 1 ? "" : "s"} on Sepolia`,
    },
    {
      label: "Open Requests",
      value: `${openCount} Open`,
      subtext: "Ready for funding",
    },
    {
      label: "Active / Funded",
      value: `${fundedCount} Loans`,
      subtext: "In progress or withdrawn",
    },
    {
      label: "Settled Loans",
      value: `${settledCount} Repaid`,
      subtext: "Full settlement achieved",
    },
  ];

  return (
    <section className="w-full bg-[#fafafa] border-y border-[#e5e5e5] py-20 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-2">
            Protocol Metrics
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Transparent on-chain volume.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((st, idx) => (
            <div
              key={idx}
              className="bg-[#ffffff] border border-[#e5e5e5] rounded-[16px] p-6 sm:p-8"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-2">
                {st.label}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight mb-1">
                {st.value}
              </div>
              <span className="text-xs text-[#666666] block">
                {st.subtext}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
