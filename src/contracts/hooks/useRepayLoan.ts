"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { getSignerMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";
import { Loan } from "@/types/loan";

import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { parseContractError, ActionHint } from "@/utils";

export type RepayTransactionStatus = TxLifecycleStatus;

export interface RepayLoanResult {
  repayLoan: (
    loan: Loan,
    onSuccess?: () => Promise<void> | void
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  status: TxLifecycleStatus;
  isLoading: boolean;
  activeLoanId: number | null;
  txHash: string | null;
  repaidLoanId: number | null;
  repaymentAmountFormatted: string | null;
  errorMessage: string | null;
  technicalDetails: string | null;
  actionHint?: ActionHint;
  reset: () => void;
}

/**
 * Reusable hook to execute borrower loan repayment on Sepolia.
 * Calls contract.repay(loanId, { value: loan.repaymentRaw }) with exact ETH repayment amount.
 * Handles duplicate clicks, MetaMask rejection, pending confirmation, and contract reverts.
 */
export function useRepayLoan(): RepayLoanResult {
  const { account, isSepolia, signer } = useWallet();

  const [status, setStatus] = useState<TxLifecycleStatus>("ready");
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [repaidLoanId, setRepaidLoanId] = useState<number | null>(null);
  const [repaymentAmountFormatted, setRepaymentAmountFormatted] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<ActionHint | undefined>(undefined);

  const reset = useCallback(() => {
    setStatus("ready");
    setActiveLoanId(null);
    setTxHash(null);
    setRepaidLoanId(null);
    setRepaymentAmountFormatted(null);
    setErrorMessage(null);
    setTechnicalDetails(null);
    setActionHint(undefined);
  }, []);

  const repayLoan = useCallback(
    async (
      loan: Loan,
      onSuccess?: () => Promise<void> | void
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // 1. Guard against duplicate clicks while a repayment is in flight
      if (activeLoanId !== null || status === "waiting_metamask" || status === "submitted" || status === "pending") {
        console.warn("[useRepayLoan] Repayment transaction already in progress. Ignoring duplicate click.");
        return { success: false, error: "Repayment already in progress." };
      }

      // 2. Contract configuration check
      if (!isContractConfigured()) {
        const msg = "MicroLoan smart contract address is not configured.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 3. Wallet connection check
      if (!account || !signer) {
        const msg = "Please connect your wallet to repay this loan.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 4. Network check (Must be Sepolia)
      if (!isSepolia) {
        const msg = "Please switch your wallet network to Ethereum Sepolia Testnet.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 5. Wrong user check: Only the borrower can repay
      if (loan.borrower.toLowerCase() !== account.toLowerCase()) {
        const msg = `Unauthorized: Connected wallet (${account.substring(0, 6)}...${account.substring(account.length - 4)}) is not the borrower of Loan #${loan.id}.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 6. Wrong status check: Only "Withdrawn" loans can be repaid
      if (loan.status !== "Withdrawn") {
        const msg = `Cannot repay: Loan #${loan.id} has status "${loan.status}". Only withdrawn loans can be repaid.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 7. Repayment amount validation: Must send exact repayment amount
      if (!loan.repaymentRaw || loan.repaymentRaw <= BigInt(0)) {
        const msg = `Invalid repayment amount (${loan.repayment}) for Loan #${loan.id}.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 8. On-Chain Live Pre-Check: Verify current status directly on Sepolia
      try {
        const contract = getSignerMicroLoanContract(signer);
        if (typeof contract.loans === "function") {
          const liveLoan = await contract.loans(loan.id);
          const liveStatusCode = Number(liveLoan.status);
          if (liveStatusCode !== 2) { // 2 = Withdrawn
            const statusNames = ["Requested", "Funded", "Withdrawn", "Repaid", "Defaulted"];
            const currentStatusName = statusNames[liveStatusCode] || `Status #${liveStatusCode}`;
            const msg = `Cannot repay Loan #${loan.id}: This loan is currently in "${currentStatusName}" state on-chain. Only withdrawn loans can be repaid.`;
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }

          if (liveLoan.borrower && liveLoan.borrower.toLowerCase() !== account.toLowerCase()) {
            const msg = "Only the registered borrower of this loan is authorized to repay.";
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }
        }
      } catch (preCheckErr) {
        console.warn("[useRepayLoan] Note: Live on-chain pre-check could not be completed, proceeding to transaction:", preCheckErr);
      }

      // 9. Execution Lifecycle: Waiting for MetaMask
      setActiveLoanId(loan.id);
      setStatus("waiting_metamask");
      setErrorMessage(null);
      setTxHash(null);
      setRepaidLoanId(null);
      setRepaymentAmountFormatted(loan.repayment);

      try {
        const contract = getSignerMicroLoanContract(signer);

        // Call repay(loanId) sending exactly loan.repaymentRaw as msg.value
        const tx = typeof contract.repay === "function"
          ? await contract.repay(loan.id, { value: loan.repaymentRaw })
          : await (contract as unknown as { repayLoan: (id: number, opts: { value: bigint }) => Promise<{ hash: string; wait: (n: number) => Promise<{ status: number }> }> }).repayLoan(loan.id, { value: loan.repaymentRaw });

        const hash = tx.hash as string;
        setTxHash(hash);
        setStatus("pending");

        // Wait for 1 block confirmation on Sepolia
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status === 0) {
          throw new Error("Repayment transaction was mined but reverted on Sepolia.");
        }

        setRepaidLoanId(loan.id);
        setStatus("confirmed");

        // Execute post-confirmation refresh callback
        if (onSuccess) {
          try {
            await onSuccess();
          } catch (refreshErr) {
            console.warn("[useRepayLoan] Post-repayment refresh failed:", refreshErr);
          }
        }

        return {
          success: true,
          txHash: hash,
        };
      } catch (err: unknown) {
        console.error(`[useRepayLoan] Failed to repay Loan #${loan.id}:`, err);

        const parsed = parseContractError(err, {
          operation: `repay(Loan #${loan.id})`,
          loanId: loan.id,
          amount: loan.repayment,
          contractAddress: getMicroLoanContractAddress(),
        });

        setStatus(parsed.isUserRejection ? "rejected" : "failed");
        setErrorMessage(parsed.userMessage);
        setTechnicalDetails(parsed.technicalDetails ?? null);
        setActionHint(parsed.actionHint);

        return { success: false, error: parsed.userMessage };
      } finally {
        setActiveLoanId(null);
      }
    },
    [account, isSepolia, signer, activeLoanId, status]
  );

  return {
    repayLoan,
    status,
    isLoading: status === "waiting_metamask" || status === "submitted" || status === "pending",
    activeLoanId,
    txHash,
    repaidLoanId,
    repaymentAmountFormatted,
    errorMessage,
    technicalDetails,
    actionHint,
    reset,
  };
}
