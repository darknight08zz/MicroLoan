/**
 * Standardized Error Handling Utility for MicroLoan DApp.
 * Converts technical blockchain / ethers / RPC errors into user-friendly messages
 * while preserving full technical details for debugging.
 */

export type ErrorCategory =
  | "METAMASK_NOT_INSTALLED"
  | "WALLET_DISCONNECTED"
  | "WRONG_NETWORK"
  | "ACCOUNT_CHANGED"
  | "USER_REJECTED"
  | "INSUFFICIENT_FUNDS"
  | "CONTRACT_REVERT"
  | "INVALID_INPUT"
  | "CONTRACT_READ_FAILED"
  | "TRANSACTION_FAILED"
  | "UNKNOWN";

export interface ActionHint {
  label: string;
  url?: string;
  onClick?: () => void;
}

export interface ParsedError {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails?: string;
  actionHint?: ActionHint;
  isUserRejection: boolean;
}

export interface ErrorContext {
  operation?: string;
  loanId?: number;
  amount?: string;
  contractAddress?: string;
}

export const SEPOLIA_FAUCET_URL =
  "https://cloud.google.com/application/web3/faucet/ethereum/sepolia";
export const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";

/**
 * Extracts and formats full technical debugging info from an unknown error.
 */
function extractTechnicalDetails(err: unknown, context?: ErrorContext): string {
  const parts: string[] = [];

  if (context?.operation) {
    parts.push(`Operation: ${context.operation}`);
  }
  if (context?.loanId !== undefined) {
    parts.push(`Target Loan ID: #${context.loanId}`);
  }
  if (context?.amount) {
    parts.push(`Value: ${context.amount}`);
  }
  if (context?.contractAddress) {
    parts.push(`Contract: ${context.contractAddress}`);
  }

  if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;

    if (errObj.code) {
      parts.push(`Code: ${String(errObj.code)}`);
    }
    if (errObj.reason) {
      parts.push(`Reason: ${String(errObj.reason)}`);
    }
    if (errObj.shortMessage) {
      parts.push(`Short Message: ${String(errObj.shortMessage)}`);
    }
    if (errObj.message) {
      // Clean up repetitive ethers URLs from the debug text
      const cleanMessage = String(errObj.message).replace(
        /\[ See: https:\/\/links\.ethers\.org\/[^\]]+ \]/g,
        ""
      );
      parts.push(`Message: ${cleanMessage.trim()}`);
    }
    if (errObj.data) {
      parts.push(`Data: ${String(errObj.data)}`);
    }
    if (errObj.transaction) {
      try {
        parts.push(`Transaction: ${JSON.stringify(errObj.transaction)}`);
      } catch {
        // ignore stringify errors
      }
    }
    if (errObj.info) {
      try {
        parts.push(`Info: ${JSON.stringify(errObj.info)}`);
      } catch {
        // ignore stringify errors
      }
    }
  } else if (typeof err === "string") {
    parts.push(`Raw Error: ${err}`);
  } else {
    parts.push(`Raw: ${String(err)}`);
  }

  return parts.join("\n");
}

/**
 * Parses any blockchain / ethers / RPC error into a clean user-facing error
 * with an optional action hint and full debugging information preserved.
 */
export function parseContractError(err: unknown, context?: ErrorContext): ParsedError {
  const technicalDetails = extractTechnicalDetails(err, context);

  // Normalize all string error signals
  let rawStr = "";
  let errorCode: string | number | undefined;

  if (typeof err === "object" && err !== null) {
    const obj = err as {
      code?: string | number;
      message?: string;
      reason?: string;
      shortMessage?: string;
      info?: { error?: { code?: string | number; message?: string } };
    };

    errorCode = obj.code || obj.info?.error?.code;
    rawStr = [
      obj.reason,
      obj.shortMessage,
      obj.info?.error?.message,
      obj.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  } else if (typeof err === "string") {
    rawStr = err.toLowerCase();
  }

  // 1. User Rejection in MetaMask
  const isRejection =
    errorCode === "ACTION_REJECTED" ||
    errorCode === 4001 ||
    rawStr.includes("user rejected") ||
    rawStr.includes("user denied") ||
    rawStr.includes("transaction was rejected") ||
    rawStr.includes("request rejected") ||
    rawStr.includes("cancelled");

  if (isRejection) {
    return {
      category: "USER_REJECTED",
      userMessage: "Transaction was cancelled in your MetaMask wallet extension.",
      technicalDetails,
      actionHint: {
        label: "You can try again whenever you are ready.",
      },
      isUserRejection: true,
    };
  }

  // 2. Insufficient Sepolia ETH (Balance too low for value + gas)
  const isInsufficientFunds =
    errorCode === "INSUFFICIENT_FUNDS" ||
    errorCode === -32000 ||
    rawStr.includes("insufficient funds") ||
    rawStr.includes("exceeds the balance") ||
    rawStr.includes("gas required exceeds allowance") ||
    rawStr.includes("gas * price + value");

  if (isInsufficientFunds) {
    return {
      category: "INSUFFICIENT_FUNDS",
      userMessage:
        "Insufficient Sepolia ETH in your wallet to cover the transaction value and network gas fees.",
      technicalDetails,
      actionHint: {
        label: "Get Free Sepolia ETH from Google Web3 Faucet ↗",
        url: SEPOLIA_FAUCET_URL,
      },
      isUserRejection: false,
    };
  }

  // 3. Smart Contract Reverts (require() or custom errors)
  const isRevert =
    errorCode === "CALL_EXCEPTION" ||
    rawStr.includes("execution reverted") ||
    rawStr.includes("reverted") ||
    rawStr.includes("call_exception") ||
    rawStr.includes("revert");

  if (isRevert) {
    let specificRevertReason =
      "The Sepolia smart contract rejected the transaction. The loan conditions were not met.";

    if (rawStr.includes("borrower cannot fund own loan") || rawStr.includes("borrower cannot fund")) {
      specificRevertReason =
        "Contract Revert: Borrowers are not permitted to fund their own loan requests.";
    } else if (
      rawStr.includes("incorrect eth amount") ||
      rawStr.includes("incorrect funding amount") ||
      rawStr.includes("msg.value")
    ) {
      specificRevertReason =
        "Contract Revert: The ETH amount sent does not match the required loan principal.";
    } else if (rawStr.includes("incorrect repayment amount")) {
      specificRevertReason =
        "Contract Revert: The ETH amount sent does not match the required repayment amount.";
    } else if (rawStr.includes("only borrower can withdraw")) {
      specificRevertReason =
        "Contract Revert: Only the borrower who requested this loan is authorized to withdraw the funds.";
    } else if (rawStr.includes("loan not funded")) {
      specificRevertReason =
        "Contract Revert: This loan has not been funded by a lender yet.";
    } else if (rawStr.includes("loan not withdrawn")) {
      specificRevertReason =
        "Contract Revert: This loan has not been withdrawn by the borrower and cannot be repaid yet.";
    } else if (rawStr.includes("loan defaulted")) {
      specificRevertReason =
        "Contract Revert: This loan has defaulted and is closed to standard actions.";
    } else if (rawStr.includes("loan does not exist")) {
      specificRevertReason =
        "Contract Revert: This loan does not exist on the Sepolia smart contract.";
    }

    return {
      category: "CONTRACT_REVERT",
      userMessage: specificRevertReason,
      technicalDetails,
      actionHint: {
        label: "Verify your connected wallet and loan status, then try again.",
      },
      isUserRejection: false,
    };
  }

  // 4. Failed Contract Read or Public RPC Network Issues
  const isNetworkOrRpcFailure =
    rawStr.includes("network error") ||
    rawStr.includes("failed to fetch") ||
    rawStr.includes("fetch failed") ||
    rawStr.includes("could not detect network") ||
    rawStr.includes("timeout") ||
    rawStr.includes("429") ||
    rawStr.includes("rate limit") ||
    rawStr.includes("502") ||
    rawStr.includes("503") ||
    rawStr.includes("bad gateway") ||
    rawStr.includes("rpc error");

  if (isNetworkOrRpcFailure) {
    return {
      category: "CONTRACT_READ_FAILED",
      userMessage:
        "Unable to communicate with Ethereum Sepolia. The public RPC node may be congested or your internet connection was interrupted.",
      technicalDetails,
      actionHint: {
        label: "Check your internet connection or click Refresh to retry.",
      },
      isUserRejection: false,
    };
  }

  // 5. Transaction Mined but Reverted on-chain (status === 0)
  if (rawStr.includes("reverted on sepolia") || rawStr.includes("mined but reverted")) {
    return {
      category: "TRANSACTION_FAILED",
      userMessage:
        "The transaction was included in a Sepolia block but failed during smart contract execution.",
      technicalDetails,
      actionHint: {
        label: "View the transaction details on Sepolia Etherscan.",
      },
      isUserRejection: false,
    };
  }

  // 6. Generic Fallback
  return {
    category: "UNKNOWN",
    userMessage:
      context?.operation
        ? `Failed to complete ${context.operation} on Sepolia. Please try again.`
        : "An unexpected error occurred during the transaction.",
    technicalDetails,
    isUserRejection: false,
  };
}

/**
 * Validates Loan Request Form Inputs with human-friendly, specific error strings.
 */
export function validateLoanRequestInputs(
  principalEth: string,
  repaymentEth: string,
  dueDateStr: string
): {
  isValid: boolean;
  errors: {
    principal?: string;
    repayment?: string;
    dueDate?: string;
  };
} {
  const errors: {
    principal?: string;
    repayment?: string;
    dueDate?: string;
  } = {};

  // 1. Principal Validation
  const trimmedPrincipal = principalEth.trim();
  if (!trimmedPrincipal) {
    errors.principal = "Principal amount is required.";
  } else {
    const num = parseFloat(trimmedPrincipal);
    if (isNaN(num)) {
      errors.principal = "Please enter a valid numeric ETH amount.";
    } else if (num <= 0) {
      errors.principal = "Principal amount must be greater than 0 ETH.";
    } else if (num < 0.0001) {
      errors.principal = "Principal amount must be at least 0.0001 ETH.";
    } else {
      // Check decimal places (max 18 for wei)
      const decimalParts = trimmedPrincipal.split(".");
      if (decimalParts[1] && decimalParts[1].length > 18) {
        errors.principal = "Principal amount cannot exceed 18 decimal places.";
      }
    }
  }

  // 2. Repayment Validation
  const trimmedRepayment = repaymentEth.trim();
  if (!trimmedRepayment) {
    errors.repayment = "Repayment amount is required.";
  } else {
    const num = parseFloat(trimmedRepayment);
    const principalNum = parseFloat(trimmedPrincipal);
    if (isNaN(num)) {
      errors.repayment = "Please enter a valid numeric ETH amount.";
    } else if (num <= 0) {
      errors.repayment = "Repayment amount must be greater than 0 ETH.";
    } else if (!isNaN(principalNum) && principalNum > 0 && num <= principalNum) {
      errors.repayment = "Total repayment must be strictly greater than the principal amount.";
    } else {
      const decimalParts = trimmedRepayment.split(".");
      if (decimalParts[1] && decimalParts[1].length > 18) {
        errors.repayment = "Repayment amount cannot exceed 18 decimal places.";
      }
    }
  }

  // 3. Due Date Validation
  if (!dueDateStr) {
    errors.dueDate = "Please select a repayment due date.";
  } else {
    const parts = dueDateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      errors.dueDate = "Please enter a valid calendar date.";
    } else {
      const [y, m, d] = parts;
      const dateObj = new Date(y, m - 1, d, 23, 59, 59, 999);
      const targetTimestamp = Math.floor(dateObj.getTime() / 1000);
      const nowTimestamp = Math.floor(Date.now() / 1000);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const selectedDayStart = new Date(y, m - 1, d, 0, 0, 0, 0);

      if (isNaN(targetTimestamp)) {
        errors.dueDate = "Please enter a valid calendar date.";
      } else if (selectedDayStart.getTime() < todayStart.getTime()) {
        errors.dueDate = "Due date cannot be in the past.";
      } else if (targetTimestamp <= nowTimestamp) {
        errors.dueDate = "Due date must be in the future.";
      } else {
        const maxFutureSeconds = 5 * 365 * 24 * 3600; // 5 years
        if (targetTimestamp - nowTimestamp > maxFutureSeconds) {
          errors.dueDate = "Due date cannot exceed 5 years in the future.";
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
