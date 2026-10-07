"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEther, ZeroAddress } from "ethers";
import { getReadOnlyMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";
import { Loan, LoanStatus, LoanStatusMap } from "@/types/loan";
import { parseContractError, formatDueDate } from "@/utils";

export interface UseLoanDetailsResult {
  loan: Loan | null;
  raw: {
    borrower: string;
    lender: string;
    amount: bigint;
    repayment: bigint;
    dueDate: bigint;
    status: bigint;
  } | null;
  isLoading: boolean;
  error: string | null;
  errorDetails: string | null;
  loanCount: number | null;
  refetch: () => Promise<void>;
}

export function useLoanDetails(loanId: number | null | undefined): UseLoanDetailsResult {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [raw, setRaw] = useState<UseLoanDetailsResult["raw"]>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [loanCount, setLoanCount] = useState<number | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(async () => {
    setRefetchIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function executeQuery() {
      if (!isContractConfigured()) {
        if (!isCancelled) {
          setError("MicroLoan contract address is not configured.");
          setLoan(null);
          setIsLoading(false);
        }
        return;
      }

      if (loanId === undefined || loanId === null || loanId < 0) {
        if (!isCancelled) {
          setError(
            loanId !== undefined && loanId !== null
              ? "Invalid loan ID. ID must be greater than or equal to 0."
              : null
          );
          setLoan(null);
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
      }

      try {
        const contract = getReadOnlyMicroLoanContract();

        // Read total loan count (nextLoanId with fallback to loanCount)
        try {
          if (typeof contract.nextLoanId === "function") {
            const total = await contract.nextLoanId();
            if (!isCancelled) {
              setLoanCount(Number(total));
            }
          } else if (typeof contract.loanCount === "function") {
            const total = await contract.loanCount();
            if (!isCancelled) {
              setLoanCount(Number(total));
            }
          }
        } catch (countErr) {
          console.warn("[MicroLoan Contract] Could not read loan count:", countErr);
        }

        // Read specific loan
        const result =
          typeof contract.loans === "function"
            ? await contract.loans(loanId)
            : await contract.getLoan(loanId);
        const borrower = result.borrower as string;

        if (!isCancelled) {
          if (!borrower || borrower.toLowerCase() === ZeroAddress.toLowerCase()) {
            setError(`Loan #${loanId} does not exist on the Sepolia smart contract.`);
            setErrorDetails(null);
            setLoan(null);
            setIsLoading(false);
            return;
          }

          const lender = result.lender as string;
          const principalRaw = BigInt(result.principal !== undefined ? result.principal : result.amount);
          const repaymentRaw = BigInt(result.repayment);
          const dueDateRaw = Number(result.dueDate);
          const statusCode = Number(result.status);

          const formattedDate = formatDueDate(dueDateRaw);

          // Smart contract alone is responsible for determining status
          const resolvedStatus: LoanStatus = LoanStatusMap[statusCode] || "Requested";

          const parsedLoan: Loan = {
            id: loanId!,
            borrower,
            lender: lender && lender !== ZeroAddress ? lender : "-",
            principal: `${formatEther(principalRaw)} ETH`,
            principalRaw,
            repayment: `${formatEther(repaymentRaw)} ETH`,
            repaymentRaw,
            dueDate: formattedDate,
            dueDateTimestamp: dueDateRaw,
            status: resolvedStatus,
            statusCode,
          };

          setLoan(parsedLoan);
          setRaw({
            borrower,
            lender,
            amount: principalRaw,
            repayment: repaymentRaw,
            dueDate: BigInt(dueDateRaw),
            status: BigInt(statusCode),
          });
          setError(null);
          setErrorDetails(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error(`[MicroLoan Contract] Failed to read loan #${loanId}:`, err);
          const parsed = parseContractError(err, {
            operation: `getLoan(#${loanId})`,
            contractAddress: getMicroLoanContractAddress(),
          });
          setError(parsed.userMessage);
          setErrorDetails(parsed.technicalDetails ?? null);
          setLoan(null);
          setRaw(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    executeQuery();

    return () => {
      isCancelled = true;
    };
  }, [loanId, refetchIndex]);

  return {
    loan,
    raw,
    isLoading,
    error,
    errorDetails,
    loanCount,
    refetch,
  };
}
