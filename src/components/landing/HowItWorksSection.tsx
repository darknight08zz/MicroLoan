import React from "react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Request Micro Capital",
      desc: "Borrower defines requested principal in ETH, proposed total repayment amount, and a specific repayment due date.",
    },
    {
      step: "02",
      title: "Direct Peer Funding",
      desc: "Lenders browse verified loan requests in the open marketplace and fund the principal directly into non-custodial escrow.",
    },
    {
      step: "03",
      title: "Withdraw & Settle",
      desc: "Borrower withdraws capital to their address, utilizes funds, and submits the exact repayment before the due date.",
    },
  ];

  return (
    <section className="w-full bg-[#ffffff] py-20 md:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-2">
            Execution Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            How micro lending works.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="bg-[#fafafa] border border-[#e5e5e5] rounded-[16px] p-8 flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-3 py-1 rounded-[6px] bg-[#ffffff] border border-[#e5e5e5] font-mono text-xs font-bold text-[#111111] mb-6">
                  Step {st.step}
                </span>
                <h3 className="text-xl font-bold text-[#111111] tracking-tight mb-3">
                  {st.title}
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
