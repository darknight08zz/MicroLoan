"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  validateLoanRequestInputs,
  getLocalTodayDateString,
  addDaysToToday,
  parseDateInputPreview,
} from "@/utils";

export interface CreateLoanRequestProps {
  onSubmit: (principal: string, repayment: string, dueDate: string) => Promise<boolean>;
  isLoading: boolean;
  onViewMyLoans?: () => void;
  connectedAccount?: string | null;
  onConnectWallet?: () => void;
}

export function CreateLoanRequest({
  onSubmit,
  isLoading,
  onViewMyLoans,
  connectedAccount,
  onConnectWallet,
}: CreateLoanRequestProps) {
  const [principal, setPrincipal] = useState("");
  const [repayment, setRepayment] = useState("");
  const [dueDate, setDueDate] = useState("");

  const minDateStr = useMemo(() => getLocalTodayDateString(), []);
  const datePreview = useMemo(() => parseDateInputPreview(dueDate), [dueDate]);

  const [touched, setTouched] = useState<{
    principal?: boolean;
    repayment?: boolean;
    dueDate?: boolean;
  }>({});

  const validation = useMemo(
    () => validateLoanRequestInputs(principal, repayment, dueDate),
    [principal, repayment, dueDate]
  );

  // Auto-suggest 10% repayment when principal changes
  const handlePrincipalChange = (val: string) => {
    setPrincipal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && (!touched.repayment || !repayment)) {
      const calc = (num * 1.1).toFixed(4).replace(/\.?0+$/, "");
      setRepayment(calc);
    }
  };

  const handlePresetDays = (days: number) => {
    const nextDate = addDaysToToday(days);
    setDueDate(nextDate);
    setTouched((prev) => ({ ...prev, dueDate: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ principal: true, repayment: true, dueDate: true });

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
      setRepayment("");
      setDueDate("");
      setTouched({});
    }
  };

  // Calculate live return rate for preview
  const feeInfo = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(repayment);
    if (!isNaN(p) && !isNaN(r) && p > 0 && r >= p) {
      const diff = r - p;
      const pct = ((diff / p) * 100).toFixed(1);
      return { diff: diff.toFixed(4).replace(/\.?0+$/, ""), pct: `${pct}%` };
    }
    return null;
  }, [principal, repayment]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border border-[#e5e5e5] rounded-[16px] overflow-hidden">
        <CardHeader className="bg-[#ffffff] border-b border-[#e5e5e5] px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#666666] block mb-1">
                Borrower Workspace
              </span>
              <CardTitle className="text-xl sm:text-2xl font-bold text-[#111111]">
                Request Micro Loan
              </CardTitle>
            </div>
            {onViewMyLoans && (
              <button
                type="button"
                onClick={onViewMyLoans}
                className="text-xs font-semibold text-[#111111] hover:underline cursor-pointer"
              >
                View My Loans →
              </button>
            )}
          </div>
          <CardDescription className="text-xs text-[#666666] mt-1">
            Specify the required capital, agreed total repayment, and the due date for smart contract registration.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Principal Input */}
            <div>
              <Input
                label="Requested Principal"
                placeholder="e.g. 0.05"
                value={principal}
                onChange={(e) => handlePrincipalChange(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, principal: true }))}
                suffixElement={<span className="font-semibold text-xs text-[#111111]">ETH</span>}
                error={touched.principal ? validation.errors.principal : undefined}
                helperText="Amount of ETH you wish to borrow from a lender."
              />
            </div>

            {/* Repayment Input */}
            <div>
              <Input
                label="Total Repayment Amount"
                placeholder="e.g. 0.055"
                value={repayment}
                onChange={(e) => {
                  setRepayment(e.target.value);
                  setTouched((p) => ({ ...p, repayment: true }));
                }}
                onBlur={() => setTouched((p) => ({ ...p, repayment: true }))}
                suffixElement={<span className="font-semibold text-xs text-[#111111]">ETH</span>}
                error={touched.repayment ? validation.errors.repayment : undefined}
                helperText="Must be greater than or equal to principal. Suggests 10% lender return by default."
              />
            </div>

            {/* Due Date Input with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
                  Repayment Due Date
                </label>
                <div className="flex items-center gap-1.5">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handlePresetDays(days)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#e5e5e5] text-[#111111] transition-colors cursor-pointer"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="date"
                min={minDateStr}
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setTouched((p) => ({ ...p, dueDate: true }));
                }}
                onBlur={() => setTouched((p) => ({ ...p, dueDate: true }))}
                className={`w-full py-2.5 px-3.5 text-sm text-[#111111] bg-[#ffffff] border rounded-[10px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] ${
                  touched.dueDate && validation.errors.dueDate
                    ? "border-[#b42318]"
                    : "border-[#e5e5e5] hover:border-[#d4d4d4]"
                }`}
              />

              {touched.dueDate && validation.errors.dueDate ? (
                <p className="text-xs text-[#b42318] font-medium mt-1">
                  {validation.errors.dueDate}
                </p>
              ) : datePreview ? (
                <p className="text-xs text-[#666666] mt-1">
                  Expires {datePreview.formattedLong} ({datePreview.daysRemainingText})
                </p>
              ) : (
                <p className="text-xs text-[#666666] mt-1">
                  Select a future date when full repayment will be submitted.
                </p>
              )}
            </div>

            {/* Live Loan Terms Summary Card */}
            <div className="p-5 bg-[#fafafa] border border-[#e5e5e5] rounded-[12px] space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block mb-1">
                Live Terms Summary
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666]">Principal to Receive</span>
                <span className="font-semibold text-[#111111]">
                  {principal ? `${principal} ETH` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666]">Lender Return Fee</span>
                <span className="font-medium text-[#111111]">
                  {feeInfo ? `+${feeInfo.diff} ETH (${feeInfo.pct})` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e5e5e5]">
                <span className="font-semibold text-[#111111]">Total Repayment Due</span>
                <span className="font-bold text-sm text-[#111111]">
                  {repayment ? `${repayment} ETH` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#666666]">Due Date</span>
                <span className="font-medium text-[#111111]">
                  {datePreview ? datePreview.formattedLong : "Not set"}
                </span>
              </div>
            </div>

            {/* Submit Button */}
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
