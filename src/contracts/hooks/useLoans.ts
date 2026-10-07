"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatEther, ZeroAddress } from "ethers";
import { getReadOnlyMicroLoanContract } from "../microloan";
import { isContractConfigured, getMicroLoanContractAddress } from "../config";
import { Loan, LoanStatus, LoanStatusMap } from "@/types/loan";
import { parseContractError, formatDueDate } from "@/utils";
import { usePolling } from "./usePolling";

export interface UseLoansOptions {
  /**
   * Interval in milliseconds between auto-refresh polls.
   * Defaults to 10,000 ms (10 seconds).
   * Set to 0 to disable polling.
   */
  pollIntervalMs?: number;

  /**
   * Whether auto-refresh polling is enabled.
   * Defaults to true.
   */
  enabled?: boolean;

  /**
   * Whether to pause polling when the browser tab is hidden.
   * Defaults to true.
   */
  pauseOnHidden?: boolean;
}

export interface UseLoansResult {
  loans: Loan[];
  loanCount: number;
  /** True only during initial fetch before any data has loaded */
  isLoading: boolean;
  /** True when a background auto-refresh or manual refetch is actively in flight */
  isRefreshing: boolean;
  /** Timestamp of the last successful on-chain sync */
  lastUpdated: Date | null;
  /** Initial read error message (if initial fetch failed) */
  error: string | null;
  /** Initial read error technical details */
  errorDetails: string | null;
  /** Subtle warning if a background refresh failed (previous data is preserved) */
  refreshWarning: string | null;
  /** Trigger an immediate fresh read and restart the 10-second polling timer */
  refetch: () => Promise<void>;
}

/**
 * Compares two loan arrays to determine if on-chain data has meaningfully changed.
 * Avoids unnecessary re-renders when polling returns identical contract data.
 */
function areLoansEqual(prev: Loan[], next: Loan[]): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (
      p.id !== n.id ||
      p.status !== n.status ||
      p.statusCode !== n.statusCode ||
      p.borrower !== n.borrower ||
      p.lender !== n.lender ||
      p.principalRaw !== n.principalRaw ||
      p.repaymentRaw !== n.repaymentRaw ||
      p.dueDateTimestamp !== n.dueDateTimestamp
    ) {
      return false;
    }
  }
  return true;
}

export function useLoans(options: UseLoansOptions = {}): UseLoansResult {
  const {
    pollIntervalMs = 10_000,
    enabled = true,
    pauseOnHidden = true,
  } = options;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanCount, setLoanCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);

  // Track whether initial fetch has completed
  const hasLoadedInitialRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Core read-only on-chain fetch logic
  const fetchAllLoans = useCallback(async () => {
    if (!isContractConfigured()) {
      if (!isCancelledRef.current) {
        setError("MicroLoan contract address is not configured.");
        setIsLoading(false);
      }
      return;
    }

    try {
      const contract = getReadOnlyMicroLoanContract();
      let total = 0;
      let isZeroIndexed = false;

      // MicroLoan.sol uses nextLoanId() (0-indexed: loan IDs 0 .. nextLoanId - 1)
      if (typeof contract.nextLoanId === "function") {
        try {
          const countBigInt = await contract.nextLoanId();
          total = Number(countBigInt);
          isZeroIndexed = true;
        } catch (nextErr) {
          console.warn("[MicroLoan Contract] Could not read nextLoanId:", nextErr);
        }
      }

      // Fallback to loanCount() if nextLoanId failed or not present
      if (!isZeroIndexed && typeof contract.loanCount === "function") {
        try {
          const countBigInt = await contract.loanCount();
          total = Number(countBigInt);
        } catch (countErr) {
          console.warn("[MicroLoan Contract] Could not read loanCount:", countErr);
        }
      }

      if (isCancelledRef.current) return;
      setLoanCount(total);

      if (total === 0) {
        if (!isCancelledRef.current) {
          setLoans([]);
          setIsLoading(false);
          setLastUpdated(new Date());
          hasLoadedInitialRef.current = true;
          setRefreshWarning(null);
        }
        return;
      }

      // Fetch all loans in parallel
      const loanPromises: Promise<Loan | null>[] = [];
      const startIdx = isZeroIndexed ? 0 : 1;
      const endIdx = isZeroIndexed ? total : total + 1;

      for (let i = startIdx; i < endIdx; i++) {
        loanPromises.push(
          (async (loanId: number): Promise<Loan | null> => {
            try {
              // Call contract.loans(loanId) with fallback to getLoan(loanId)
              const res =
                typeof contract.loans === "function"
                  ? await contract.loans(loanId)
                  : await contract.getLoan(loanId);
              const borrower = res.borrower as string;

              if (!borrower || borrower.toLowerCase() === ZeroAddress.toLowerCase()) {
                return null;
              }

              const lender = res.lender as string;
              const principalRaw = BigInt(res.principal !== undefined ? res.principal : res.amount);
              const repaymentRaw = BigInt(res.repayment);
              const dueDateRaw = Number(res.dueDate);
              const statusCode = Number(res.status);

              const formattedDate = formatDueDate(dueDateRaw);

              // Smart contract alone determines status
              const resolvedStatus: LoanStatus = LoanStatusMap[statusCode] || "Requested";

              return {
                id: loanId,
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
            } catch (singleErr) {
              console.warn(`[MicroLoan Contract] Failed to fetch loan #${loanId}:`, singleErr);
              return null;
            }
          })(i)
        );
      }

      const results = await Promise.all(loanPromises);
      if (isCancelledRef.current) return;

      const validLoans = results.filter((l): l is Loan => l !== null);

      // Only update state reference if loans have actually changed (avoids re-rendering)
      setLoans((prev) => (areLoansEqual(prev, validLoans) ? prev : validLoans));

      setError(null);
      setErrorDetails(null);
      setRefreshWarning(null);
      setLastUpdated(new Date());
      hasLoadedInitialRef.current = true;
    } catch (err: unknown) {
      if (isCancelledRef.current) return;
      console.error("[MicroLoan Contract] Error reading loans from Sepolia:", err);

      const parsed = parseContractError(err, {
        operation: "getLoan / loanCount",
        contractAddress: getMicroLoanContractAddress(),
      });

      // If initial fetch failed, surface error state
      if (!hasLoadedInitialRef.current) {
        setError(parsed.userMessage);
        setErrorDetails(parsed.technicalDetails ?? null);
      } else {
        // If background refresh failed, preserve existing displayed data and set subtle warning
        setRefreshWarning("Auto-refresh temporarily paused. Retrying in 10s...");
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Hook into controlled reusable polling mechanism
  const {
    isPolling,
    triggerNow,
  } = usePolling(fetchAllLoans, {
    intervalMs: pollIntervalMs,
    enabled,
    pauseOnHidden,
    refreshOnVisible: true,
  });

  // Execute initial fetch on component mount
  useEffect(() => {
    isCancelledRef.current = false;
    void (async () => {
      await fetchAllLoans();
    })();

    return () => {
      isCancelledRef.current = true;
    };
  }, [fetchAllLoans]);

  return {
    loans,
    loanCount,
    isLoading,
    isRefreshing: isPolling,
    lastUpdated,
    error,
    errorDetails,
    refreshWarning,
    refetch: triggerNow,
  };
}
