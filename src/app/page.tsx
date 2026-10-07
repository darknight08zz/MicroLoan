"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Navbar,
  Role,
  TransactionBanner,
  Footer,
} from "@/components/ui";
import { useWallet } from "@/context/WalletContext";
import {
  useLoans,
  useCreateLoan,
  useWithdrawLoan,
  useRepayLoan,
  useFundLoan,
} from "@/contracts";
import {
  HeroSection,
  BenefitsSection,
  HowItWorksSection,
  PlatformStatsSection,
  FaqSection,
  CtaSection,
} from "@/components/landing";
import { LoanMarketplace } from "@/components/marketplace";
import { CreateLoanRequest, BorrowerDashboard } from "@/components/borrower";
import { LenderDashboard } from "@/components/lender";
import { SingleLoanVerifier } from "@/components/loans";
import { Loan } from "@/types/loan";

/**
 * Minimal monochromatic auto-refresh status indicator.
 */
function AutoRefreshIndicator({
  isRefreshing,
  lastUpdated,
  warning,
  nowMs,
}: {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  warning?: string | null;
  nowMs: number;
}) {
  let text = "Syncing...";
  if (isRefreshing) {
    text = "Updating...";
  } else if (lastUpdated) {
    const diffSec = Math.max(0, Math.floor((nowMs - lastUpdated.getTime()) / 1000));
    if (diffSec < 4) {
      text = "Synced just now";
    } else if (diffSec < 60) {
      text = `Synced ${diffSec}s ago`;
    } else {
      text = `Synced ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-[#666666] font-medium select-none">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
          isRefreshing
            ? "bg-[#111111] animate-ping"
            : warning
            ? "bg-[#a16207]"
            : "bg-[#16803c]"
        }`}
        title={warning || "Auto-refresh active (polls Sepolia every 10s)"}
      />
      <span>{text}</span>
      {warning && (
        <span className="text-[10px] text-[#a16207] bg-[#fefce8] border border-[#fef08a] rounded px-1.5 py-0.2">
          Retrying
        </span>
      )}
    </div>
  );
}

export type ViewMode = "landing" | "borrow" | "lender";

export default function MicroLoanApp() {
  const {
    account,
    isSepolia,
    networkName,
    isSwitchingNetwork,
    switchToSepolia,
    connectWallet,
  } = useWallet();

  // Read-only smart contract data hook with 10-second auto-refresh polling
  const {
    loans,
    isLoading: isLoansLoading,
    isRefreshing: isLoansRefreshing,
    lastUpdated: loansLastUpdated,
    refreshWarning: loansRefreshWarning,
    refetch: refetchLoans,
  } = useLoans({ pollIntervalMs: 10_000 });

  // 1-second ticker for relative timestamp display
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Write hooks
  const {
    createLoan,
    status: createTxStatus,
    isLoading: isCreateTxLoading,
    txHash: createTxHash,
    errorMessage: createTxError,
    technicalDetails: createTxDetails,
    actionHint: createTxActionHint,
    reset: resetCreateTx,
  } = useCreateLoan();

  const {
    withdrawLoan,
    status: withdrawTxStatus,
    isLoading: isWithdrawTxLoading,
    activeLoanId: withdrawingLoanId,
    txHash: withdrawTxHash,
    errorMessage: withdrawTxError,
    technicalDetails: withdrawTxDetails,
    actionHint: withdrawTxActionHint,
    reset: resetWithdrawTx,
  } = useWithdrawLoan();

  const {
    repayLoan,
    status: repayTxStatus,
    isLoading: isRepayTxLoading,
    activeLoanId: repayingLoanId,
    txHash: repayTxHash,
    errorMessage: repayTxError,
    technicalDetails: repayTxDetails,
    actionHint: repayTxActionHint,
    reset: resetRepayTx,
  } = useRepayLoan();

  const {
    fundLoan,
    status: fundTxStatus,
    isLoading: isFundTxLoading,
    activeLoanId: fundingLoanId,
    txHash: fundTxHash,
    errorMessage: fundTxError,
    technicalDetails: fundTxDetails,
    actionHint: fundTxActionHint,
    reset: resetFundTx,
  } = useFundLoan();

  const isAnyTxPending = isCreateTxLoading || isWithdrawTxLoading || isRepayTxLoading || isFundTxLoading;

  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [borrowerTab, setBorrowerTab] = useState<"create" | "my-loans">("create");
  const [lenderTab, setLenderTab] = useState<"marketplace" | "portfolio">("marketplace");
  const [showVerifier, setShowVerifier] = useState<boolean>(false);

  // Active Role based on ViewMode
  const activeRole: Role = viewMode === "lender" ? "lender" : "borrower";

  const handleRoleChange = (role: Role) => {
    if (role === "borrower") {
      setViewMode("borrow");
      setBorrowerTab("my-loans");
    } else {
      setViewMode("lender");
      setLenderTab("marketplace");
    }
  };

  const handleNavClick = (nav: "home" | "marketplace" | "borrow" | "lender" | "dashboard") => {
    if (nav === "home") {
      setViewMode("landing");
    } else if (nav === "marketplace") {
      setViewMode("lender");
      setLenderTab("marketplace");
    } else if (nav === "borrow") {
      setViewMode("borrow");
      setBorrowerTab("my-loans");
    } else if (nav === "lender") {
      setViewMode("lender");
      setLenderTab("marketplace");
    } else if (nav === "dashboard") {
      if (activeRole === "borrower") {
        setViewMode("borrow");
        setBorrowerTab("my-loans");
      } else {
        setViewMode("lender");
        setLenderTab("portfolio");
      }
    }
  };

  // Immediate loan refetch on account change
  useEffect(() => {
    if (account) {
      void refetchLoans();
    }
  }, [account, refetchLoans]);

  // Filter user-specific loans (case-insensitive)
  const borrowerLoans = useMemo(() => {
    if (!account) return [];
    const normalized = account.toLowerCase();
    return loans.filter((l) => l.borrower.toLowerCase() === normalized);
  }, [account, loans]);

  const lenderPortfolioLoans = useMemo(() => {
    if (!account) return [];
    const normalized = account.toLowerCase();
    return loans.filter(
      (l) => l.lender.toLowerCase() === normalized && l.status !== "Requested"
    );
  }, [account, loans]);

  // Handlers for smart contract operations
  const handleCreateSubmit = async (p: string, r: string, d: string): Promise<boolean> => {
    if (!isSepolia) {
      await switchToSepolia();
      return false;
    }
    const res = await createLoan(p, r, d);
    if (res.success) {
      await refetchLoans();
      setBorrowerTab("my-loans");
      return true;
    }
    return false;
  };

  const handleFund = async (loan: Loan) => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!isSepolia) {
      await switchToSepolia();
      return;
    }
    await fundLoan(loan, async () => {
      await refetchLoans();
    });
  };

  const handleWithdraw = async (loan: Loan) => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!isSepolia) {
      await switchToSepolia();
      return;
    }
    await withdrawLoan(loan, async () => {
      await refetchLoans();
    });
  };

  const handleRepay = async (loan: Loan) => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!isSepolia) {
      await switchToSepolia();
      return;
    }
    await repayLoan(loan, async () => {
      await refetchLoans();
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#333333] font-sans antialiased">
      {/* 1. Monochromatic Navbar */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        activeNav={viewMode === "landing" ? "home" : viewMode === "lender" ? "marketplace" : "borrow"}
        onNavClick={handleNavClick}
      />

      {/* Network Warning Banner if connected to non-Sepolia */}
      {account && !isSepolia && (
        <div className="bg-[#fefce8] border-b border-[#fef08a] px-4 py-2.5 text-xs text-[#a16207]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#a16207] animate-pulse shrink-0" />
              <span>
                <strong>Wrong Network:</strong> Connected to {networkName}. Please switch to Ethereum Sepolia.
              </span>
            </div>
            <button
              type="button"
              onClick={switchToSepolia}
              disabled={isSwitchingNetwork}
              className="px-2.5 py-1 bg-[#111111] hover:bg-[#2a2a2a] text-[#ffffff] rounded-[6px] font-medium cursor-pointer"
            >
              {isSwitchingNetwork ? "Switching..." : "Switch to Sepolia"}
            </button>
          </div>
        </div>
      )}

      {/* Global Transaction Status Feedback */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {createTxStatus !== "ready" && (
          <TransactionBanner
            operationName="Create Loan Request"
            status={createTxStatus}
            txHash={createTxHash}
            errorMessage={createTxError}
            technicalDetails={createTxDetails}
            actionHint={createTxActionHint}
            successTitle="Loan Request Registered!"
            successMessage="Your micro-loan request is now registered on Sepolia and listed in the marketplace."
            onDismiss={resetCreateTx}
          />
        )}

        {fundTxStatus !== "ready" && (
          <TransactionBanner
            operationName="Fund Loan"
            status={fundTxStatus}
            txHash={fundTxHash}
            errorMessage={fundTxError}
            technicalDetails={fundTxDetails}
            actionHint={fundTxActionHint}
            successTitle="Loan Successfully Funded!"
            successMessage="Your principal deposit is confirmed in contract escrow. The borrower can now withdraw."
            onDismiss={resetFundTx}
          />
        )}

        {withdrawTxStatus !== "ready" && (
          <TransactionBanner
            operationName="Withdraw Loan Capital"
            status={withdrawTxStatus}
            txHash={withdrawTxHash}
            errorMessage={withdrawTxError}
            technicalDetails={withdrawTxDetails}
            actionHint={withdrawTxActionHint}
            successTitle="Funds Withdrawn!"
            successMessage="Principal has been transferred to your wallet. Remember to repay before the due date."
            onDismiss={resetWithdrawTx}
          />
        )}

        {repayTxStatus !== "ready" && (
          <TransactionBanner
            operationName="Repay Loan"
            status={repayTxStatus}
            txHash={repayTxHash}
            errorMessage={repayTxError}
            technicalDetails={repayTxDetails}
            actionHint={repayTxActionHint}
            successTitle="Loan Repaid & Settled!"
            successMessage="Your full repayment was received by the smart contract and transferred to the lender."
            onDismiss={resetRepayTx}
          />
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* =========================================================================
            VIEW 1: LANDING FLOW (Visual sequence matching Lendasat composition)
            Navbar ↓ Hero ↓ Benefits ↓ How It Works ↓ Marketplace ↓ Stats ↓ FAQ ↓ CTA ↓ Footer
            ========================================================================= */}
        {viewMode === "landing" && (
          <div className="w-full view-transition">
            {/* Hero Section */}
            <HeroSection
              onBorrowClick={() => setViewMode("borrow")}
              onLendClick={() => {
                setViewMode("lender");
                setLenderTab("marketplace");
              }}
              totalLoansCount={loans.length}
              openLoansCount={loans.filter((l) => l.status === "Requested").length}
            />

            {/* Platform Benefits Section */}
            <BenefitsSection />

            {/* How Micro Lending Works */}
            <HowItWorksSection />

            {/* Loan Marketplace Preview */}
            <section className="w-full bg-[#ffffff] py-20 md:py-24">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-2">
                      Live Sepolia Liquidity
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
                      Available loan requests.
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <AutoRefreshIndicator
                      isRefreshing={isLoansRefreshing}
                      lastUpdated={loansLastUpdated}
                      warning={loansRefreshWarning}
                      nowMs={nowMs}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("lender");
                        setLenderTab("marketplace");
                      }}
                      className="text-xs font-semibold text-[#111111] hover:underline cursor-pointer"
                    >
                      View all loans →
                    </button>
                  </div>
                </div>

                <LoanMarketplace
                  loans={loans}
                  isLoading={isLoansLoading}
                  onFund={handleFund}
                  isFundingLoan={(id) => fundingLoanId === id && isFundTxLoading}
                  fundStatus={fundTxStatus}
                  onWithdraw={handleWithdraw}
                  isWithdrawingLoan={(id) => withdrawingLoanId === id && isWithdrawTxLoading}
                  withdrawStatus={withdrawTxStatus}
                  onRepay={handleRepay}
                  isRepayingLoan={(id) => repayingLoanId === id && isRepayTxLoading}
                  repayStatus={repayTxStatus}
                  connectedAccount={account}
                  isAnyTxPending={isAnyTxPending}
                  onRequestLoanClick={() => setViewMode("borrow")}
                />
              </div>
            </section>

            {/* Platform Statistics */}
            <PlatformStatsSection loans={loans} />

            {/* Frequently Asked Questions */}
            <FaqSection />

            {/* Start Borrowing / Start Lending CTA */}
            <CtaSection
              onBorrowClick={() => setViewMode("borrow")}
              onLendClick={() => {
                setViewMode("lender");
                setLenderTab("marketplace");
              }}
            />
          </div>
        )}

        {/* =========================================================================
            VIEW 2: BORROWER WORKSPACE (Create Request & My Loans Dashboard)
            ========================================================================= */}
        {viewMode === "borrow" && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 view-transition">
            {/* Borrower Subnav Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-1">
                  Borrower Console
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  {borrowerTab === "create" ? "Create Loan Request" : "My Active Loans"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <AutoRefreshIndicator
                  isRefreshing={isLoansRefreshing}
                  lastUpdated={loansLastUpdated}
                  warning={loansRefreshWarning}
                  nowMs={nowMs}
                />

                <div className="flex items-center bg-[#f5f5f5] p-1 rounded-[10px] border border-[#e5e5e5]">
                  <button
                    type="button"
                    onClick={() => setBorrowerTab("create")}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      borrowerTab === "create"
                        ? "bg-[#ffffff] text-[#111111] shadow-xs"
                        : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    Create Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowerTab("my-loans")}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      borrowerTab === "my-loans"
                        ? "bg-[#ffffff] text-[#111111] shadow-xs"
                        : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    My Loans {account ? `(${borrowerLoans.length})` : ""}
                  </button>
                </div>
              </div>
            </div>

            {/* Borrower Tab Content */}
            {borrowerTab === "create" ? (
              <CreateLoanRequest
                onSubmit={handleCreateSubmit}
                isLoading={isCreateTxLoading}
                onViewMyLoans={() => setBorrowerTab("my-loans")}
                connectedAccount={account}
                onConnectWallet={connectWallet}
              />
            ) : (
              <BorrowerDashboard
                loans={borrowerLoans}
                isLoading={isLoansLoading}
                onWithdraw={handleWithdraw}
                isWithdrawingLoan={(id) => withdrawingLoanId === id && isWithdrawTxLoading}
                withdrawStatus={withdrawTxStatus}
                onRepay={handleRepay}
                isRepayingLoan={(id) => repayingLoanId === id && isRepayTxLoading}
                repayStatus={repayTxStatus}
                onCreateNewClick={() => setBorrowerTab("create")}
                isAnyTxPending={isAnyTxPending}
                connectedAccount={account}
                onConnectWallet={connectWallet}
              />
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 3: LENDER WORKSPACE (Open Marketplace & Portfolio Dashboard)
            ========================================================================= */}
        {viewMode === "lender" && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 view-transition">
            {/* Lender Subnav Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#666666] block mb-1">
                  Lender Console
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  {lenderTab === "marketplace" ? "Loan Marketplace" : "My Funded Portfolio"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <AutoRefreshIndicator
                  isRefreshing={isLoansRefreshing}
                  lastUpdated={loansLastUpdated}
                  warning={loansRefreshWarning}
                  nowMs={nowMs}
                />

                <div className="flex items-center bg-[#f5f5f5] p-1 rounded-[10px] border border-[#e5e5e5]">
                  <button
                    type="button"
                    onClick={() => setLenderTab("marketplace")}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      lenderTab === "marketplace"
                        ? "bg-[#ffffff] text-[#111111] shadow-xs"
                        : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    Open Requests
                  </button>
                  <button
                    type="button"
                    onClick={() => setLenderTab("portfolio")}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                      lenderTab === "portfolio"
                        ? "bg-[#ffffff] text-[#111111] shadow-xs"
                        : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    Portfolio {account ? `(${lenderPortfolioLoans.length})` : ""}
                  </button>
                </div>
              </div>
            </div>

            {/* Lender Tab Content */}
            {lenderTab === "marketplace" ? (
              <LoanMarketplace
                loans={loans}
                initialFilter="requested"
                isLoading={isLoansLoading}
                onFund={handleFund}
                isFundingLoan={(id) => fundingLoanId === id && isFundTxLoading}
                fundStatus={fundTxStatus}
                onWithdraw={handleWithdraw}
                isWithdrawingLoan={(id) => withdrawingLoanId === id && isWithdrawTxLoading}
                withdrawStatus={withdrawTxStatus}
                onRepay={handleRepay}
                isRepayingLoan={(id) => repayingLoanId === id && isRepayTxLoading}
                repayStatus={repayTxStatus}
                connectedAccount={account}
                isAnyTxPending={isAnyTxPending}
                onRequestLoanClick={() => setViewMode("borrow")}
              />
            ) : (
              <LenderDashboard
                portfolioLoans={lenderPortfolioLoans}
                isLoading={isLoansLoading}
                onExploreMarketplaceClick={() => setLenderTab("marketplace")}
                connectedAccount={account}
                onConnectWallet={connectWallet}
              />
            )}
          </div>
        )}

        {/* Optional Collapsible On-Chain Single Loan Verifier */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="border-t border-[#e5e5e5] pt-6 flex items-center justify-between text-xs text-[#666666]">
            <span>Need to inspect a specific loan ID directly from bytecode?</span>
            <button
              type="button"
              onClick={() => setShowVerifier(!showVerifier)}
              className="text-[#111111] font-semibold hover:underline cursor-pointer"
            >
              {showVerifier ? "Hide On-Chain Verifier ▲" : "Inspect Raw Contract Tuple ▼"}
            </button>
          </div>

          {showVerifier && (
            <div className="mt-4 view-transition">
              <SingleLoanVerifier />
            </div>
          )}
        </div>
      </main>

      {/* 4. Monochromatic Footer */}
      <Footer />
    </div>
  );
}
