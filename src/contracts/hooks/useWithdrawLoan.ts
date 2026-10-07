"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { getSignerMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";
import { Loan } from "@/types/loan";

import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { parseContractError, ActionHint } from "@/utils";

export type WithdrawTransactionStatus = TxLifecycleStatus;

export interface WithdrawLoanResult {
  withdrawLoan: (
    loan: Loan,
    onSuccess?: () => Promise<void> | void
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  status: TxLifecycleStatus;
  isLoading: boolean;
  activeLoanId: number | null;
  txHash: string | null;
  withdrawnLoanId: number | null;
  errorMessage: string | null;
  technicalDetails: string | null;
  actionHint?: ActionHint;
  reset: () => void;
}

/**
 * Reusable hook to execute borrower withdrawal of funded loans on Sepolia.
 * Calls contract.withdrawToBorrower(loanId) with full MetaMask lifecycle handling.
 */
export function useWithdrawLoan(): WithdrawLoanResult {
  const { account, isSepolia, signer } = useWallet();

  const [status, setStatus] = useState<TxLifecycleStatus>("ready");
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [withdrawnLoanId, setWithdrawnLoanId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<ActionHint | undefined>(undefined);

  const reset = useCallback(() => {
    setStatus("ready");
    setActiveLoanId(null);
    setTxHash(null);
    setWithdrawnLoanId(null);
    setErrorMessage(null);
    setTechnicalDetails(null);
    setActionHint(undefined);
  }, []);

  const withdrawLoan = useCallback(
    async (
      loan: Loan,
      onSuccess?: () => Promise<void> | void
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // 0. Guard against duplicate clicks while a transaction is in flight
      if (activeLoanId !== null || status === "waiting_metamask" || status === "submitted" || status === "pending") {
        console.warn("[useWithdrawLoan] Withdrawal transaction already in progress. Ignoring duplicate click.");
        return { success: false, error: "Withdrawal already in progress." };
      }

      // 1. Contract configuration check
      if (!isContractConfigured()) {
        const msg = "MicroLoan smart contract address is not configured.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 2. Wallet connection check
      if (!account || !signer) {
        const msg = "Please connect your wallet to withdraw funds.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 3. Network check (Must be Sepolia)
      if (!isSepolia) {
        const msg = "Please switch your wallet network to Ethereum Sepolia Testnet.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 4. Edge Case: "wrong user" validation
      // Only the registered borrower of the loan is authorized to withdraw funds
      if (loan.borrower.toLowerCase() !== account.toLowerCase()) {
        const msg = `Unauthorized: Connected wallet (${account.substring(0, 6)}...${account.substring(account.length - 4)}) is not the borrower of Loan #${loan.id}.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 5. Edge Case: "wrong status" validation
      // Withdrawal is ONLY permitted when loan status is exactly "Funded"
      if (loan.status !== "Funded") {
        const msg = `Cannot withdraw: Loan #${loan.id} has status "${loan.status}". Only funded loans can be withdrawn.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 6. Valid Loan ID check (support 0-indexed loans)
      if (loan.id === undefined || loan.id === null || loan.id < 0) {
        const msg = "Invalid loan ID.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 7. On-Chain Live Pre-Check: Verify current status directly on Sepolia
      try {
        const contract = getSignerMicroLoanContract(signer);
        if (typeof contract.loans === "function") {
          const liveLoan = await contract.loans(loan.id);
          const liveStatusCode = Number(liveLoan.status);
          if (liveStatusCode !== 1) { // 1 = Funded
            const statusNames = ["Requested", "Funded", "Withdrawn", "Repaid", "Defaulted"];
            const currentStatusName = statusNames[liveStatusCode] || `Status #${liveStatusCode}`;
            const msg = `Cannot withdraw Loan #${loan.id}: This loan is currently in "${currentStatusName}" state on-chain. Only funded loans can be withdrawn.`;
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }

          if (liveLoan.borrower && liveLoan.borrower.toLowerCase() !== account.toLowerCase()) {
            const msg = "Only the registered borrower of this loan is authorized to withdraw funds.";
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }
        }
      } catch (preCheckErr) {
        console.warn("[useWithdrawLoan] Note: Live on-chain pre-check could not be completed, proceeding to transaction:", preCheckErr);
      }

      // 8. Execution Lifecycle: Waiting for MetaMask
      setActiveLoanId(loan.id);
      setStatus("waiting_metamask");
      setErrorMessage(null);
      setTxHash(null);
      setWithdrawnLoanId(null);

      try {
        const contract = getSignerMicroLoanContract(signer);

        // Call withdraw(loanId) directly
        const tx = typeof contract.withdraw === "function"
          ? await contract.withdraw(loan.id)
          : await (contract as unknown as { withdrawToBorrower: (id: number) => Promise<{ hash: string; wait: (n: number) => Promise<{ status: number }> }> }).withdrawToBorrower(loan.id);

        const hash = tx.hash as string;
        setTxHash(hash);
        setStatus("pending");

        // Wait for 1 block confirmation on Sepolia
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction was mined but reverted on Sepolia.");
        }

        setWithdrawnLoanId(loan.id);
        setStatus("confirmed");

        // Execute post-confirmation refresh callback
        if (onSuccess) {
          try {
            await onSuccess();
          } catch (refreshErr) {
            console.warn("[useWithdrawLoan] Post-withdrawal refresh failed:", refreshErr);
          }
        }

        return {
          success: true,
          txHash: hash,
        };
      } catch (err: unknown) {
        console.error(`[useWithdrawLoan] Failed to withdraw Loan #${loan.id}:`, err);

        const parsed = parseContractError(err, {
          operation: `withdrawToBorrower(Loan #${loan.id})`,
          loanId: loan.id,
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
    withdrawLoan,
    status,
    isLoading: status === "waiting_metamask" || status === "submitted" || status === "pending",
    activeLoanId,
    txHash,
    withdrawnLoanId,
    errorMessage,
    technicalDetails,
    actionHint,
    reset,
  };
}
