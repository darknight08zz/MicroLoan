"use client";

import { useState, useCallback } from "react";
import { parseEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { getSignerMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";

import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { parseContractError, validateLoanRequestInputs, ActionHint } from "@/utils";

export type TransactionStatus = TxLifecycleStatus;

export interface CreateLoanResult {
  createLoan: (
    principalEth: string,
    repaymentEth: string,
    dueDateStr: string
  ) => Promise<{ success: boolean; txHash?: string; loanId?: number; error?: string }>;
  status: TxLifecycleStatus;
  isLoading: boolean;
  txHash: string | null;
  newLoanId: number | null;
  errorMessage: string | null;
  technicalDetails: string | null;
  actionHint?: ActionHint;
  reset: () => void;
}

export function useCreateLoan(): CreateLoanResult {
  const { account, isSepolia, signer } = useWallet();

  const [status, setStatus] = useState<TxLifecycleStatus>("ready");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [newLoanId, setNewLoanId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<ActionHint | undefined>(undefined);

  const reset = useCallback(() => {
    setStatus("ready");
    setTxHash(null);
    setNewLoanId(null);
    setErrorMessage(null);
    setTechnicalDetails(null);
    setActionHint(undefined);
  }, []);

  const createLoan = useCallback(
    async (
      principalEth: string,
      repaymentEth: string,
      dueDateStr: string
    ): Promise<{ success: boolean; txHash?: string; loanId?: number; error?: string }> => {
      // 0. Guard against duplicate clicks while a transaction is in progress
      if (status === "waiting_metamask" || status === "submitted" || status === "pending") {
        console.warn("[useCreateLoan] Transaction already in progress. Ignoring duplicate click.");
        return { success: false, error: "Transaction already in progress." };
      }

      // 1. Contract configuration check
      if (!isContractConfigured()) {
        const msg = "MicroLoan smart contract address is not configured.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 2. Wallet & Network validation
      if (!account || !signer) {
        const msg = "Please connect your wallet to create a loan request.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      if (!isSepolia) {
        const msg = "Please switch your wallet network to Ethereum Sepolia Testnet.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 3. Form input validations using centralized error parser
      const validation = validateLoanRequestInputs(principalEth, repaymentEth, dueDateStr);
      if (!validation.isValid) {
        const firstError =
          validation.errors.principal ||
          validation.errors.repayment ||
          validation.errors.dueDate ||
          "Please verify your loan request details.";
        setStatus("failed");
        setErrorMessage(firstError);
        setTechnicalDetails(
          `Form Validation Errors:\n${JSON.stringify(validation.errors, null, 2)}`
        );
        return { success: false, error: firstError };
      }

      let principalWei: bigint;
      let repaymentWei: bigint;
      try {
        principalWei = parseEther(principalEth.trim());
        repaymentWei = parseEther(repaymentEth.trim());
      } catch (parseErr) {
        const msg = "Invalid ETH amount format. Please check the principal and repayment values.";
        setStatus("failed");
        setErrorMessage(msg);
        setTechnicalDetails(String(parseErr));
        return { success: false, error: msg };
      }

      const parts = dueDateStr.split("-").map(Number);
      const [y, m, d] = parts;
      const dueDateObj = new Date(y, m - 1, d, 23, 59, 59, 999);
      const targetTimestamp = Math.floor(dueDateObj.getTime() / 1000);
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const durationSeconds = BigInt(Math.max(1, targetTimestamp - nowTimestamp));

      // 4. Execution Lifecycle: Waiting for MetaMask
      setStatus("waiting_metamask");
      setErrorMessage(null);
      setTechnicalDetails(null);
      setActionHint(undefined);
      setTxHash(null);
      setNewLoanId(null);

      try {
        const contract = getSignerMicroLoanContract(signer);

        // Call requestLoan(amount, repayment, duration)
        const tx = await contract.requestLoan(
          principalWei,
          repaymentWei,
          durationSeconds
        );

        const hash = tx.hash as string;
        setTxHash(hash);
        setStatus("pending");

        // Wait for 1 block confirmation
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status === 0) {
          throw new Error("Transaction was mined but reverted on Sepolia.");
        }

        // Parse LoanRequested event from receipt logs
        let parsedId: number | null = null;
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed && parsed.name === "LoanRequested") {
                parsedId = Number(parsed.args.loanId);
                break;
              }
            } catch {
              // Ignore non-contract log events
            }
          }
        }

        // If event couldn't be parsed directly, query nextLoanId() or loanCount()
        if (parsedId === null) {
          try {
            if (typeof contract.nextLoanId === "function") {
              const count = await contract.nextLoanId();
              parsedId = Number(count) > 0 ? Number(count) - 1 : 0;
            } else if (typeof contract.loanCount === "function") {
              const count = await contract.loanCount();
              parsedId = Number(count);
            }
          } catch {
            // Non-critical fallback
          }
        }

        setNewLoanId(parsedId);
        setStatus("confirmed");

        return {
          success: true,
          txHash: hash,
          loanId: parsedId ?? undefined,
        };
      } catch (err: unknown) {
        console.error("[useCreateLoan] Failed to request loan on Sepolia:", err);

        const parsed = parseContractError(err, {
          operation: "requestLoan",
          amount: `${principalEth} ETH (repayment: ${repaymentEth} ETH)`,
          contractAddress: getMicroLoanContractAddress(),
        });

        setStatus(parsed.isUserRejection ? "rejected" : "failed");
        setErrorMessage(parsed.userMessage);
        setTechnicalDetails(parsed.technicalDetails ?? null);
        setActionHint(parsed.actionHint);

        return { success: false, error: parsed.userMessage };
      }
    },
    [account, isSepolia, signer, status]
  );

  return {
    createLoan,
    status,
    isLoading: status === "waiting_metamask" || status === "submitted" || status === "pending",
    txHash,
    newLoanId,
    errorMessage,
    technicalDetails,
    actionHint,
    reset,
  };
}
