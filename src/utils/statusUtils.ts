import { LoanStatus, LoanStatusMap } from "@/types/loan";

export interface ResolveLoanStatusParams {
  statusCode: number;
  dueDateTimestamp: number;
  wasWithdrawn?: boolean;
  lender?: string;
  nowTimestamp?: number;
}

export function resolveLoanStatus({
  statusCode,
  dueDateTimestamp,
  wasWithdrawn = false,
  lender,
  nowTimestamp = Math.floor(Date.now() / 1000),
}: ResolveLoanStatusParams): LoanStatus {
  const isPastDue = dueDateTimestamp > 0 && nowTimestamp > dueDateTimestamp;

  if (statusCode === 5) {
    return "Cancelled";
  }

  if (statusCode === 4) {
    if (!wasWithdrawn) {
      return "Cancelled";
    }
    if (lender && (lender === "0x0000000000000000000000000000000000000000" || lender === "-")) {
      return "Cancelled";
    }
    return "Defaulted";
  }

  if (statusCode === 0 && isPastDue) {
    return "Cancelled";
  }

  if (statusCode === 1 && isPastDue) {
    return "Cancelled";
  }

  if (statusCode === 2 && isPastDue) {
    return "Defaulted";
  }

  return LoanStatusMap[statusCode] || "Requested";
}
