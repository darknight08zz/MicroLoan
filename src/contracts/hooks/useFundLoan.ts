import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { getSignerMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";
import { Loan } from "@/types/loan";

import { TxLifecycleStatus } from "@/components/ui/TransactionBanner";
import { parseContractError, ActionHint } from "@/utils";

export type FundTransactionStatus = TxLifecycleStatus;

export interface FundLoanResult {
  fundLoan: (
    loan: Loan,
    onSuccess?: () => Promise<void> | void
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  status: TxLifecycleStatus;
  isLoading: boolean;
  activeLoanId: number | null;
  txHash: string | null;
  fundedLoanId: number | null;
  fundedAmountFormatted: string | null;
  errorMessage: string | null;
  technicalDetails: string | null;
  actionHint?: ActionHint;
  reset: () => void;
}

/**
 * Reusable hook to execute lender funding of requested loans on Sepolia.
 * Calls contract.fund(loanId, { value: loan.principalRaw }) with exact principal ETH value.
 * Handles duplicate clicks, self-funding guard, MetaMask lifecycle, and contract reverts.
 */
export function useFundLoan(): FundLoanResult {
  const { account, isSepolia, signer } = useWallet();

  const [status, setStatus] = useState<TxLifecycleStatus>("ready");
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [fundedLoanId, setFundedLoanId] = useState<number | null>(null);
  const [fundedAmountFormatted, setFundedAmountFormatted] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<ActionHint | undefined>(undefined);

  const reset = useCallback(() => {
    setStatus("ready");
    setActiveLoanId(null);
    setTxHash(null);
    setFundedLoanId(null);
    setFundedAmountFormatted(null);
    setErrorMessage(null);
    setTechnicalDetails(null);
    setActionHint(undefined);
  }, []);

  const fundLoan = useCallback(
    async (
      loan: Loan,
      onSuccess?: () => Promise<void> | void
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      // 1. Guard against duplicate clicks while a transaction is in flight
      if (activeLoanId !== null || status === "waiting_metamask" || status === "submitted" || status === "pending") {
        console.warn("[useFundLoan] Funding transaction already in progress. Ignoring duplicate click.");
        return { success: false, error: "Funding already in progress." };
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
        const msg = "Please connect your wallet to fund this loan.";
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

      // 5. Self-funding guard: Borrower cannot fund their own loan
      if (loan.borrower.toLowerCase() === account.toLowerCase()) {
        const msg = "Borrower cannot fund own loan. Please switch to a different wallet to fund this request.";
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 6. Status check: Only "Requested" loans can be funded
      if (loan.status !== "Requested") {
        const msg = `Cannot fund: Loan #${loan.id} has status "${loan.status}". Only open requested loans can be funded.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      // 7. Principal amount validation
      if (!loan.principalRaw || loan.principalRaw <= BigInt(0)) {
        const msg = `Invalid principal amount (${loan.principal}) for Loan #${loan.id}.`;
        setStatus("failed");
        setErrorMessage(msg);
        return { success: false, error: msg };
      }

      try {
        const contract = getSignerMicroLoanContract(signer);
        if (typeof contract.loans === "function") {
          const liveLoan = await contract.loans(loan.id);
          const liveStatusCode = Number(liveLoan.status);
          if (liveStatusCode !== 0) {
            const statusNames = ["Requested", "Funded", "Withdrawn", "Repaid", "Defaulted"];
            const currentStatusName = statusNames[liveStatusCode] || `Status #${liveStatusCode}`;
            const msg = `Cannot fund Loan #${loan.id}: This loan is currently in "${currentStatusName}" state on-chain and is no longer open for funding.`;
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }

          if (liveLoan.borrower && liveLoan.borrower.toLowerCase() === account.toLowerCase()) {
            const msg = "Borrower cannot fund own loan. Please switch to a different wallet to fund this request.";
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }

          const nowSec = Math.floor(Date.now() / 1000);
          if (liveLoan.dueDate && nowSec > Number(liveLoan.dueDate)) {
            const msg = `Cannot fund Loan #${loan.id}: The funding deadline has already passed on-chain.`;
            setStatus("failed");
            setErrorMessage(msg);
            return { success: false, error: msg };
          }
        }
      } catch (preCheckErr) {
        console.warn("[useFundLoan] Note: Live on-chain pre-check could not be completed, proceeding to transaction:", preCheckErr);
      }

      // 9. Execution Lifecycle: Waiting for MetaMask
      setActiveLoanId(loan.id);
      setStatus("waiting_metamask");
      setErrorMessage(null);
      setTxHash(null);
      setFundedLoanId(null);
      setFundedAmountFormatted(loan.principal);

      try {
        const contract = getSignerMicroLoanContract(signer);

        // Call fund(loanId) sending exactly loan.principalRaw as msg.value
        const tx = await contract.fund(loan.id, { value: loan.principalRaw });

        const hash = tx.hash as string;
        setTxHash(hash);
        setStatus("pending");

        // Wait for 1 block confirmation on Sepolia
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status === 0) {
          throw new Error("Funding transaction was mined but reverted on Sepolia.");
        }

        setFundedLoanId(loan.id);
        setStatus("confirmed");

        // Execute post-confirmation refresh callback
        if (onSuccess) {
          try {
            await onSuccess();
          } catch (refreshErr) {
            console.warn("[useFundLoan] Post-funding refresh failed:", refreshErr);
          }
        }

        return {
          success: true,
          txHash: hash,
        };
      } catch (err: unknown) {
        console.error(`[useFundLoan] Failed to fund Loan #${loan.id}:`, err);

        const parsed = parseContractError(err, {
          operation: `fund(Loan #${loan.id})`,
          loanId: loan.id,
          amount: loan.principal,
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
    fundLoan,
    status,
    isLoading: status === "waiting_metamask" || status === "submitted" || status === "pending",
    activeLoanId,
    txHash,
    fundedLoanId,
    fundedAmountFormatted,
    errorMessage,
    technicalDetails,
    actionHint,
    reset,
  };
}
