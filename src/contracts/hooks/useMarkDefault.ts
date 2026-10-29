"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { getSignerMicroLoanContract } from "../microloan";
import { isContractConfigured } from "../config";
import { Loan } from "@/types/loan";
import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { parseContractError, ActionHint } from "@/utils";

export type MarkDefaultTransactionStatus = TxLifecycleStatus;

export interface MarkDefaultLoanResult {
  markDefault: (
    loan: Loan,
    onSuccess?: () => Promise<void> | void
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  status: TxLifecycleStatus;
  isLoading: boolean;
  activeLoanId: number | null;
  txHash: string | null;
  defaultedLoanId: number | null;
  errorMessage: string | null;
  technicalDetails: string | null;
  actionHint?: ActionHint;
  reset: () => void;
}


export function useMarkDefault(): MarkDefaultLoanResult {
  const { account, isSepolia, signer } = useWallet();

  const [status, setStatus] = useState<TxLifecycleStatus>("ready");
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [defaultedLoanId, setDefaultedLoanId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<ActionHint | undefined>(undefined);

  const reset = useCallback(() => {
    setStatus("ready");
    setActiveLoanId(null);
    setTxHash(null);
    setDefaultedLoanId(null);
    setErrorMessage(null);
    setTechnicalDetails(null);
    setActionHint(undefined);
  }, []);

  const markDefault = useCallback(
    async (
      loan: Loan,
      onSuccess?: () => Promise<void> | void
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // 1. Guard against duplicate clicks
      if (
        activeLoanId !== null ||
        status === "waiting_metamask" ||
        status === "submitted" ||
        status === "pending"
      ) {
        return { success: false, error: "Default processing already in progress." };
      }

      // 2. Contract configuration check
      if (!isContractConfigured()) {
        const msg = "MicroLoan smart contract address is not configured.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 3. Wallet check
      if (!account || !signer) {
        const msg = "Please connect your wallet to trigger default recovery.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 4. Network check
      if (!isSepolia) {
        const msg = "Please switch your wallet network to Ethereum Sepolia Testnet.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 5. Status check
      if (loan.statusCode === 5 || loan.statusCode === 4 || loan.statusCode === 3) {
        const msg = `Cannot trigger action: Loan #${loan.id} is already ${
          loan.statusCode === 3 ? "repaid" : loan.statusCode === 5 ? "expired / cancelled on-chain" : "defaulted on-chain"
        }.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 6. Deadline check
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec <= loan.dueDateTimestamp) {
        const msg = `Cannot trigger action: Due date has not passed yet for Loan #${loan.id}.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 7. Execution lifecycle
      setActiveLoanId(loan.id);
      setStatus("waiting_metamask");
      setErrorMessage(null);
      setTxHash(null);
      setDefaultedLoanId(null);

      try {
        const contract = getSignerMicroLoanContract(signer);
        // If loan was never withdrawn (status 0 Requested or status 1 Funded), call markExpired to cancel / refund lender.
        // If loan was withdrawn (status 2 Withdrawn), call markDefault.
        const tx =
          loan.statusCode === 0 || loan.statusCode === 1
            ? await contract.markExpired(loan.id)
            : await contract.markDefault(loan.id);

        const hash = tx.hash as string;
        setTxHash(hash);
        setStatus("pending");

        const receipt = await tx.wait(1);
        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction was mined but reverted on Sepolia.");
        }

        setDefaultedLoanId(loan.id);
        setStatus("confirmed");

        if (onSuccess) {
          try {
            await onSuccess();
          } catch (refreshErr) {
            console.warn("[useMarkDefault] Post-default callback warning:", refreshErr);
          }
        }

        return { success: true, txHash: hash };
      } catch (err: unknown) {
        console.error("[useMarkDefault] Execution failed:", err);
        const parsed = parseContractError(err);
        setStatus("failed");
        setErrorMessage(parsed.userMessage);
        setTechnicalDetails(parsed.technicalDetails || null);
        setActionHint(parsed.actionHint);
        return { success: false, error: parsed.userMessage };
      } finally {
        setActiveLoanId(null);
      }
    },
    [account, isSepolia, signer, activeLoanId, status]
  );

  return {
    markDefault,
    status,
    isLoading:
      status === "waiting_metamask" ||
      status === "submitted" ||
      status === "pending",
    activeLoanId,
    txHash,
    defaultedLoanId,
    errorMessage,
    technicalDetails,
    actionHint,
    reset,
  };
}
