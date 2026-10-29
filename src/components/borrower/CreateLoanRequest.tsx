"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  validateLoanRequestInputs,
  getLocalNowDateTimeString,
  addTimeToNow,
  parseDateInputPreview,
  calculateRepayment,
  calculateInterestRate,
  calculateApr,
  calculateInterestAmount,
} from "@/utils";

export interface CreateLoanRequestProps {
  onSubmit: (principal: string, repayment: string, dueDate: string) => Promise<boolean>;
  isLoading: boolean;
  onViewMyLoans?: () => void;
  connectedAccount?: string | null;
  onConnectWallet?: () => void;
}

const RATE_PRESETS = [
  { rate: 5, label: "5% Low", description: "Low cost" },
  { rate: 10, label: "10% Standard", description: "Recommended" },
  { rate: 15, label: "15% Fast", description: "Faster funding" },
  { rate: 20, label: "20% Urgent", description: "High priority" },
];

export function CreateLoanRequest({
  onSubmit,
  isLoading,
  onViewMyLoans,
  connectedAccount,
  onConnectWallet,
}: CreateLoanRequestProps) {
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState<string>("10");
  const [repayment, setRepayment] = useState("");
  const [dueDate, setDueDate] = useState("");

  const minDateTimeStr = useMemo(() => getLocalNowDateTimeString(), []);
  const datePreview = useMemo(() => parseDateInputPreview(dueDate), [dueDate]);

  const [touched, setTouched] = useState<{
    principal?: boolean;
    interestRate?: boolean;
    repayment?: boolean;
    dueDate?: boolean;
  }>({});

  const validation = useMemo(
    () => validateLoanRequestInputs(principal, repayment, dueDate),
    [principal, repayment, dueDate]
  );

  // When principal changes, recalculate repayment based on active interest rate
  const handlePrincipalChange = (val: string) => {
    setPrincipal(val);
    const p = parseFloat(val);
    const r = parseFloat(interestRate);
    if (!isNaN(p) && p > 0 && !isNaN(r) && r >= 0) {
      setRepayment(calculateRepayment(p, r));
    } else if (!val) {
      setRepayment("");
    }
  };

  // When interest rate changes (slider or presets or input), update repayment
  const handleRateChange = (newRate: string) => {
    setInterestRate(newRate);
    const r = parseFloat(newRate);
    const p = parseFloat(principal);
    if (!isNaN(p) && p > 0 && !isNaN(r) && r >= 0) {
      setRepayment(calculateRepayment(p, r));
    }
  };

  // When user directly changes total repayment, update interest rate back
  const handleRepaymentChange = (val: string) => {
    setRepayment(val);
    const r = parseFloat(val);
    const p = parseFloat(principal);
    if (!isNaN(p) && !isNaN(r) && p > 0 && r >= p) {
      const derivedRate = calculateInterestRate(p, r);
      setInterestRate(String(derivedRate));
    }
  };

  const handlePresetTime = (opts: { days?: number; hours?: number; minutes?: number; seconds?: number }) => {
    const nextDate = addTimeToNow(opts);
    setDueDate(nextDate);
    setTouched((prev) => ({ ...prev, dueDate: true }));
  };


  // Calculate APR based on selected rate & duration
  const aprValue = useMemo(() => {
    if (!datePreview?.daysRemaining || datePreview.daysRemaining <= 0) return null;
    const r = parseFloat(interestRate);
    if (isNaN(r) || r <= 0) return null;
    return calculateApr(r, datePreview.daysRemaining);
  }, [interestRate, datePreview]);

  // Fee in ETH
  const feeEthAmount = useMemo(() => {
    return calculateInterestAmount(principal, interestRate);
  }, [principal, interestRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ principal: true, interestRate: true, repayment: true, dueDate: true });

    if (!connectedAccount && onConnectWallet) {
      onConnectWallet();
      return;
    }

    if (!validation.isValid) {
      return;
    }

    const success = await onSubmit(principal, repayment, dueDate);
    if (success) {
      setPrincipal("");
      setInterestRate("10");
      setRepayment("");
      setDueDate("");
      setTouched({});
    }
  };

  const numericRate = parseFloat(interestRate) || 0;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white dark:bg-[#18191E] border border-[#e5e5e5] dark:border-white/[0.1] rounded-[16px] overflow-hidden">
        <CardHeader className="bg-white dark:bg-[#18191E] border-b border-[#e5e5e5] dark:border-white/[0.1] px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#666666] dark:text-[#A1A1AA] block mb-1">
                Borrower Workspace
              </span>
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F4F5]">
                Request Micro Loan
              </CardTitle>
            </div>
            {onViewMyLoans && (
              <button
                type="button"
                onClick={onViewMyLoans}
                className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F5] hover:underline cursor-pointer"
              >
                View My Loans →
              </button>
            )}
          </div>
          <CardDescription className="text-xs text-[#666666] dark:text-[#A1A1AA] mt-1">
            Specify your requested capital, customize your flexible repayment interest rate, and set your due date.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* 1. Requested Principal Input */}
            <div>
              <Input
                label="Requested Principal"
                placeholder="e.g. 0.50"
                value={principal}
                onChange={(e) => handlePrincipalChange(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, principal: true }))}
                suffixElement={<span className="font-semibold text-xs text-[#111111] dark:text-[#F4F4F5]">ETH</span>}
                error={touched.principal ? validation.errors.principal : undefined}
                helperText="Amount of ETH you wish to borrow from a lender on Sepolia."
              />
            </div>

            {/* 2. Flexible Interest Rate Selector */}
            <div className="space-y-3 p-4 bg-[#fafafa] dark:bg-[#1E2026] border border-[#e5e5e5] dark:border-white/[0.08] rounded-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wider block">
                    Flexible Interest Rate (Offered to Lender)
                  </label>
                  <span className="text-[11px] text-[#666666] dark:text-[#A1A1AA]">
                    Set the return percentage you are willing to pay for this loan.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#18191E] border border-[#e5e5e5] dark:border-white/[0.12] rounded-[8px] px-2.5 py-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={interestRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-14 text-sm font-bold text-[#111111] dark:text-[#F4F4F5] bg-transparent text-right focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[#666666] dark:text-[#A1A1AA]">%</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {RATE_PRESETS.map((preset) => (
                  <button
                    key={preset.rate}
                    type="button"
                    onClick={() => handleRateChange(String(preset.rate))}
                    className={`py-1.5 px-2 rounded-[8px] border text-left transition-all cursor-pointer ${
                      Math.abs(numericRate - preset.rate) < 0.1
                        ? "bg-[#ffffff] dark:bg-[#F4F4F5] border-2 border-[#111111] dark:border-[#F4F4F5] text-[#111111] dark:text-[#121316] shadow-sm ring-1 ring-[#111111]/10"
                        : "bg-[#ffffff] dark:bg-[#262932] border-[#e5e5e5] dark:border-white/[0.08] text-[#555555] dark:text-[#E4E4E7] hover:border-[#999999] dark:hover:border-white/30"
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">
                      {preset.label}
                    </span>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        Math.abs(numericRate - preset.rate) < 0.1
                          ? "text-[#444444] dark:text-[#52525B] font-medium"
                          : "text-[#777777] dark:text-[#A1A1AA]"
                      }`}
                    >
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>

              {/* Slider for smooth visual control */}
              <div className="pt-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={numericRate > 30 ? 30 : numericRate < 1 ? 1 : numericRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                  className="w-full h-1.5 bg-[#e5e5e5] dark:bg-[#262932] rounded-lg appearance-none cursor-pointer accent-[#111111] dark:accent-[#F4F4F5]"
                />
                <div className="flex justify-between text-[10px] text-[#888888] dark:text-[#71717A] font-medium mt-1">
                  <span>1% (Low)</span>
                  <span>10% (Market standard)</span>
                  <span>20% (High priority)</span>
                  <span>30%</span>
                </div>
              </div>
            </div>

            {/* 3. Total Repayment Input (Auto-calculated, also editable) */}
            <div>
              <Input
                label="Total Repayment Amount"
                placeholder="e.g. 0.55"
                value={repayment}
                onChange={(e) => {
                  handleRepaymentChange(e.target.value);
                  setTouched((p) => ({ ...p, repayment: true }));
                }}
                onBlur={() => setTouched((p) => ({ ...p, repayment: true }))}
                suffixElement={<span className="font-semibold text-xs text-[#111111]">ETH</span>}
                error={touched.repayment ? validation.errors.repayment : undefined}
                helperText="Auto-computed based on your chosen interest rate. You can also adjust this directly."
              />
            </div>

            {/* 4. Due Date & Time Input with Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] uppercase tracking-wider">
                  Repayment Due Date & Time
                </label>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {[
                    { label: "+2m", opts: { minutes: 2 }, title: "2 minutes (quick test)" },
                    { label: "+5m", opts: { minutes: 5 }, title: "5 minutes" },
                    { label: "+1h", opts: { hours: 1 }, title: "1 hour" },
                    { label: "+1d", opts: { days: 1 }, title: "1 day" },
                    { label: "+7d", opts: { days: 7 }, title: "7 days" },
                    { label: "+30d", opts: { days: 30 }, title: "30 days" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      title={preset.title}
                      onClick={() => handlePresetTime(preset.opts)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[#ffffff] hover:bg-[#f5f5f5] dark:bg-[#282c37] dark:hover:bg-[#343a46] border border-[#e5e5e5] dark:border-white/[0.12] text-[#111111] dark:text-[#f4f4f5] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                id="repayment-due-date-input"
                type="datetime-local"
                step="1"
                min={minDateTimeStr}
                value={dueDate}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setTouched((p) => ({ ...p, dueDate: true }));
                }}
                onBlur={() => setTouched((p) => ({ ...p, dueDate: true }))}
                className={`w-full py-2.5 px-3.5 text-sm text-[#111111] dark:text-[#f4f4f5] bg-[#ffffff] dark:bg-[#18191E] border rounded-[10px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-white focus:border-[#111111] dark:focus:border-white cursor-pointer ${
                  touched.dueDate && validation.errors.dueDate
                    ? "border-[#b42318] dark:border-[#EA8A8A]"
                    : "border-[#e5e5e5] dark:border-white/[0.12] hover:border-[#d4d4d4]"
                }`}
              />

              {touched.dueDate && validation.errors.dueDate ? (
                <p className="text-xs text-[#b42318] dark:text-[#EA8A8A] font-medium mt-1">
                  {validation.errors.dueDate}
                </p>
              ) : datePreview ? (
                <p className="text-xs text-[#666666] dark:text-[#a1a1aa] mt-1">
                  Expires {datePreview.formattedLong} ({datePreview.daysRemainingText})
                </p>
              ) : (
                <p className="text-xs text-[#666666] dark:text-[#a1a1aa] mt-1">
                  Select exact date and time (hours, minutes, seconds) for repayment deadline, or click quick presets.
                </p>
              )}
            </div>

            {/* 5. Live Loan Terms Summary Card with Transparent Math */}
            <div className="p-5 bg-[#fafafa] dark:bg-[#1E2026] border border-[#e5e5e5] dark:border-white/[0.08] rounded-[12px] space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A1A1AA]">
                  Live Terms Breakdown
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] dark:bg-[#163828] text-[#16803c] dark:text-[#86efac] border border-[#bbf7d0] dark:border-[#166534]">
                  {numericRate >= 15 ? "High Appeal to Lenders" : numericRate >= 8 ? "Competitive Yield" : "Standard Rate"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666] dark:text-[#A1A1AA]">Principal to Receive</span>
                <span className="font-semibold text-[#111111] dark:text-[#F4F4F5]">
                  {principal ? `${principal} ETH` : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666] dark:text-[#A1A1AA]">Offered Interest Rate</span>
                <span className="font-semibold text-[#16803c] dark:text-[#86efac]">
                  +{numericRate.toFixed(1)}% ({feeEthAmount ? `${feeEthAmount} ETH` : "0 ETH"})
                </span>
              </div>

              {aprValue !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666666] dark:text-[#A1A1AA]">Annualized Rate (APR)</span>
                  <span className="font-medium text-[#111111] dark:text-[#F4F4F5]">
                    {aprValue}% APR ({datePreview?.daysRemaining} days term)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e5e5e5] dark:border-white/[0.08]">
                <span className="font-semibold text-[#111111] dark:text-[#F4F4F5]">Total Repayment Due</span>
                <span className="font-bold text-sm text-[#111111] dark:text-[#F4F4F5]">
                  {repayment ? `${repayment} ETH` : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666] dark:text-[#A1A1AA]">Due Date</span>
                <span className="font-medium text-[#111111] dark:text-[#F4F4F5]">
                  {datePreview ? datePreview.formattedLong : "Not set"}
                </span>
              </div>
            </div>

            {/* 6. Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || (!connectedAccount ? false : !validation.isValid)}
            >
              {!connectedAccount
                ? "Connect Wallet to Submit"
                : isLoading
                ? "Submitting to Sepolia..."
                : "Submit Loan Request"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
